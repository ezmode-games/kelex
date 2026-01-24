/**
 * Gaming-friendly error message transformers.
 * Converts technical Zod error codes into player-friendly language.
 */

import type { ErrorMessageTransformer, ZodIssueInfo } from "./types";

/**
 * Transform "too_small" errors into gaming-friendly messages.
 */
export const tooSmallTransformer: ErrorMessageTransformer = (error) => {
  const min = error.minimum;

  if (error.type === "string") {
    if (min === 1) {
      return "This field cannot be empty.";
    }
    return `Needs at least ${String(min)} characters.`;
  }

  if (error.type === "number" || error.type === "bigint") {
    if (error.inclusive) {
      return `Must be ${String(min)} or higher.`;
    }
    return `Must be greater than ${String(min)}.`;
  }

  if (error.type === "array") {
    if (min === 1) {
      return "Select at least one option.";
    }
    return `Select at least ${String(min)} options.`;
  }

  if (error.type === "date") {
    return "Date is too early.";
  }

  // Fallback
  return error.message;
};

/**
 * Transform "too_big" errors into gaming-friendly messages.
 */
export const tooBigTransformer: ErrorMessageTransformer = (error) => {
  const max = error.maximum;

  if (error.type === "string") {
    return `Maximum ${String(max)} characters allowed.`;
  }

  if (error.type === "number" || error.type === "bigint") {
    if (error.inclusive) {
      return `Must be ${String(max)} or lower.`;
    }
    return `Must be less than ${String(max)}.`;
  }

  if (error.type === "array") {
    return `Maximum ${String(max)} selections allowed.`;
  }

  if (error.type === "date") {
    return "Date is too late.";
  }

  // Fallback
  return error.message;
};

/**
 * Transform "invalid_type" errors into gaming-friendly messages.
 */
export const invalidTypeTransformer: ErrorMessageTransformer = (error) => {
  const { expected, received } = error;

  // Handle null/undefined for required fields
  if (received === "undefined" || received === "null") {
    return "This field is required.";
  }

  // Handle common type mismatches
  if (expected === "number" && received === "string") {
    return "Enter a valid number.";
  }

  if (expected === "string" && received === "number") {
    return "Enter text, not a number.";
  }

  if (expected === "date" || expected === "Date") {
    return "Enter a valid date.";
  }

  if (expected === "boolean") {
    return "This must be checked or unchecked.";
  }

  if (expected === "array") {
    return "Select one or more options.";
  }

  // Fallback for other type mismatches
  return `Expected ${expected ?? "unknown"}, got ${received ?? "unknown"}.`;
};

/**
 * Transform "invalid_string" errors into gaming-friendly messages.
 */
export const invalidStringTransformer: ErrorMessageTransformer = (error) => {
  const message = error.message.toLowerCase();

  if (message.includes("email")) {
    return "Enter a valid email address.";
  }

  if (message.includes("url")) {
    return "Enter a valid URL.";
  }

  if (message.includes("uuid")) {
    return "Invalid identifier format.";
  }

  if (message.includes("regex") || message.includes("pattern")) {
    return "Format is incorrect.";
  }

  if (message.includes("datetime") || message.includes("date")) {
    return "Enter a valid date.";
  }

  if (message.includes("time")) {
    return "Enter a valid time.";
  }

  // Fallback
  return "Invalid format.";
};

/**
 * Transform "invalid_enum_value" errors into gaming-friendly messages.
 */
export const invalidEnumTransformer: ErrorMessageTransformer = () => {
  return "Select a valid option.";
};

/**
 * Transform "invalid_literal" errors into gaming-friendly messages.
 */
export const invalidLiteralTransformer: ErrorMessageTransformer = (error) => {
  // Often used for checkbox acknowledgments
  // Note: expected can be "true" (string) when Zod serializes boolean literals
  if (error.expected === "true") {
    return "This must be accepted.";
  }

  return "Invalid value.";
};

/**
 * Transform "custom" errors (z.refine, z.superRefine).
 * These pass through as-is since they already have custom messages.
 */
export const customTransformer: ErrorMessageTransformer = (error) => {
  return error.message;
};

/**
 * Transform "invalid_union" errors into gaming-friendly messages.
 */
export const invalidUnionTransformer: ErrorMessageTransformer = () => {
  return "Invalid selection.";
};

/**
 * Transform "invalid_date" errors into gaming-friendly messages.
 */
export const invalidDateTransformer: ErrorMessageTransformer = () => {
  return "Enter a valid date.";
};

/**
 * Transform "not_multiple_of" errors into gaming-friendly messages.
 */
export const notMultipleOfTransformer: ErrorMessageTransformer = (error) => {
  // For step validation
  const step = error.minimum; // Zod uses minimum for step value in this error
  if (step !== undefined) {
    return `Must be in increments of ${String(step)}.`;
  }
  return "Invalid increment.";
};

/**
 * Transform "not_finite" errors into gaming-friendly messages.
 */
export const notFiniteTransformer: ErrorMessageTransformer = () => {
  return "Enter a finite number.";
};

/**
 * Transform "invalid_intersection_types" errors.
 */
export const invalidIntersectionTransformer: ErrorMessageTransformer = () => {
  return "Invalid data format.";
};

/**
 * Transform "unrecognized_keys" errors.
 */
export const unrecognizedKeysTransformer: ErrorMessageTransformer = () => {
  return "Unknown fields detected.";
};

/**
 * Default transformers for all Zod error codes.
 */
export const defaultMessageTransformers: Record<string, ErrorMessageTransformer> = {
  too_small: tooSmallTransformer,
  too_big: tooBigTransformer,
  invalid_type: invalidTypeTransformer,
  invalid_string: invalidStringTransformer,
  invalid_enum_value: invalidEnumTransformer,
  invalid_literal: invalidLiteralTransformer,
  custom: customTransformer,
  invalid_union: invalidUnionTransformer,
  invalid_union_discriminator: invalidUnionTransformer,
  invalid_date: invalidDateTransformer,
  not_multiple_of: notMultipleOfTransformer,
  not_finite: notFiniteTransformer,
  invalid_intersection_types: invalidIntersectionTransformer,
  unrecognized_keys: unrecognizedKeysTransformer,
};

/**
 * Transform a Zod issue into a gaming-friendly error message.
 *
 * @param error - The Zod issue info
 * @param customTransformers - Optional custom transformers to override defaults
 * @returns Gaming-friendly error message
 */
export function transformErrorMessage(
  error: ZodIssueInfo,
  customTransformers?: Partial<Record<string, ErrorMessageTransformer>>
): string {
  const transformers = customTransformers
    ? { ...defaultMessageTransformers, ...customTransformers }
    : defaultMessageTransformers;

  const transformer = transformers[error.code];

  if (transformer) {
    return transformer(error);
  }

  // Fallback to original message if no transformer found
  return error.message;
}

/**
 * Get the display label for a field path.
 * Converts "userName" to "User Name", "address.city" to "City".
 *
 * @param path - The field path (e.g., "userName", "address.city")
 * @returns Human-readable field label
 */
export function getFieldLabel(path: string): string {
  // Get the last segment of the path
  const segments = path.split(".");
  const fieldName = segments[segments.length - 1];

  if (!fieldName) {
    return "Field";
  }

  // Convert camelCase/PascalCase to Title Case
  return fieldName
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}
