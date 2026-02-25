import type { FormDescriptor } from "../introspection";

export interface SchemaWriterOptions {
  /** The FormDescriptor to convert */
  form: FormDescriptor;
}

export interface SchemaWriterResult {
  /** Generated Zod v4 source code */
  code: string;
  /** Warnings from generation (e.g., unsupported features skipped) */
  warnings: string[];
}
