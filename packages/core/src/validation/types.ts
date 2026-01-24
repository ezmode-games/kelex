/**
 * Validation error types for phantom-zone forms.
 * Provides gaming-friendly error display with Zod integration.
 */

/**
 * A single validation error for a field.
 */
export interface FieldValidationError {
  /** The field path (e.g., "email", "address.city") */
  path: string;

  /** The original error code from Zod */
  code: string;

  /** The gaming-friendly error message */
  message: string;

  /** Optional minimum value that was violated */
  minimum?: number | bigint;

  /** Optional maximum value that was violated */
  maximum?: number | bigint;

  /** Whether the constraint is inclusive */
  inclusive?: boolean;

  /** Expected type when type mismatch */
  expected?: string;

  /** Received type when type mismatch */
  received?: string;
}

/**
 * Collection of validation errors for a form.
 */
export interface ValidationErrors {
  /** Map of field path to errors for that field */
  fieldErrors: Map<string, FieldValidationError[]>;

  /** Form-level errors not tied to a specific field */
  formErrors: FieldValidationError[];

  /** Whether there are any errors */
  hasErrors: boolean;

  /** Total number of errors across all fields */
  errorCount: number;

  /** Get the first error for a specific field */
  getFieldError: (path: string) => FieldValidationError | undefined;

  /** Get all errors for a specific field */
  getFieldErrors: (path: string) => FieldValidationError[];

  /** Check if a field has errors */
  hasFieldError: (path: string) => boolean;

  /** Get the first field with an error (for scroll-to-first-error) */
  getFirstErrorField: () => string | undefined;
}

/**
 * Props for the FieldError component.
 */
export interface FieldErrorProps {
  /** Field path to display errors for */
  fieldPath: string;

  /** Validation errors object */
  errors: ValidationErrors;

  /** Optional CSS class name */
  className?: string;

  /** Whether to show all errors or just the first */
  showAll?: boolean;

  /** Unique ID for aria-describedby linking */
  id?: string;
}

/**
 * Props for the ErrorSummary component.
 */
export interface ErrorSummaryProps {
  /** Validation errors object */
  errors: ValidationErrors;

  /** Optional CSS class name */
  className?: string;

  /** Title for the error summary */
  title?: string;

  /** Whether to enable scroll-to-error when clicking */
  scrollToError?: boolean;

  /** Custom scroll behavior */
  scrollBehavior?: ScrollBehavior;

  /** Ref to focus when summary is shown */
  summaryRef?: React.RefObject<HTMLElement>;
}

/**
 * Options for creating a ValidationErrors object from Zod errors.
 */
export interface ParseErrorsOptions {
  /** Custom error message transformers by Zod error code */
  messageTransformers?: Partial<Record<string, ErrorMessageTransformer>>;

  /** Whether to use gaming-friendly messages (default: true) */
  useGamingMessages?: boolean;
}

/**
 * Function that transforms a Zod error into a gaming-friendly message.
 */
export type ErrorMessageTransformer = (
  error: ZodIssueInfo
) => string;

/**
 * Minimal Zod issue info needed for message transformation.
 * This avoids tight coupling to a specific Zod version.
 */
export interface ZodIssueInfo {
  /** Error code (e.g., "too_small", "invalid_type") */
  code: string;

  /** Original message from Zod */
  message: string;

  /** Field path as array */
  path: (string | number)[];

  /** Minimum constraint if applicable */
  minimum?: number | bigint;

  /** Maximum constraint if applicable */
  maximum?: number | bigint;

  /** Whether constraint is inclusive */
  inclusive?: boolean;

  /** Expected type for type errors */
  expected?: string;

  /** Received type for type errors */
  received?: string;

  /** Type of constraint (string, number, array, etc.) */
  type?: string;

  /** For exact length errors */
  exact?: boolean;
}

/**
 * State managed by useValidationErrors hook.
 */
export interface ValidationErrorsState {
  /** Current validation errors */
  errors: ValidationErrors;

  /** Set errors from a Zod error or issue array */
  setErrors: (issues: ZodIssueInfo[]) => void;

  /** Clear all errors */
  clearErrors: () => void;

  /** Clear errors for a specific field */
  clearFieldErrors: (path: string) => void;

  /** Add a manual error for a field */
  addError: (path: string, message: string, code?: string) => void;

  /** Scroll to the first field with an error */
  scrollToFirstError: (options?: ScrollToErrorOptions) => void;
}

/**
 * Options for scrolling to an error field.
 */
export interface ScrollToErrorOptions {
  /** Scroll behavior (smooth or auto) */
  behavior?: ScrollBehavior;

  /** Block position (start, center, end, nearest) */
  block?: ScrollLogicalPosition;

  /** Inline position (start, center, end, nearest) */
  inline?: ScrollLogicalPosition;

  /** Whether to focus the field after scrolling */
  focus?: boolean;

  /** Offset from top when scrolling (for fixed headers) */
  offsetTop?: number;
}
