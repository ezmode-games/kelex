/**
 * Preview Tests (PZ-107)
 *
 * Note: These tests are limited since we use node environment.
 * Full component testing would require jsdom environment and @testing-library/react.
 * These tests verify types, exports, validation functions, and basic functionality.
 */

import { describe, expect, it } from "vitest";
import {
  Preview,
  usePreview,
  FormPreview,
  validateFieldValue,
  validateForm,
  getInitialFieldValue,
  createInitialFormValues,
  MOBILE_VIEWPORT_WIDTH,
  DESKTOP_VIEWPORT_WIDTH,
  createEmptyCanvasState,
  createField,
} from "../../src/designer";
import type {
  PreviewProps,
  FormPreviewProps,
  ViewportMode,
  PreviewFieldError,
  PreviewFormValues,
  PreviewValueChangeEvent,
  PreviewValidationEvent,
  CanvasField,
  CanvasState,
} from "../../src/designer";

describe("Preview", () => {
  describe("exports", () => {
    it("Preview is exported as a function", () => {
      expect(typeof Preview).toBe("function");
    });

    it("usePreview is exported as a function", () => {
      expect(typeof usePreview).toBe("function");
    });

    it("FormPreview is exported as a function", () => {
      expect(typeof FormPreview).toBe("function");
    });

    it("validateFieldValue is exported as a function", () => {
      expect(typeof validateFieldValue).toBe("function");
    });

    it("validateForm is exported as a function", () => {
      expect(typeof validateForm).toBe("function");
    });

    it("getInitialFieldValue is exported as a function", () => {
      expect(typeof getInitialFieldValue).toBe("function");
    });

    it("createInitialFormValues is exported as a function", () => {
      expect(typeof createInitialFormValues).toBe("function");
    });

    it("MOBILE_VIEWPORT_WIDTH is exported as a number", () => {
      expect(typeof MOBILE_VIEWPORT_WIDTH).toBe("number");
      expect(MOBILE_VIEWPORT_WIDTH).toBe(375);
    });

    it("DESKTOP_VIEWPORT_WIDTH is exported as a number", () => {
      expect(typeof DESKTOP_VIEWPORT_WIDTH).toBe("number");
      expect(DESKTOP_VIEWPORT_WIDTH).toBe(1024);
    });
  });

  describe("Preview component", () => {
    it("is a valid React component function", () => {
      expect(Preview.length).toBeGreaterThanOrEqual(0);
    });

    it("has sub-components attached", () => {
      expect(Preview.FormPreview).toBeDefined();
      expect(Preview.ViewportToggle).toBeDefined();
      expect(Preview.DesktopIcon).toBeDefined();
      expect(Preview.MobileIcon).toBeDefined();
      expect(Preview.RefreshIcon).toBeDefined();
      expect(Preview.SplitIcon).toBeDefined();
    });
  });

  describe("usePreview hook", () => {
    it("is exported as a function", () => {
      // Note: We cannot test the actual hook behavior in node environment
      // since React hooks require a React component context.
      expect(typeof usePreview).toBe("function");
    });
  });
});

describe("Preview Type Tests", () => {
  it("PreviewProps interface is correct", () => {
    const canvasState = createEmptyCanvasState();
    const props: PreviewProps = {
      canvasState,
      initialValues: {},
      initialViewportMode: "desktop",
      validateOnChange: true,
      onValuesChange: (values: PreviewFormValues) => {
        void values;
      },
      onValidationChange: (event: PreviewValidationEvent) => {
        void event;
      },
      editorContent: null,
      showSplitView: true,
      className: "test-class",
      children: null,
    };

    expect(props.canvasState).toBeDefined();
    expect(props.initialViewportMode).toBe("desktop");
    expect(props.validateOnChange).toBe(true);
    expect(props.showSplitView).toBe(true);
    expect(props.className).toBe("test-class");
  });

  it("PreviewProps supports minimal configuration", () => {
    const canvasState = createEmptyCanvasState();
    const props: PreviewProps = {
      canvasState,
    };

    expect(props.canvasState).toBeDefined();
    expect(props.initialValues).toBeUndefined();
    expect(props.onValuesChange).toBeUndefined();
  });

  it("FormPreviewProps interface is correct", () => {
    const props: FormPreviewProps = {
      showHeader: true,
      submitButtonText: "Submit",
      onSubmit: (values: PreviewFormValues) => {
        void values;
      },
      className: "test-class",
    };

    expect(props.showHeader).toBe(true);
    expect(props.submitButtonText).toBe("Submit");
    expect(typeof props.onSubmit).toBe("function");
    expect(props.className).toBe("test-class");
  });

  it("ViewportMode type accepts valid values", () => {
    const desktop: ViewportMode = "desktop";
    const mobile: ViewportMode = "mobile";

    expect(desktop).toBe("desktop");
    expect(mobile).toBe("mobile");
  });

  it("PreviewFieldError type has correct structure", () => {
    const error: PreviewFieldError = {
      fieldId: "field-1",
      message: "This field is required",
    };

    expect(error.fieldId).toBe("field-1");
    expect(error.message).toBe("This field is required");
  });

  it("PreviewFormValues type accepts any field values", () => {
    const values: PreviewFormValues = {
      name: "John",
      age: 30,
      active: true,
      tags: ["a", "b"],
      date: new Date(),
      file: null,
    };

    expect(values.name).toBe("John");
    expect(values.age).toBe(30);
    expect(values.active).toBe(true);
  });

  it("PreviewValueChangeEvent type has correct structure", () => {
    const event: PreviewValueChangeEvent = {
      fieldId: "field-1",
      value: "new value",
    };

    expect(event.fieldId).toBe("field-1");
    expect(event.value).toBe("new value");
  });

  it("PreviewValidationEvent type has correct structure", () => {
    const event: PreviewValidationEvent = {
      isValid: false,
      errors: [{ fieldId: "field-1", message: "Required" }],
    };

    expect(event.isValid).toBe(false);
    expect(event.errors).toHaveLength(1);
    expect(event.errors[0]?.fieldId).toBe("field-1");
  });
});

describe("validateFieldValue", () => {
  describe("required validation", () => {
    it("returns error for empty required field", () => {
      const field = createField("text", "Name", { required: true });
      expect(validateFieldValue(field, "")).toBe("This field is required");
      expect(validateFieldValue(field, null)).toBe("This field is required");
      expect(validateFieldValue(field, undefined)).toBe("This field is required");
    });

    it("returns error for empty required array field", () => {
      const field = createField("multiselect", "Tags", {
        required: true,
        options: [{ value: "a", label: "A" }],
      });
      expect(validateFieldValue(field, [])).toBe("This field is required");
    });

    it("returns null for non-required empty field", () => {
      const field = createField("text", "Name", { required: false });
      expect(validateFieldValue(field, "")).toBeNull();
      expect(validateFieldValue(field, null)).toBeNull();
    });

    it("returns null for valid required field", () => {
      const field = createField("text", "Name", { required: true });
      expect(validateFieldValue(field, "John")).toBeNull();
    });
  });

  describe("minLength validation", () => {
    it("returns error when value is too short", () => {
      const field = createField("text", "Name", {
        validationRules: [{ id: "rule-1", ruleId: "minLength", config: { min: 5 } }],
      });
      expect(validateFieldValue(field, "Hi")).toBe("Must be at least 5 characters");
    });

    it("returns null when value meets minimum length", () => {
      const field = createField("text", "Name", {
        validationRules: [{ id: "rule-1", ruleId: "minLength", config: { min: 3 } }],
      });
      expect(validateFieldValue(field, "Hello")).toBeNull();
    });
  });

  describe("maxLength validation", () => {
    it("returns error when value is too long", () => {
      const field = createField("text", "Name", {
        validationRules: [{ id: "rule-1", ruleId: "maxLength", config: { max: 5 } }],
      });
      expect(validateFieldValue(field, "Hello World")).toBe("Must be at most 5 characters");
    });

    it("returns null when value meets maximum length", () => {
      const field = createField("text", "Name", {
        validationRules: [{ id: "rule-1", ruleId: "maxLength", config: { max: 10 } }],
      });
      expect(validateFieldValue(field, "Hello")).toBeNull();
    });
  });

  describe("email validation", () => {
    it("returns error for invalid email", () => {
      const field = createField("text", "Email", {
        validationRules: [{ id: "rule-1", ruleId: "email", config: {} }],
      });
      expect(validateFieldValue(field, "invalid")).toBe("Please enter a valid email address");
      expect(validateFieldValue(field, "test@")).toBe("Please enter a valid email address");
      expect(validateFieldValue(field, "@example.com")).toBe("Please enter a valid email address");
    });

    it("returns null for valid email", () => {
      const field = createField("text", "Email", {
        validationRules: [{ id: "rule-1", ruleId: "email", config: {} }],
      });
      expect(validateFieldValue(field, "test@example.com")).toBeNull();
      expect(validateFieldValue(field, "user+tag@domain.co.uk")).toBeNull();
    });
  });

  describe("url validation", () => {
    it("returns error for invalid URL", () => {
      const field = createField("text", "Website", {
        validationRules: [{ id: "rule-1", ruleId: "url", config: {} }],
      });
      expect(validateFieldValue(field, "invalid")).toBe("Please enter a valid URL");
      expect(validateFieldValue(field, "example.com")).toBe("Please enter a valid URL");
    });

    it("returns error for non-http protocol", () => {
      const field = createField("text", "Website", {
        validationRules: [{ id: "rule-1", ruleId: "url", config: {} }],
      });
      expect(validateFieldValue(field, "ftp://example.com")).toBe("URL must start with http:// or https://");
    });

    it("returns null for valid URL", () => {
      const field = createField("text", "Website", {
        validationRules: [{ id: "rule-1", ruleId: "url", config: {} }],
      });
      expect(validateFieldValue(field, "https://example.com")).toBeNull();
      expect(validateFieldValue(field, "http://example.com/path")).toBeNull();
    });
  });

  describe("pattern validation", () => {
    it("returns error when pattern does not match", () => {
      const field = createField("text", "Code", {
        validationRules: [
          { id: "rule-1", ruleId: "pattern", config: { pattern: "^[A-Z]{3}$" } },
        ],
      });
      expect(validateFieldValue(field, "ab")).toBe("Invalid format");
    });

    it("returns custom message when pattern does not match", () => {
      const field = createField("text", "Code", {
        validationRules: [
          {
            id: "rule-1",
            ruleId: "pattern",
            config: { pattern: "^[A-Z]{3}$", message: "Must be 3 uppercase letters" },
          },
        ],
      });
      expect(validateFieldValue(field, "ab")).toBe("Must be 3 uppercase letters");
    });

    it("returns null when pattern matches", () => {
      const field = createField("text", "Code", {
        validationRules: [
          { id: "rule-1", ruleId: "pattern", config: { pattern: "^[A-Z]{3}$" } },
        ],
      });
      expect(validateFieldValue(field, "ABC")).toBeNull();
    });
  });

  describe("min/max number validation", () => {
    it("returns error when number is below minimum", () => {
      const field = createField("number", "Age", {
        validationRules: [{ id: "rule-1", ruleId: "min", config: { min: 18 } }],
      });
      expect(validateFieldValue(field, 15)).toBe("Must be at least 18");
    });

    it("returns error when number is above maximum", () => {
      const field = createField("number", "Age", {
        validationRules: [{ id: "rule-1", ruleId: "max", config: { max: 100 } }],
      });
      expect(validateFieldValue(field, 150)).toBe("Must be at most 100");
    });

    it("returns null for valid number range", () => {
      const field = createField("number", "Age", {
        validationRules: [
          { id: "rule-1", ruleId: "min", config: { min: 18 } },
          { id: "rule-2", ruleId: "max", config: { max: 100 } },
        ],
      });
      expect(validateFieldValue(field, 25)).toBeNull();
    });
  });

  describe("minItems/maxItems validation", () => {
    it("returns error when array has too few items", () => {
      const field = createField("multiselect", "Tags", {
        validationRules: [{ id: "rule-1", ruleId: "minItems", config: { min: 2 } }],
      });
      expect(validateFieldValue(field, ["one"])).toBe("Select at least 2 items");
    });

    it("returns error when array has too many items", () => {
      const field = createField("multiselect", "Tags", {
        validationRules: [{ id: "rule-1", ruleId: "maxItems", config: { max: 3 } }],
      });
      expect(validateFieldValue(field, ["a", "b", "c", "d"])).toBe("Select at most 3 items");
    });

    it("returns null for valid array length", () => {
      const field = createField("multiselect", "Tags", {
        validationRules: [
          { id: "rule-1", ruleId: "minItems", config: { min: 1 } },
          { id: "rule-2", ruleId: "maxItems", config: { max: 5 } },
        ],
      });
      expect(validateFieldValue(field, ["a", "b"])).toBeNull();
    });
  });

  describe("integer validation", () => {
    it("returns error for non-integer number", () => {
      const field = createField("number", "Count", {
        validationRules: [{ id: "rule-1", ruleId: "integer", config: {} }],
      });
      expect(validateFieldValue(field, 3.5)).toBe("Must be a whole number");
    });

    it("returns null for integer number", () => {
      const field = createField("number", "Count", {
        validationRules: [{ id: "rule-1", ruleId: "integer", config: {} }],
      });
      expect(validateFieldValue(field, 5)).toBeNull();
    });
  });

  describe("positive/negative validation", () => {
    it("returns error for non-positive number", () => {
      const field = createField("number", "Amount", {
        validationRules: [{ id: "rule-1", ruleId: "positive", config: {} }],
      });
      expect(validateFieldValue(field, 0)).toBe("Must be a positive number");
      expect(validateFieldValue(field, -5)).toBe("Must be a positive number");
    });

    it("returns error for non-negative number", () => {
      const field = createField("number", "Adjustment", {
        validationRules: [{ id: "rule-1", ruleId: "negative", config: {} }],
      });
      expect(validateFieldValue(field, 0)).toBe("Must be a negative number");
      expect(validateFieldValue(field, 5)).toBe("Must be a negative number");
    });

    it("returns null for valid positive/negative numbers", () => {
      const positiveField = createField("number", "Amount", {
        validationRules: [{ id: "rule-1", ruleId: "positive", config: {} }],
      });
      expect(validateFieldValue(positiveField, 10)).toBeNull();

      const negativeField = createField("number", "Adjustment", {
        validationRules: [{ id: "rule-1", ruleId: "negative", config: {} }],
      });
      expect(validateFieldValue(negativeField, -10)).toBeNull();
    });
  });

  describe("multiple validation rules", () => {
    it("applies all rules and returns first error", () => {
      const field = createField("text", "Name", {
        required: true,
        validationRules: [
          { id: "rule-1", ruleId: "minLength", config: { min: 3 } },
          { id: "rule-2", ruleId: "maxLength", config: { max: 10 } },
        ],
      });

      // Required check fails first
      expect(validateFieldValue(field, "")).toBe("This field is required");
      // Min length fails
      expect(validateFieldValue(field, "Hi")).toBe("Must be at least 3 characters");
      // Max length fails
      expect(validateFieldValue(field, "Hello World!")).toBe("Must be at most 10 characters");
      // Valid
      expect(validateFieldValue(field, "Hello")).toBeNull();
    });
  });
});

describe("validateForm", () => {
  it("returns empty array for valid form", () => {
    const fields = [
      createField("text", "Name", { required: true }),
      createField("text", "Email", {
        validationRules: [{ id: "rule-1", ruleId: "email", config: {} }],
      }),
    ];
    const values = {
      [fields[0]!.id]: "John",
      [fields[1]!.id]: "john@example.com",
    };

    const errors = validateForm(fields, values);
    expect(errors).toEqual([]);
  });

  it("returns errors for invalid fields", () => {
    const fields = [
      createField("text", "Name", { required: true }),
      createField("text", "Email", {
        validationRules: [{ id: "rule-1", ruleId: "email", config: {} }],
      }),
    ];
    const values = {
      [fields[0]!.id]: "",
      [fields[1]!.id]: "invalid-email",
    };

    const errors = validateForm(fields, values);
    expect(errors).toHaveLength(2);
    expect(errors.map((e) => e.fieldId)).toContain(fields[0]!.id);
    expect(errors.map((e) => e.fieldId)).toContain(fields[1]!.id);
  });

  it("returns empty array for empty form", () => {
    const errors = validateForm([], {});
    expect(errors).toEqual([]);
  });
});

describe("getInitialFieldValue", () => {
  it("returns default value if provided", () => {
    const field = createField("text", "Name", { defaultValue: "Default" });
    expect(getInitialFieldValue(field)).toBe("Default");
  });

  it("returns false for checkbox", () => {
    const field = createField("checkbox", "Accept");
    expect(getInitialFieldValue(field)).toBe(false);
  });

  it("returns empty array for multiselect", () => {
    const field = createField("multiselect", "Tags");
    expect(getInitialFieldValue(field)).toEqual([]);
  });

  it("returns null for number", () => {
    const field = createField("number", "Age");
    expect(getInitialFieldValue(field)).toBeNull();
  });

  it("returns null for date", () => {
    const field = createField("date", "Birthday");
    expect(getInitialFieldValue(field)).toBeNull();
  });

  it("returns null for file", () => {
    const field = createField("file", "Document");
    expect(getInitialFieldValue(field)).toBeNull();
  });

  it("returns empty string for text fields", () => {
    const textField = createField("text", "Name");
    expect(getInitialFieldValue(textField)).toBe("");

    const textareaField = createField("textarea", "Description");
    expect(getInitialFieldValue(textareaField)).toBe("");
  });
});

describe("createInitialFormValues", () => {
  it("creates values for all fields", () => {
    const fields = [
      createField("text", "Name"),
      createField("checkbox", "Accept"),
      createField("number", "Age"),
    ];

    const values = createInitialFormValues(fields);

    expect(Object.keys(values)).toHaveLength(3);
    expect(values[fields[0]!.id]).toBe("");
    expect(values[fields[1]!.id]).toBe(false);
    expect(values[fields[2]!.id]).toBeNull();
  });

  it("uses default values when provided", () => {
    const fields = [
      createField("text", "Name", { defaultValue: "John" }),
      createField("checkbox", "Accept", { defaultValue: true }),
    ];

    const values = createInitialFormValues(fields);

    expect(values[fields[0]!.id]).toBe("John");
    expect(values[fields[1]!.id]).toBe(true);
  });

  it("returns empty object for empty fields array", () => {
    const values = createInitialFormValues([]);
    expect(values).toEqual({});
  });
});

describe("Preview Integration", () => {
  describe("complete workflow", () => {
    it("supports full form preview workflow", () => {
      // 1. Create canvas state with fields
      const state = createEmptyCanvasState();
      const nameField = createField("text", "Name", { required: true });
      const emailField = createField("text", "Email", {
        validationRules: [{ id: "rule-1", ruleId: "email", config: {} }],
      });

      const canvasState: CanvasState = {
        ...state,
        fields: [nameField, emailField],
      };

      // 2. Create initial form values
      const values = createInitialFormValues(canvasState.fields);
      expect(values[nameField.id]).toBe("");
      expect(values[emailField.id]).toBe("");

      // 3. Simulate user input
      values[nameField.id] = "John Doe";
      values[emailField.id] = "john@example.com";

      // 4. Validate form
      const errors = validateForm(canvasState.fields, values);
      expect(errors).toEqual([]);
    });

    it("detects validation errors in workflow", () => {
      // Create form with required fields
      const state = createEmptyCanvasState();
      const nameField = createField("text", "Name", { required: true });
      const ageField = createField("number", "Age", {
        validationRules: [
          { id: "rule-1", ruleId: "min", config: { min: 18 } },
        ],
      });

      const canvasState: CanvasState = {
        ...state,
        fields: [nameField, ageField],
      };

      // User submits with errors
      const values: PreviewFormValues = {
        [nameField.id]: "", // Empty required field
        [ageField.id]: 15, // Below minimum
      };

      const errors = validateForm(canvasState.fields, values);
      expect(errors).toHaveLength(2);

      const nameError = errors.find((e) => e.fieldId === nameField.id);
      expect(nameError?.message).toBe("This field is required");

      const ageError = errors.find((e) => e.fieldId === ageField.id);
      expect(ageError?.message).toBe("Must be at least 18");
    });
  });

  describe("viewport modes", () => {
    it("supports desktop and mobile viewport modes", () => {
      const desktopMode: ViewportMode = "desktop";
      const mobileMode: ViewportMode = "mobile";

      expect(desktopMode).toBe("desktop");
      expect(mobileMode).toBe("mobile");
    });

    it("has correct viewport widths", () => {
      expect(MOBILE_VIEWPORT_WIDTH).toBe(375);
      expect(DESKTOP_VIEWPORT_WIDTH).toBe(1024);
    });
  });

  describe("event handling", () => {
    it("PreviewValueChangeEvent captures field changes", () => {
      const event: PreviewValueChangeEvent = {
        fieldId: "field-123",
        value: "new value",
      };

      expect(event.fieldId).toBe("field-123");
      expect(event.value).toBe("new value");
    });

    it("PreviewValidationEvent reports validation state", () => {
      const validEvent: PreviewValidationEvent = {
        isValid: true,
        errors: [],
      };

      const invalidEvent: PreviewValidationEvent = {
        isValid: false,
        errors: [
          { fieldId: "field-1", message: "Required" },
          { fieldId: "field-2", message: "Invalid email" },
        ],
      };

      expect(validEvent.isValid).toBe(true);
      expect(validEvent.errors).toHaveLength(0);

      expect(invalidEvent.isValid).toBe(false);
      expect(invalidEvent.errors).toHaveLength(2);
    });
  });
});

describe("Preview Edge Cases", () => {
  it("handles fields with no validation rules", () => {
    const field = createField("text", "Name");
    expect(validateFieldValue(field, "Any value")).toBeNull();
    expect(validateFieldValue(field, "")).toBeNull();
  });

  it("handles unknown validation rule gracefully", () => {
    const field = createField("text", "Name", {
      validationRules: [{ id: "rule-1", ruleId: "unknownRule" as never, config: {} }],
    });
    // Should not throw, just return null (unknown rule is skipped)
    expect(validateFieldValue(field, "value")).toBeNull();
  });

  it("handles invalid regex pattern gracefully", () => {
    const field = createField("text", "Code", {
      validationRules: [
        { id: "rule-1", ruleId: "pattern", config: { pattern: "[invalid(" } },
      ],
    });
    // Should not throw, just skip the invalid regex
    expect(validateFieldValue(field, "any value")).toBeNull();
  });

  it("handles very long string values", () => {
    const longString = "a".repeat(10000);
    const field = createField("text", "Content", {
      validationRules: [{ id: "rule-1", ruleId: "maxLength", config: { max: 5000 } }],
    });
    expect(validateFieldValue(field, longString)).toBe("Must be at most 5000 characters");
  });

  it("handles special characters in values", () => {
    const field = createField("text", "Name", {
      validationRules: [{ id: "rule-1", ruleId: "minLength", config: { min: 2 } }],
    });
    expect(validateFieldValue(field, "!@#$%")).toBeNull();
  });

  it("handles undefined config values gracefully", () => {
    const field = createField("text", "Name", {
      validationRules: [{ id: "rule-1", ruleId: "minLength", config: {} }],
    });
    // Should not throw when min is undefined
    expect(validateFieldValue(field, "Hi")).toBeNull();
  });
});

describe("Preview All Field Types", () => {
  const fieldTypes = [
    "text",
    "textarea",
    "number",
    "checkbox",
    "select",
    "multiselect",
    "date",
    "file",
  ] as const;

  it("creates initial values for all field types", () => {
    for (const fieldType of fieldTypes) {
      const field = createField(fieldType, `${fieldType} field`);
      const value = getInitialFieldValue(field);
      expect(value).toBeDefined();
    }
  });

  it("validates required for all field types", () => {
    for (const fieldType of fieldTypes) {
      const field = createField(fieldType, `${fieldType} field`, { required: true });

      // Empty/null values should fail required validation
      const emptyValue = fieldType === "checkbox" ? false :
                         fieldType === "multiselect" ? [] : "";

      // Checkbox with false is considered "not required" in many form systems
      // but our validation treats empty string/null/undefined/empty array as required errors
      if (fieldType !== "checkbox") {
        const error = validateFieldValue(field, emptyValue);
        expect(error).toBe("This field is required");
      }
    }
  });
});

describe("Preview Props Variations", () => {
  it("supports props with custom submit button text", () => {
    const props: FormPreviewProps = {
      submitButtonText: "Send Application",
    };
    expect(props.submitButtonText).toBe("Send Application");
  });

  it("supports props without header", () => {
    const props: FormPreviewProps = {
      showHeader: false,
    };
    expect(props.showHeader).toBe(false);
  });

  it("supports full PreviewProps configuration", () => {
    const canvasState = createEmptyCanvasState();

    let capturedValues: PreviewFormValues | null = null;
    let capturedValidation: PreviewValidationEvent | null = null;

    const props: PreviewProps = {
      canvasState,
      initialValues: { "field-1": "initial" },
      initialViewportMode: "mobile",
      validateOnChange: true,
      onValuesChange: (values) => {
        capturedValues = values;
      },
      onValidationChange: (event) => {
        capturedValidation = event;
      },
      showSplitView: false,
      className: "custom-preview",
    };

    // Simulate callbacks
    props.onValuesChange?.({ "field-1": "updated" });
    props.onValidationChange?.({ isValid: true, errors: [] });

    expect(capturedValues).toEqual({ "field-1": "updated" });
    expect(capturedValidation).toEqual({ isValid: true, errors: [] });
    expect(props.initialViewportMode).toBe("mobile");
    expect(props.showSplitView).toBe(false);
  });
});
