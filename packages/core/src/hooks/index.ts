/**
 * React hooks for phantom-zone form handling.
 *
 * Provides:
 * - Form submission handling (PZ-007)
 */

// Form submission hook
export {
  useFormSubmit,
  // Factory functions for creating submission results
  createSubmissionError,
  createSuccessResult,
  createErrorResult,
  createValidationErrorResult,
} from "./useFormSubmit";

// Types
export type {
  SubmissionStatus,
  SubmissionErrorCode,
  SubmissionError,
  SubmissionResult,
  SubmitFunction,
  RetryConfig,
  UseFormSubmitOptions,
  UseFormSubmitReturn,
} from "./useFormSubmit";
