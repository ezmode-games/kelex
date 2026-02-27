import { inferTypeName } from "../codegen";
import type { FieldDescriptor, FormDescriptor } from "../introspection";
import { emitField } from "./field-emitter";
import type {
  EmbeddedSchema,
  SchemaWriterOptions,
  SchemaWriterResult,
} from "./types";

/**
 * Generates Zod v4 source code from a FormDescriptor.
 *
 * When embeddedSchemas are provided, they are emitted as separate
 * `export const` + `export type` declarations before the primary schema.
 * Declarations are topologically sorted so dependencies appear first.
 */
export function writeSchema(options: SchemaWriterOptions): SchemaWriterResult {
  const { form, embeddedSchemas } = options;

  const lines: string[] = ['import { z } from "zod/v4";', ""];

  if (embeddedSchemas && embeddedSchemas.length > 0) {
    const sorted = topologicalSort(embeddedSchemas);
    for (const schema of sorted) {
      lines.push(...emitSchemaDeclaration(schema.form));
      lines.push("");
    }
  }

  lines.push(...emitSchemaDeclaration(form));
  lines.push("");

  return { code: lines.join("\n"), warnings: [] };
}

/**
 * Emits a single schema declaration block:
 *   export const fooSchema = z.object({ ... });
 *   export type Foo = z.infer<typeof fooSchema>;
 */
function emitSchemaDeclaration(form: FormDescriptor): string[] {
  const fieldEntries = form.fields.map(
    (field) => `  ${field.name}: ${emitField(field)},`,
  );

  const typeName = inferTypeName(form.schemaExportName);

  return [
    `export const ${form.schemaExportName} = z.object({`,
    ...fieldEntries,
    "});",
    "",
    `export type ${typeName} = z.infer<typeof ${form.schemaExportName}>;`,
  ];
}

/**
 * Collects all schemaRef identifiers used by a FormDescriptor's fields,
 * recursing into nested objects and array elements.
 */
function collectSchemaRefs(form: FormDescriptor): Set<string> {
  const refs = new Set<string>();

  function walk(fields: FieldDescriptor[]): void {
    for (const field of fields) {
      if (field.schemaRef) {
        refs.add(field.schemaRef);
      }
      if (field.metadata.kind === "object") {
        walk(field.metadata.fields);
      }
      if (field.metadata.kind === "array" && field.metadata.element) {
        walk([field.metadata.element]);
      }
    }
  }

  walk(form.fields);
  return refs;
}

/**
 * Topologically sorts embedded schemas so that dependencies (schemas
 * referenced by other schemas) are emitted before their dependents.
 *
 * Uses Kahn's algorithm. Throws on circular references.
 */
function topologicalSort(schemas: EmbeddedSchema[]): EmbeddedSchema[] {
  const names = schemas.map((s) => s.form.schemaExportName);
  const nameSet = new Set(names);

  // Map each schema name to its EmbeddedSchema and adjacency list
  const byName = new Map<string, EmbeddedSchema>();
  // adj: dependency -> list of dependents (edge means "must come before")
  const adj = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  for (const schema of schemas) {
    const name = schema.form.schemaExportName;
    byName.set(name, schema);
    adj.set(name, []);
    inDegree.set(name, 0);
  }

  // For each schema, find which other embedded schemas it references.
  // If schema A references schema B, then B must come before A:
  // edge B -> A in the adjacency list, and A's in-degree increments.
  for (const schema of schemas) {
    const name = schema.form.schemaExportName;
    const refs = collectSchemaRefs(schema.form);
    for (const ref of refs) {
      if (nameSet.has(ref) && ref !== name) {
        const neighbors = adj.get(ref) ?? [];
        neighbors.push(name);
        adj.set(ref, neighbors);
        inDegree.set(name, (inDegree.get(name) ?? 0) + 1);
      }
    }
  }

  // Kahn's algorithm: start with nodes that have no incoming edges
  const queue: string[] = [];
  for (const name of names) {
    if ((inDegree.get(name) ?? 0) === 0) {
      queue.push(name);
    }
  }

  const sorted: EmbeddedSchema[] = [];
  while (queue.length > 0) {
    const current = queue.shift() ?? "";
    const schema = byName.get(current);
    if (schema) {
      sorted.push(schema);
    }

    for (const neighbor of adj.get(current) ?? []) {
      const newDegree = (inDegree.get(neighbor) ?? 1) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) {
        queue.push(neighbor);
      }
    }
  }

  if (sorted.length !== schemas.length) {
    throw new Error(
      "Circular reference detected among embedded schemas. " +
        "All schema references must form a directed acyclic graph.",
    );
  }

  return sorted;
}
