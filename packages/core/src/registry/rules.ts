import { z } from "zod";
import type {
  InputTypeId,
  ValidationRuleCategory,
  ValidationRuleDefinition,
  ValidationRuleId,
  ValidationRuleRegistry,
} from "./types";

/**
 * Creates a new validation rule registry instance.
 * The registry stores rule definitions and provides methods to manage them.
 */
export function createValidationRuleRegistry(): ValidationRuleRegistry {
  const registry = new Map<ValidationRuleId, ValidationRuleDefinition>();

  return {
    register(definition: ValidationRuleDefinition): void {
      if (registry.has(definition.id)) {
        throw new Error(
          `Validation rule "${definition.id}" is already registered. ` +
            "Use unregister() first if you want to replace it."
        );
      }
      registry.set(definition.id, definition);
    },

    get(id: ValidationRuleId): ValidationRuleDefinition | undefined {
      return registry.get(id);
    },

    getAll(): ValidationRuleDefinition[] {
      return Array.from(registry.values());
    },

    getByCategory(category: ValidationRuleCategory): ValidationRuleDefinition[] {
      return Array.from(registry.values()).filter(
        (def) => def.category === category
      );
    },

    getCompatibleRules(inputType: InputTypeId): ValidationRuleDefinition[] {
      return Array.from(registry.values()).filter((def) =>
        def.compatibleInputs.includes(inputType)
      );
    },

    has(id: ValidationRuleId): boolean {
      return registry.has(id);
    },

    unregister(id: ValidationRuleId): boolean {
      return registry.delete(id);
    },

    clear(): void {
      registry.clear();
    },
  };
}

// ============================================================================
// Constraint Rules
// ============================================================================

/**
 * Required rule - value must be present (non-empty).
 * Compatible with all input types.
 */
export const requiredRuleDefinition: ValidationRuleDefinition = {
  id: "required",
  name: "Required",
  icon: "asterisk",
  category: "constraint",
  compatibleInputs: [
    "text",
    "textarea",
    "number",
    "checkbox",
    "select",
    "multiselect",
    "date",
    "file",
  ],
  configComponent: "RequiredConfig",
  description: "Field must have a value",
  defaultConfig: {},
  toZod: (_config: unknown) => (schema: unknown) => {
    // For strings, use min(1) to require non-empty
    if (schema instanceof z.ZodString) {
      return schema.min(1, "This field is required");
    }
    // For arrays (multiselect, file[]), use min(1)
    if (schema instanceof z.ZodArray) {
      return schema.min(1, "At least one item is required");
    }
    // For booleans (checkbox), refine to require true
    if (schema instanceof z.ZodBoolean) {
      return schema.refine((val) => val === true, "This field is required");
    }
    // For nullable types, make them non-nullable
    if (schema instanceof z.ZodNullable) {
      return schema.unwrap();
    }
    // For optional types, make them required
    if (schema instanceof z.ZodOptional) {
      return schema.unwrap();
    }
    return schema;
  },
};

/**
 * Min Items rule - array must have at least N items.
 * Compatible with multi-select and file (multiple).
 */
export const minItemsRuleDefinition: ValidationRuleDefinition = {
  id: "minItems",
  name: "Min Items",
  icon: "list-minus",
  category: "constraint",
  compatibleInputs: ["multiselect", "file"],
  configComponent: "MinItemsConfig",
  description: "Minimum number of items required",
  defaultConfig: { min: 1 },
  toZod: (config: unknown) => (schema: unknown) => {
    const { min } = config as { min: number };
    if (schema instanceof z.ZodArray) {
      return schema.min(min, `At least ${min} item(s) required`);
    }
    return schema;
  },
};

/**
 * Max Items rule - array must have at most N items.
 * Compatible with multi-select and file (multiple).
 */
export const maxItemsRuleDefinition: ValidationRuleDefinition = {
  id: "maxItems",
  name: "Max Items",
  icon: "list-plus",
  category: "constraint",
  compatibleInputs: ["multiselect", "file"],
  configComponent: "MaxItemsConfig",
  description: "Maximum number of items allowed",
  defaultConfig: { max: 10 },
  toZod: (config: unknown) => (schema: unknown) => {
    const { max } = config as { max: number };
    if (schema instanceof z.ZodArray) {
      return schema.max(max, `At most ${max} item(s) allowed`);
    }
    return schema;
  },
};

// ============================================================================
// Text Length Rules (Range category)
// ============================================================================

/**
 * Min Length rule - string must be at least N characters.
 * Compatible with text inputs.
 */
export const minLengthRuleDefinition: ValidationRuleDefinition = {
  id: "minLength",
  name: "Min Length",
  icon: "text-cursor-input",
  category: "range",
  compatibleInputs: ["text", "textarea"],
  configComponent: "MinLengthConfig",
  description: "Minimum character count",
  defaultConfig: { length: 1 },
  toZod: (config: unknown) => (schema: unknown) => {
    const { length } = config as { length: number };
    if (schema instanceof z.ZodString) {
      return schema.min(length, `Must be at least ${length} character(s)`);
    }
    return schema;
  },
};

/**
 * Max Length rule - string must be at most N characters.
 * Compatible with text inputs.
 */
export const maxLengthRuleDefinition: ValidationRuleDefinition = {
  id: "maxLength",
  name: "Max Length",
  icon: "text-cursor",
  category: "range",
  compatibleInputs: ["text", "textarea"],
  configComponent: "MaxLengthConfig",
  description: "Maximum character count",
  defaultConfig: { length: 255 },
  toZod: (config: unknown) => (schema: unknown) => {
    const { length } = config as { length: number };
    if (schema instanceof z.ZodString) {
      return schema.max(length, `Must be at most ${length} character(s)`);
    }
    return schema;
  },
};

// ============================================================================
// Format Rules
// ============================================================================

/**
 * Pattern rule - string must match a regex pattern.
 * Compatible with text inputs.
 */
export const patternRuleDefinition: ValidationRuleDefinition = {
  id: "pattern",
  name: "Pattern",
  icon: "regex",
  category: "format",
  compatibleInputs: ["text", "textarea"],
  configComponent: "PatternConfig",
  description: "Must match a regular expression pattern",
  defaultConfig: { pattern: ".*", message: "Invalid format" },
  toZod: (config: unknown) => (schema: unknown) => {
    const { pattern, message } = config as { pattern: string; message?: string };
    if (schema instanceof z.ZodString) {
      return schema.regex(new RegExp(pattern), message ?? "Invalid format");
    }
    return schema;
  },
};

/**
 * Email rule - string must be a valid email address.
 * Compatible with text input.
 */
export const emailRuleDefinition: ValidationRuleDefinition = {
  id: "email",
  name: "Email",
  icon: "mail",
  category: "format",
  compatibleInputs: ["text"],
  configComponent: "EmailConfig",
  description: "Must be a valid email address",
  defaultConfig: {},
  toZod: (_config: unknown) => (schema: unknown) => {
    if (schema instanceof z.ZodString) {
      return schema.email("Must be a valid email address");
    }
    return schema;
  },
};

/**
 * URL rule - string must be a valid URL.
 * Compatible with text input.
 */
export const urlRuleDefinition: ValidationRuleDefinition = {
  id: "url",
  name: "URL",
  icon: "link",
  category: "format",
  compatibleInputs: ["text"],
  configComponent: "UrlConfig",
  description: "Must be a valid URL",
  defaultConfig: {},
  toZod: (_config: unknown) => (schema: unknown) => {
    if (schema instanceof z.ZodString) {
      return schema.url("Must be a valid URL");
    }
    return schema;
  },
};

/**
 * UUID rule - string must be a valid UUID.
 * Compatible with text input.
 */
export const uuidRuleDefinition: ValidationRuleDefinition = {
  id: "uuid",
  name: "UUID",
  icon: "fingerprint",
  category: "format",
  compatibleInputs: ["text"],
  configComponent: "UuidConfig",
  description: "Must be a valid UUID",
  defaultConfig: {},
  toZod: (_config: unknown) => (schema: unknown) => {
    if (schema instanceof z.ZodString) {
      return schema.uuid("Must be a valid UUID");
    }
    return schema;
  },
};

// ============================================================================
// Numeric Range Rules
// ============================================================================

/**
 * Min rule - number must be at least N.
 * Compatible with number input.
 */
export const minRuleDefinition: ValidationRuleDefinition = {
  id: "min",
  name: "Minimum",
  icon: "arrow-down-to-line",
  category: "range",
  compatibleInputs: ["number"],
  configComponent: "MinConfig",
  description: "Minimum numeric value",
  defaultConfig: { value: 0 },
  toZod: (config: unknown) => (schema: unknown) => {
    const { value } = config as { value: number };
    if (schema instanceof z.ZodNumber) {
      return schema.min(value, `Must be at least ${value}`);
    }
    return schema;
  },
};

/**
 * Max rule - number must be at most N.
 * Compatible with number input.
 */
export const maxRuleDefinition: ValidationRuleDefinition = {
  id: "max",
  name: "Maximum",
  icon: "arrow-up-to-line",
  category: "range",
  compatibleInputs: ["number"],
  configComponent: "MaxConfig",
  description: "Maximum numeric value",
  defaultConfig: { value: 100 },
  toZod: (config: unknown) => (schema: unknown) => {
    const { value } = config as { value: number };
    if (schema instanceof z.ZodNumber) {
      return schema.max(value, `Must be at most ${value}`);
    }
    return schema;
  },
};

/**
 * Step rule - number must be a multiple of N.
 * Compatible with number input.
 */
export const stepRuleDefinition: ValidationRuleDefinition = {
  id: "step",
  name: "Step",
  icon: "git-commit-vertical",
  category: "range",
  compatibleInputs: ["number"],
  configComponent: "StepConfig",
  description: "Value must be a multiple of the step",
  defaultConfig: { step: 1 },
  toZod: (config: unknown) => (schema: unknown) => {
    const { step } = config as { step: number };
    if (schema instanceof z.ZodNumber) {
      return schema.multipleOf(step, `Must be a multiple of ${step}`);
    }
    return schema;
  },
};

/**
 * Integer rule - number must be a whole number.
 * Compatible with number input.
 */
export const integerRuleDefinition: ValidationRuleDefinition = {
  id: "integer",
  name: "Integer",
  icon: "hash",
  category: "format",
  compatibleInputs: ["number"],
  configComponent: "IntegerConfig",
  description: "Must be a whole number",
  defaultConfig: {},
  toZod: (_config: unknown) => (schema: unknown) => {
    if (schema instanceof z.ZodNumber) {
      return schema.int("Must be a whole number");
    }
    return schema;
  },
};

/**
 * Positive rule - number must be positive (> 0).
 * Compatible with number input.
 */
export const positiveRuleDefinition: ValidationRuleDefinition = {
  id: "positive",
  name: "Positive",
  icon: "plus",
  category: "constraint",
  compatibleInputs: ["number"],
  configComponent: "PositiveConfig",
  description: "Must be a positive number",
  defaultConfig: {},
  toZod: (_config: unknown) => (schema: unknown) => {
    if (schema instanceof z.ZodNumber) {
      return schema.positive("Must be a positive number");
    }
    return schema;
  },
};

/**
 * Negative rule - number must be negative (< 0).
 * Compatible with number input.
 */
export const negativeRuleDefinition: ValidationRuleDefinition = {
  id: "negative",
  name: "Negative",
  icon: "minus",
  category: "constraint",
  compatibleInputs: ["number"],
  configComponent: "NegativeConfig",
  description: "Must be a negative number",
  defaultConfig: {},
  toZod: (_config: unknown) => (schema: unknown) => {
    if (schema instanceof z.ZodNumber) {
      return schema.negative("Must be a negative number");
    }
    return schema;
  },
};

// ============================================================================
// Date Range Rules
// ============================================================================

/**
 * Min Date rule - date must be on or after a minimum date.
 * Compatible with date picker.
 */
export const minDateRuleDefinition: ValidationRuleDefinition = {
  id: "minDate",
  name: "Min Date",
  icon: "calendar-arrow-up",
  category: "range",
  compatibleInputs: ["date"],
  configComponent: "MinDateConfig",
  description: "Earliest allowed date",
  defaultConfig: { date: null },
  toZod: (config: unknown) => (schema: unknown) => {
    const { date } = config as { date: string | Date | null };
    if (schema instanceof z.ZodDate && date != null) {
      const minDate = typeof date === "string" ? new Date(date) : date;
      return schema.min(minDate, `Date must be on or after ${minDate.toLocaleDateString()}`);
    }
    return schema;
  },
};

/**
 * Max Date rule - date must be on or before a maximum date.
 * Compatible with date picker.
 */
export const maxDateRuleDefinition: ValidationRuleDefinition = {
  id: "maxDate",
  name: "Max Date",
  icon: "calendar-arrow-down",
  category: "range",
  compatibleInputs: ["date"],
  configComponent: "MaxDateConfig",
  description: "Latest allowed date",
  defaultConfig: { date: null },
  toZod: (config: unknown) => (schema: unknown) => {
    const { date } = config as { date: string | Date | null };
    if (schema instanceof z.ZodDate && date != null) {
      const maxDate = typeof date === "string" ? new Date(date) : date;
      return schema.max(maxDate, `Date must be on or before ${maxDate.toLocaleDateString()}`);
    }
    return schema;
  },
};

// ============================================================================
// File Rules
// ============================================================================

/**
 * File Size rule - file must not exceed a maximum size.
 * Compatible with file upload.
 */
export const fileSizeRuleDefinition: ValidationRuleDefinition = {
  id: "fileSize",
  name: "File Size",
  icon: "hard-drive",
  category: "constraint",
  compatibleInputs: ["file"],
  configComponent: "FileSizeConfig",
  description: "Maximum file size in bytes",
  defaultConfig: { maxBytes: 5 * 1024 * 1024 }, // 5MB default
  toZod: (config: unknown) => (schema: unknown) => {
    const { maxBytes } = config as { maxBytes: number };
    // File validation happens at a higher level since Zod doesn't have File type
    // We attach metadata that the form runtime uses for client-side validation
    if (schema instanceof z.ZodType) {
      return schema.refine(
        (val) => {
          if (val instanceof File) {
            return val.size <= maxBytes;
          }
          if (Array.isArray(val)) {
            return val.every((f) => f instanceof File && f.size <= maxBytes);
          }
          return true;
        },
        { message: `File size must not exceed ${formatBytes(maxBytes)}` }
      );
    }
    return schema;
  },
};

/**
 * File Type rule - file must match allowed MIME types.
 * Compatible with file upload.
 */
export const fileTypeRuleDefinition: ValidationRuleDefinition = {
  id: "fileType",
  name: "File Type",
  icon: "file-type",
  category: "constraint",
  compatibleInputs: ["file"],
  configComponent: "FileTypeConfig",
  description: "Allowed file types (MIME patterns)",
  defaultConfig: { types: ["image/*", "application/pdf"] },
  toZod: (config: unknown) => (schema: unknown) => {
    const { types } = config as { types: string[] };
    if (schema instanceof z.ZodType) {
      return schema.refine(
        (val) => {
          if (val instanceof File) {
            return matchesMimeType(val.type, types);
          }
          if (Array.isArray(val)) {
            return val.every(
              (f) => f instanceof File && matchesMimeType(f.type, types)
            );
          }
          return true;
        },
        { message: `File type must be one of: ${types.join(", ")}` }
      );
    }
    return schema;
  },
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format bytes into human-readable string.
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

/**
 * Check if a MIME type matches any of the allowed patterns.
 * Supports wildcards like "image/*".
 */
function matchesMimeType(mimeType: string, patterns: string[]): boolean {
  for (const pattern of patterns) {
    if (pattern === mimeType) return true;
    if (pattern.endsWith("/*")) {
      const prefix = pattern.slice(0, -2);
      if (mimeType.startsWith(`${prefix}/`)) return true;
    }
  }
  return false;
}

// ============================================================================
// Default Rule Definitions
// ============================================================================

/**
 * All default validation rule definitions.
 */
export const defaultValidationRuleDefinitions: ValidationRuleDefinition[] = [
  // Constraint rules
  requiredRuleDefinition,
  minItemsRuleDefinition,
  maxItemsRuleDefinition,
  positiveRuleDefinition,
  negativeRuleDefinition,
  fileSizeRuleDefinition,
  fileTypeRuleDefinition,
  // Format rules
  patternRuleDefinition,
  emailRuleDefinition,
  urlRuleDefinition,
  uuidRuleDefinition,
  integerRuleDefinition,
  // Range rules
  minLengthRuleDefinition,
  maxLengthRuleDefinition,
  minRuleDefinition,
  maxRuleDefinition,
  stepRuleDefinition,
  minDateRuleDefinition,
  maxDateRuleDefinition,
];

/**
 * Creates a registry pre-populated with all default validation rules.
 */
export function createDefaultValidationRuleRegistry(): ValidationRuleRegistry {
  const registry = createValidationRuleRegistry();

  for (const definition of defaultValidationRuleDefinitions) {
    registry.register(definition);
  }

  return registry;
}

/**
 * Global default registry instance.
 * Use createValidationRuleRegistry() or createDefaultValidationRuleRegistry()
 * for isolated instances.
 */
let globalRuleRegistry: ValidationRuleRegistry | null = null;

/**
 * Gets the global validation rule registry, creating it if necessary.
 * The global registry is pre-populated with default rules.
 */
export function getValidationRuleRegistry(): ValidationRuleRegistry {
  if (!globalRuleRegistry) {
    globalRuleRegistry = createDefaultValidationRuleRegistry();
  }
  return globalRuleRegistry;
}

/**
 * Resets the global rule registry to a fresh default state.
 * Primarily useful for testing.
 */
export function resetGlobalRuleRegistry(): void {
  globalRuleRegistry = null;
}

// ============================================================================
// Schema Builder Utilities
// ============================================================================

/**
 * Configuration for an applied validation rule.
 */
export interface AppliedRule {
  /** The rule ID */
  ruleId: ValidationRuleId;
  /** The rule configuration */
  config: unknown;
}

/**
 * Apply multiple validation rules to a Zod schema.
 * Rules are applied in order.
 *
 * @param schema - The base Zod schema
 * @param rules - Array of rules to apply
 * @param registry - The rule registry to use (defaults to global)
 * @returns The schema with all rules applied
 */
export function applyValidationRules<T extends z.ZodTypeAny>(
  schema: T,
  rules: AppliedRule[],
  registry: ValidationRuleRegistry = getValidationRuleRegistry()
): z.ZodTypeAny {
  let result: z.ZodTypeAny = schema;

  for (const { ruleId, config } of rules) {
    const ruleDef = registry.get(ruleId);
    if (ruleDef) {
      result = ruleDef.toZod(config)(result) as z.ZodTypeAny;
    }
  }

  return result;
}
