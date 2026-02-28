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

  /**
   * Reference to a named schema export. When set, the schema-writer emits the
   * identifier directly instead of inlining the Zod expression.
   * Example: "addressSchema" causes the field to emit `addressSchema` rather
   * than `z.object({ ... })`.
   */
  schemaRef?: string;
}

/** A single step in a multi-step (wizard) form */
export interface FormStep {
  /** Unique identifier for the step */
  id: string;

  /** Human-readable label shown in the step indicator */
  label: string;

  /** Optional description for the step */
  description?: string;

  /** Field names belonging to this step */
  fields: string[];
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

  /** Steps for multi-step (wizard) form generation. When undefined, a single-step form is generated. */
  steps?: FormStep[];
}
