import type { $ZodType } from "zod/v4/core";
import { introspect } from "../introspection";
import type { ComponentConfig } from "../mapping";
import { resolveField } from "../mapping";
import { generateFormFile } from "./templates";

export interface GenerateOptions {
  /** The Zod schema to generate from */
  schema: $ZodType;

  /** Name for the form component */
  formName: string;

  /** Import path for the schema */
  schemaImportPath: string;

  /** Exported name of the schema */
  schemaExportName: string;

  /** UI component import path */
  uiImportPath?: string;
}

export interface GenerateResult {
  /** The generated form component code */
  code: string;

  /** List of fields that were processed */
  fields: string[];

  /** Any warnings (e.g., unsupported features skipped) */
  warnings: string[];
}

/**
 * Generates a form component from a Zod schema.
 */
export function generate(options: GenerateOptions): GenerateResult {
  const {
    schema,
    formName,
    schemaImportPath,
    schemaExportName,
    uiImportPath = "@/components/ui",
  } = options;

  const processedFields: string[] = [];
  const fieldConfigs = new Map<string, ComponentConfig>();

  const formDescriptor = introspect(schema, {
    formName,
    schemaImportPath,
    schemaExportName,
  });

  for (const field of formDescriptor.fields) {
    const config = resolveField(field);
    fieldConfigs.set(field.name, config);
    processedFields.push(field.name);
  }

  const code = generateFormFile({
    form: formDescriptor,
    fieldConfigs,
    uiImportPath,
  });

  return {
    code,
    fields: processedFields,
    warnings: formDescriptor.warnings ?? [],
  };
}
