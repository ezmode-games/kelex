import { inferTypeName } from "../codegen";
import { emitField } from "./field-emitter";
import type { SchemaWriterOptions, SchemaWriterResult } from "./types";

/**
 * Generates Zod v4 source code from a FormDescriptor.
 * Only supports scalar types and arrays of scalars/enums.
 * Throws on unsupported field types (object, union, tuple, record).
 */
export function writeSchema(options: SchemaWriterOptions): SchemaWriterResult {
  const { form } = options;

  const fieldEntries = form.fields.map(
    (field) => `  ${field.name}: ${emitField(field)},`,
  );

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
