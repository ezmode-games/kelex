import type { $ZodType } from "zod/v4/core";

export interface UnwrapResult {
  /** The innermost non-wrapper schema */
  inner: $ZodType;
  /** Whether z.optional() was present */
  isOptional: boolean;
  /** Whether z.nullable() was present */
  isNullable: boolean;
}

/** Type guard to check if schema has unwrap method */
function hasUnwrap(
  schema: $ZodType,
): schema is { unwrap: () => $ZodType } & $ZodType {
  return (
    typeof (schema as unknown as Record<string, unknown>).unwrap === "function"
  );
}

/** Validates that the schema is a Zod 4 schema with required properties */
function isValidZod4Schema(schema: unknown): schema is $ZodType {
  if (!schema || typeof schema !== "object") return false;
  const zod = (schema as Record<string, unknown>)._zod;
  if (!zod || typeof zod !== "object") return false;
  const def = (zod as Record<string, unknown>).def;
  return !!def && typeof def === "object" && "type" in def;
}

/**
 * Unwraps optional wrapper from a Zod schema.
 * Handles: z.optional(), z.string().optional()
 */
export function unwrapSchema(schema: $ZodType): UnwrapResult {
  if (!isValidZod4Schema(schema)) {
    throw new Error("Schema is not a valid Zod 4 schema");
  }

  let current = schema;
  let isOptional = false;
  let isNullable = false;

  while (
    current._zod.def.type === "optional" ||
    current._zod.def.type === "nullable"
  ) {
    if (current._zod.def.type === "optional") {
      isOptional = true;
    } else {
      isNullable = true;
    }
    if (!hasUnwrap(current)) {
      throw new Error(`${current._zod.def.type} schema missing unwrap method`);
    }
    current = current.unwrap();
  }

  return { inner: current, isOptional, isNullable };
}
