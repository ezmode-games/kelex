import { inferTypeName } from "../codegen";
import { emitField, VALID_IDENTIFIER } from "./field-emitter";
import type { SchemaWriterOptions, SchemaWriterResult } from "./types";

/**
 * Generates Zod v4 source code from a FormDescriptor.
 * Supports scalar types, arrays, tuples, nested objects, and unions (plain and discriminated).
 * Throws on unsupported field types (record).
 */
export function writeSchema(options: SchemaWriterOptions): SchemaWriterResult {
  const { form } = options;

  const fieldEntries = form.fields.map((field) => {
    const key = VALID_IDENTIFIER.test(field.name)
      ? field.name
      : JSON.stringify(field.name);
    return `  ${key}: ${emitField(field)},`;
  });

  const typeName = inferTypeName(form.schemaExportName);

  const code = [
    'import { z } from "zod/v4";',
    "",
    `export const ${form.schemaExportName} = z.object({`,
    ...fieldEntries,
    "});",
    "",
    `export type ${typeName} = z.infer<typeof ${form.schemaExportName}>;`,
    "",
  ].join("\n");

  return { code, warnings: [] };
}
