/**
 * Form Submission Handler Tests (PZ-007)
 *
 * Tests for useFormSubmit hook functionality.
 * Note: These tests are limited since we use node environment.
 * Full hook testing would require jsdom environment and @testing-library/react.
 * These tests verify types, exports, and utility functions.
 */

import { describe, expect, it } from "vitest";
import {
  useFormSubmit,
  createSubmissionError,
  createSuccessResult,
  createErrorResult,
  createValidationErrorResult,
} from "../../src/hooks/useFormSubmit";
import type {
  SubmissionStatus,
  SubmissionErrorCode,
  SubmissionError,
  SubmissionResult,
  RetryConfig,
  UseFormSubmitOptions,
  UseFormSubmitReturn,
} from "../../src/hooks/useFormSubmit";

describe("useFormSubmit", () => {
  describe("Hook Export", () => {
    it("is exported as a function", () => {
      expect(typeof useFormSubmit).toBe("function");
    });

    it("has correct function signature (1 argument)", () => {
      expect(useFormSubmit.length).toBe(1);
    });
  });

  describe("createSubmissionError", () => {
    it("creates error from generic Error", () => {
      const error = new Error("Something went wrong");
      const result = createSubmissionError(error);

      expect(result.code).toBe("unknown");
      expect(result.message).toBe("Something went wrong");
      expect(result.cause).toBe(error);
      expect(result.retryable).toBe(false);
    });

    it("creates timeout error when message contains 'timed out'", () => {
      const error = new Error("Operation timed out after 5000ms");
      const result = createSubmissionError(error);

      expect(result.code).toBe("timeout");
      expect(result.message).toBe("The request timed out. Please try again.");
      expect(result.retryable).toBe(true);
    });

    it("creates network error for fetch failures", () => {
      const error = new TypeError("fetch failed");
      const result = createSubmissionError(error);

      expect(result.code).toBe("network_error");
      expect(result.message).toBe(
        "Unable to connect to the server. Please check your internet connection."
      );
      expect(result.retryable).toBe(true);
    });

    it("handles unknown error types", () => {
      const result = createSubmissionError("string error");

      expect(result.code).toBe("unknown");
      expect(result.message).toBe("An unexpected error occurred. Please try again.");
      expect(result.cause).toBe("string error");
      expect(result.retryable).toBe(false);
    });

    it("uses provided default code", () => {
      const error = new Error("Custom error");
      const result = createSubmissionError(error, "server_error");

      expect(result.code).toBe("server_error");
      expect(result.retryable).toBe(false);
    });

    it("marks network_error default code as retryable", () => {
      const error = new Error("Connection reset");
      const result = createSubmissionError(error, "network_error");

      expect(result.code).toBe("network_error");
      expect(result.retryable).toBe(true);
    });
  });

  describe("createSuccessResult", () => {
    it("creates success result with data", () => {
      const data = { id: "123", name: "Test" };
      const result = createSuccessResult(data);

      expect(result.status).toBe("success");
      expect(result).toHaveProperty("data", data);
    });

    it("handles null data", () => {
      const result = createSuccessResult(null);

      expect(result.status).toBe("success");
      expect(result).toHaveProperty("data", null);
    });

    it("handles undefined data", () => {
      const result = createSuccessResult(undefined);

      expect(result.status).toBe("success");
      expect(result).toHaveProperty("data", undefined);
    });

    it("preserves complex data structures", () => {
      const data = {
        users: [{ id: 1 }, { id: 2 }],
        meta: { total: 2 },
      };
      const result = createSuccessResult(data);

      expect(result.status).toBe("success");
      if (result.status === "success") {
        expect(result.data).toEqual(data);
      }
    });
  });

  describe("createErrorResult", () => {
    it("creates error result with SubmissionError", () => {
      const error: SubmissionError = {
        code: "server_error",
        message: "Internal server error",
        retryable: false,
        statusCode: 500,
      };
      const result = createErrorResult<string>(error);

      expect(result.status).toBe("error");
      if (result.status === "error") {
        expect(result.error).toEqual(error);
      }
    });

    it("preserves all error properties", () => {
      const cause = new Error("Original error");
      const error: SubmissionError = {
        code: "network_error",
        message: "Connection failed",
        cause,
        retryable: true,
      };
      const result = createErrorResult<number>(error);

      expect(result.status).toBe("error");
      if (result.status === "error") {
        expect(result.error.code).toBe("network_error");
        expect(result.error.message).toBe("Connection failed");
        expect(result.error.cause).toBe(cause);
        expect(result.error.retryable).toBe(true);
      }
    });
  });

  describe("createValidationErrorResult", () => {
    it("creates validation error result from Zod issues", () => {
      const issues = [
        {
          code: "too_small",
          message: "String must contain at least 3 character(s)",
          path: ["name"],
          minimum: 3,
        },
        {
          code: "invalid_type",
          message: "Required",
          path: ["email"],
          expected: "string",
          received: "undefined",
        },
      ];

      const result = createValidationErrorResult<string>(issues);

      expect(result.status).toBe("validation_error");
      if (result.status === "validation_error") {
        expect(result.errors.hasErrors).toBe(true);
        expect(result.errors.errorCount).toBe(2);
        expect(result.errors.hasFieldError("name")).toBe(true);
        expect(result.errors.hasFieldError("email")).toBe(true);
      }
    });

    it("handles empty issues array", () => {
      const result = createValidationErrorResult<string>([]);

      expect(result.status).toBe("validation_error");
      if (result.status === "validation_error") {
        expect(result.errors.hasErrors).toBe(false);
        expect(result.errors.errorCount).toBe(0);
      }
    });

    it("handles nested field paths", () => {
      const issues = [
        {
          code: "invalid_type",
          message: "Required",
          path: ["address", "city"],
        },
      ];

      const result = createValidationErrorResult<string>(issues);

      expect(result.status).toBe("validation_error");
      if (result.status === "validation_error") {
        expect(result.errors.hasFieldError("address.city")).toBe(true);
      }
    });

    it("handles array index paths", () => {
      const issues = [
        {
          code: "invalid_type",
          message: "Required",
          path: ["items", 0, "name"],
        },
      ];

      const result = createValidationErrorResult<string>(issues);

      expect(result.status).toBe("validation_error");
      if (result.status === "validation_error") {
        expect(result.errors.hasFieldError("items[0].name")).toBe(true);
      }
    });
  });
});

// Type-level tests
describe("Type Definitions", () => {
  it("SubmissionStatus type covers all states", () => {
    const statuses: SubmissionStatus[] = [
      "idle",
      "submitting",
      "success",
      "error",
      "validation_error",
    ];
    expect(statuses).toHaveLength(5);
  });

  it("SubmissionErrorCode type covers all error types", () => {
    const codes: SubmissionErrorCode[] = [
      "network_error",
      "timeout",
      "validation_failed",
      "server_error",
      "unknown",
    ];
    expect(codes).toHaveLength(5);
  });

  it("SubmissionError interface is complete", () => {
    const error: SubmissionError = {
      code: "server_error",
      message: "Test error",
      cause: new Error("Cause"),
      statusCode: 500,
      retryable: false,
    };

    expect(error.code).toBe("server_error");
    expect(error.message).toBe("Test error");
    expect(error.statusCode).toBe(500);
    expect(error.retryable).toBe(false);
  });

  it("RetryConfig interface is complete", () => {
    const config: RetryConfig = {
      maxAttempts: 5,
      baseDelayMs: 2000,
      exponentialBackoff: true,
      maxDelayMs: 30000,
      retryOnCodes: ["network_error", "timeout"],
    };

    expect(config.maxAttempts).toBe(5);
    expect(config.baseDelayMs).toBe(2000);
    expect(config.exponentialBackoff).toBe(true);
    expect(config.maxDelayMs).toBe(30000);
    expect(config.retryOnCodes).toContain("network_error");
  });

  it("UseFormSubmitOptions interface accepts all callbacks", () => {
    type FormData = { name: string };
    type FormResult = { id: string };

    const options: UseFormSubmitOptions<FormData, FormResult> = {
      onSubmit: async (data) => {
        // Type check: data should be FormData
        const _data: FormData = data;
        void _data;
        return createSuccessResult({ id: "123" });
      },
      onSubmitStart: (data) => {
        const _data: FormData = data;
        void _data;
      },
      onSuccess: (result, data) => {
        const _result: FormResult = result;
        const _data: FormData = data;
        void _result;
        void _data;
      },
      onError: (error, data) => {
        const _error: SubmissionError = error;
        const _data: FormData = data;
        void _error;
        void _data;
      },
      onValidationError: (errors, data) => {
        const _hasErrors: boolean = errors.hasErrors;
        const _data: FormData = data;
        void _hasErrors;
        void _data;
      },
      onRetry: (attempt, error, data) => {
        const _attempt: number = attempt;
        const _error: SubmissionError = error;
        const _data: FormData = data;
        void _attempt;
        void _error;
        void _data;
      },
      successResetMs: 5000,
      timeoutMs: 10000,
      retry: {
        maxAttempts: 2,
        baseDelayMs: 500,
      },
    };

    expect(options.successResetMs).toBe(5000);
    expect(options.timeoutMs).toBe(10000);
  });

  it("UseFormSubmitOptions accepts retry: false", () => {
    type FormData = { name: string };
    type FormResult = { id: string };

    const options: UseFormSubmitOptions<FormData, FormResult> = {
      onSubmit: async () => createSuccessResult({ id: "123" }),
      retry: false,
    };

    expect(options.retry).toBe(false);
  });

  it("SubmissionResult discriminated union works correctly", () => {
    function handleResult(result: SubmissionResult<string>) {
      switch (result.status) {
        case "success":
          // TypeScript should narrow to success type
          return result.data.toUpperCase();
        case "error":
          // TypeScript should narrow to error type
          return result.error.message;
        case "validation_error":
          // TypeScript should narrow to validation_error type
          return result.errors.errorCount;
      }
    }

    const successResult = createSuccessResult("test");
    expect(handleResult(successResult)).toBe("TEST");

    const errorResult = createErrorResult<string>({
      code: "unknown",
      message: "Error message",
      retryable: false,
    });
    expect(handleResult(errorResult)).toBe("Error message");

    const validationResult = createValidationErrorResult<string>([
      { code: "required", message: "Required", path: ["field"] },
    ]);
    expect(handleResult(validationResult)).toBe(1);
  });
});

describe("UseFormSubmitReturn Type", () => {
  it("return type includes all expected properties", () => {
    // This is a compile-time type check
    // The actual hook would return these properties
    type ExpectedReturn = UseFormSubmitReturn<{ name: string }, { id: string }>;

    // Verify the type has all expected properties
    type StatusCheck = ExpectedReturn["status"];
    type IsSubmittingCheck = ExpectedReturn["isSubmitting"];
    type IsSuccessCheck = ExpectedReturn["isSuccess"];
    type IsErrorCheck = ExpectedReturn["isError"];
    type ErrorCheck = ExpectedReturn["error"];
    type ValidationErrorsCheck = ExpectedReturn["validationErrors"];
    type DataCheck = ExpectedReturn["data"];
    type RetryAttemptCheck = ExpectedReturn["retryAttempt"];
    type CanRetryCheck = ExpectedReturn["canRetry"];
    type SubmitCheck = ExpectedReturn["submit"];
    type RetryCheck = ExpectedReturn["retry"];
    type ResetCheck = ExpectedReturn["reset"];
    type ClearValidationErrorsCheck = ExpectedReturn["clearValidationErrors"];

    // Type assertions to verify types are correct
    const _status: StatusCheck = "idle" as SubmissionStatus;
    const _isSubmitting: IsSubmittingCheck = false;
    const _isSuccess: IsSuccessCheck = false;
    const _isError: IsErrorCheck = false;
    const _error: ErrorCheck = null;
    const _retryAttempt: RetryAttemptCheck = 0;
    const _canRetry: CanRetryCheck = false;

    void _status;
    void _isSubmitting;
    void _isSuccess;
    void _isError;
    void _error;
    void _retryAttempt;
    void _canRetry;

    expect(true).toBe(true);
  });
});

describe("Integration with Validation Module", () => {
  it("validation error result integrates with ValidationErrors type", () => {
    const issues = [
      {
        code: "too_small",
        message: "Min 3 chars",
        path: ["username"],
        minimum: 3,
        type: "string",
      },
    ];

    const result = createValidationErrorResult<void>(issues);

    if (result.status === "validation_error") {
      // These methods should exist on ValidationErrors
      expect(typeof result.errors.hasErrors).toBe("boolean");
      expect(typeof result.errors.errorCount).toBe("number");
      expect(typeof result.errors.getFieldError).toBe("function");
      expect(typeof result.errors.getFieldErrors).toBe("function");
      expect(typeof result.errors.hasFieldError).toBe("function");
      expect(typeof result.errors.getFirstErrorField).toBe("function");

      // Verify field error retrieval
      const fieldError = result.errors.getFieldError("username");
      expect(fieldError).toBeDefined();
      expect(fieldError?.path).toBe("username");
      expect(fieldError?.code).toBe("too_small");
    }
  });
});
