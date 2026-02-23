/** Supported field types after unwrapping */
export type FieldType =
  | "string"
  | "number"
  | "boolean"
  | "date"
  | "enum"
  | "object"
  | "array"
  | "union"
  | "tuple"
  | "record";

/** Validation constraints extracted from Zod checks */
export interface FieldConstraints {
  // String constraints
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: "email" | "url" | "uuid" | "cuid" | "datetime";

  // Number constraints
  min?: number;
  max?: number;
  step?: number;
  isInt?: boolean;

  // Array constraints
  minItems?: number;
  maxItems?: number;
}

/** Type-specific metadata */
export type FieldMetadata =
  | { kind: "string" }
  | { kind: "number" }
  | { kind: "boolean" }
  | { kind: "date" }
  | { kind: "enum"; values: readonly string[] }
  | { kind: "object"; fields: FieldDescriptor[] }
  | { kind: "array"; element: FieldDescriptor }
  | {
      kind: "union";
      discriminator?: string;
      variants: { value: string; fields: FieldDescriptor[] }[];
    }
  | { kind: "tuple"; elements: FieldDescriptor[] }
  | { kind: "record"; valueDescriptor: FieldDescriptor };

/** Single field descriptor */
export interface FieldDescriptor {
  /** Original key name from schema shape */
  name: string;

  /** Human-readable label derived from name */
  label: string;

  /** Description from schema.describe() */
  description?: string;

  /** Core type after unwrapping optional/nullable */
  type: FieldType;

  /** Whether wrapped in z.optional() */
  isOptional: boolean;

  /** Whether wrapped in z.nullable() */
  isNullable: boolean;

  /** Validation constraints */
  constraints: FieldConstraints;

  /** Type-specific metadata (e.g., enum values) */
  metadata: FieldMetadata;
}

/** Complete form descriptor */
export interface FormDescriptor {
  /** Form name for the generated component */
  name: string;

  /** All fields in order */
  fields: FieldDescriptor[];

  /** Import path for the schema */
  schemaImportPath: string;

  /** Exported schema name */
  schemaExportName: string;

  /** Warnings from introspection (e.g., skipped features) */
  warnings: string[];
}
