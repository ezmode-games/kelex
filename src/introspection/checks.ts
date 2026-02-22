import type { $ZodType } from "zod/v4/core";
import type { FieldConstraints } from "./types";

interface ZodCheckDef {
  check: string;
  minimum?: number;
  maximum?: number;
  value?: number;
  format?: string;
  pattern?: RegExp;
}

interface ZodCheck {
  _zod?: { def?: ZodCheckDef };
  format?: string;
  isInt?: boolean;
}

const KNOWN_FORMATS = new Set([
  "email",
  "url",
  "uuid",
  "cuid",
  "datetime",
] as const);

/**
 * Extracts validation constraints from a Zod schema's checks array.
 * Must be called on unwrapped schema (not optional wrapper).
 *
 * If called on an optional wrapper schema, this function will simply return
 * an empty object, because optional wrappers themselves do not carry checks.
 */
export function extractConstraints(
  schema: $ZodType,
  unknownChecks?: string[],
): FieldConstraints {
  const def = schema._zod.def as {
    type: string;
    checks?: ZodCheck[];
  };

  const checks = def.checks;
  if (!checks || !Array.isArray(checks)) {
    return {};
  }

  const constraints: FieldConstraints = {};

  for (const check of checks) {
    const checkDef = check._zod?.def;
    if (!checkDef) continue;

    switch (checkDef.check) {
      case "min_length":
        if (checkDef.minimum !== undefined) {
          constraints.minLength = checkDef.minimum;
        }
        break;

      case "max_length":
        if (checkDef.maximum !== undefined) {
          constraints.maxLength = checkDef.maximum;
        }
        break;

      case "string_format":
        if (checkDef.format === "regex" && checkDef.pattern) {
          constraints.pattern = checkDef.pattern.source;
        } else if (
          checkDef.format &&
          KNOWN_FORMATS.has(
            checkDef.format as FieldConstraints["format"] & string,
          )
        ) {
          constraints.format = checkDef.format as FieldConstraints["format"];
        }
        break;

      case "greater_than":
        if (checkDef.value !== undefined) {
          constraints.min = checkDef.value;
        }
        break;

      case "less_than":
        if (checkDef.value !== undefined) {
          constraints.max = checkDef.value;
        }
        break;

      case "number_format":
        if (check.isInt) {
          constraints.isInt = true;
        }
        break;

      case "multiple_of":
        if (checkDef.value !== undefined) {
          constraints.step = checkDef.value;
        }
        break;

      default:
        unknownChecks?.push(checkDef.check);
        break;
    }
  }

  return constraints;
}
