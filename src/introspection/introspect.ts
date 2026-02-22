import type { $ZodType } from "zod/v4/core";
import { extractConstraints } from "./checks";
import type {
  FieldDescriptor,
  FieldMetadata,
  FieldType,
  FormDescriptor,
} from "./types";
import { unwrapSchema } from "./unwrap";

export interface IntrospectOptions {
  /** Name for the generated form component */
  formName: string;
  /** Import path for the schema file */
  schemaImportPath: string;
  /** Exported name of the schema */
  schemaExportName: string;
}

interface ZodObjectDef {
  type: string;
  shape: Record<string, $ZodType>;
}

interface ZodEnumDef {
  type: string;
  entries: Record<string, string>;
}

const SUPPORTED_TYPES = [
  "string",
  "number",
  "boolean",
  "date",
  "enum",
] as const;

/**
 * Converts a camelCase or PascalCase field name to a human-readable label.
 * Examples: "firstName" -> "First Name", "email" -> "Email", "isActive" -> "Is Active",
 * "URLPath" -> "URL Path", "myURLPath" -> "My URL Path".
 * Preserves consecutive uppercase letters (acronyms) like "URL", "ID".
 */
function nameToLabel(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2") // Insert space between lower/digit and upper
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2") // Insert space between acronym and following word
    .replace(/^./, (s) => s.toUpperCase()) // Capitalize first letter
    .trim();
}

/**
 * Builds FieldMetadata based on the field type.
 */
function buildMetadata(inner: $ZodType): FieldMetadata {
  const def = inner._zod.def as { type: string };

  switch (def.type) {
    case "enum": {
      const enumDef = def as ZodEnumDef;
      const values = Object.keys(enumDef.entries);
      if (values.length === 0) {
        throw new Error("Enum field has zero values");
      }
      return { kind: "enum", values };
    }
    case "string":
      return { kind: "string" };
    case "number":
      return { kind: "number" };
    case "boolean":
      return { kind: "boolean" };
    case "date":
      return { kind: "date" };
    default:
      throw new Error(`Unsupported type "${def.type}" in buildMetadata`);
  }
}

/**
 * Introspects a Zod object schema and returns a FormDescriptor.
 * Only accepts z.object() schemas at the top level.
 */
export function introspect(
  schema: $ZodType,
  options: IntrospectOptions,
): FormDescriptor {
  const def = schema._zod.def as ZodObjectDef;

  if (def.type !== "object") {
    throw new Error(
      "phantom-zone only supports z.object() schemas at the top level",
    );
  }

  const fields: FieldDescriptor[] = [];
  const warnings: string[] = [];

  for (const [name, fieldSchema] of Object.entries(def.shape)) {
    const { inner, isOptional, isNullable } = unwrapSchema(fieldSchema);
    const type = (inner._zod.def as { type: string }).type;

    if (!SUPPORTED_TYPES.includes(type as FieldType)) {
      throw new Error(
        `Unsupported field type "${type}" for field "${name}". Supported: ${SUPPORTED_TYPES.join(", ")}`,
      );
    }

    const unknownChecks: string[] = [];
    const constraints = extractConstraints(inner, unknownChecks);

    for (const check of unknownChecks) {
      warnings.push(
        `Field "${name}": unknown Zod check "${check}" -- constraint not reflected in generated form`,
      );
    }

    const description =
      (inner as { description?: string }).description ??
      (fieldSchema as { description?: string }).description;

    fields.push({
      name,
      label: nameToLabel(name),
      type: type as FieldType,
      isOptional,
      isNullable,
      constraints,
      metadata: buildMetadata(inner),
      ...(description ? { description } : {}),
    });
  }

  return {
    name: options.formName,
    fields,
    schemaImportPath: options.schemaImportPath,
    schemaExportName: options.schemaExportName,
    ...(warnings.length > 0 ? { warnings } : {}),
  };
}
