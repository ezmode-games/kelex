import { describe, expect, it } from "vitest";
import { emitField } from "../../src/schema-writer/field-emitter";
import { makeField } from "./helpers";

describe("emitField", () => {
  describe("string fields", () => {
    it("emits z.string() for plain string", () => {
      const field = makeField({ type: "string", metadata: { kind: "string" } });
      expect(emitField(field)).toBe("z.string()");
    });

    it("emits z.string().min().max() with constraints", () => {
      const field = makeField({
        type: "string",
        constraints: { minLength: 1, maxLength: 100 },
        metadata: { kind: "string" },
      });
      expect(emitField(field)).toBe("z.string().min(1).max(100)");
    });

    it("emits z.string().regex() with pattern", () => {
      const field = makeField({
        type: "string",
        constraints: { pattern: "^[a-z]+$" },
        metadata: { kind: "string" },
      });
      expect(emitField(field)).toBe("z.string().regex(/^[a-z]+$/)");
    });

    it("emits z.email() for email format", () => {
      const field = makeField({
        type: "string",
        constraints: { format: "email" },
        metadata: { kind: "string" },
      });
      expect(emitField(field)).toBe("z.email()");
    });

    it("emits z.url() for url format", () => {
      const field = makeField({
        type: "string",
        constraints: { format: "url" },
        metadata: { kind: "string" },
      });
      expect(emitField(field)).toBe("z.url()");
    });

    it("emits z.uuid() for uuid format", () => {
      const field = makeField({
        type: "string",
        constraints: { format: "uuid" },
        metadata: { kind: "string" },
      });
      expect(emitField(field)).toBe("z.uuid()");
    });

    it("emits z.cuid() for cuid format", () => {
      const field = makeField({
        type: "string",
        constraints: { format: "cuid" },
        metadata: { kind: "string" },
      });
      expect(emitField(field)).toBe("z.cuid()");
    });

    it("emits z.iso.datetime() for datetime format", () => {
      const field = makeField({
        type: "string",
        constraints: { format: "datetime" },
        metadata: { kind: "string" },
      });
      expect(emitField(field)).toBe("z.iso.datetime()");
    });

    it("chains constraints after format types", () => {
      const field = makeField({
        type: "string",
        constraints: { format: "email", minLength: 5 },
        metadata: { kind: "string" },
      });
      expect(emitField(field)).toBe("z.email().min(5)");
    });
  });

  describe("number fields", () => {
    it("emits z.number() for plain number", () => {
      const field = makeField({
        type: "number",
        constraints: {},
        metadata: { kind: "number" },
      });
      expect(emitField(field)).toBe("z.number()");
    });

    it("emits z.number().int() when isInt constraint is set", () => {
      const field = makeField({
        type: "number",
        constraints: { isInt: true },
        metadata: { kind: "number" },
      });
      expect(emitField(field)).toBe("z.number().int()");
    });

    it("emits z.number().min().max() with range constraints", () => {
      const field = makeField({
        type: "number",
        constraints: { min: 0, max: 100 },
        metadata: { kind: "number" },
      });
      expect(emitField(field)).toBe("z.number().min(0).max(100)");
    });

    it("emits z.number().int().min().max() combining isInt and range", () => {
      const field = makeField({
        type: "number",
        constraints: { isInt: true, min: 1, max: 10 },
        metadata: { kind: "number" },
      });
      expect(emitField(field)).toBe("z.number().int().min(1).max(10)");
    });

    it("emits .multipleOf() for step constraint", () => {
      const field = makeField({
        type: "number",
        constraints: { step: 0.5 },
        metadata: { kind: "number" },
      });
      expect(emitField(field)).toBe("z.number().multipleOf(0.5)");
    });
  });

  describe("boolean fields", () => {
    it("emits z.boolean()", () => {
      const field = makeField({
        type: "boolean",
        metadata: { kind: "boolean" },
      });
      expect(emitField(field)).toBe("z.boolean()");
    });
  });

  describe("date fields", () => {
    it("emits z.date()", () => {
      const field = makeField({ type: "date", metadata: { kind: "date" } });
      expect(emitField(field)).toBe("z.date()");
    });
  });

  describe("enum fields", () => {
    it("emits z.enum() with values", () => {
      const field = makeField({
        type: "enum",
        metadata: { kind: "enum", values: ["admin", "user", "guest"] },
      });
      expect(emitField(field)).toBe('z.enum(["admin", "user", "guest"])');
    });

    it("emits z.enum() with single value", () => {
      const field = makeField({
        type: "enum",
        metadata: { kind: "enum", values: ["only"] },
      });
      expect(emitField(field)).toBe('z.enum(["only"])');
    });
  });

  describe("array fields", () => {
    it("emits z.array() with scalar element", () => {
      const field = makeField({
        type: "array",
        metadata: {
          kind: "array",
          element: makeField({
            name: "item",
            type: "string",
            metadata: { kind: "string" },
          }),
        },
      });
      expect(emitField(field)).toBe("z.array(z.string())");
    });

    it("emits z.array() with enum element", () => {
      const field = makeField({
        type: "array",
        metadata: {
          kind: "array",
          element: makeField({
            name: "item",
            type: "enum",
            metadata: { kind: "enum", values: ["a", "b"] },
          }),
        },
      });
      expect(emitField(field)).toBe('z.array(z.enum(["a", "b"]))');
    });

    it("emits z.array().min().max() with item constraints", () => {
      const field = makeField({
        type: "array",
        constraints: { minItems: 1, maxItems: 5 },
        metadata: {
          kind: "array",
          element: makeField({
            name: "item",
            type: "number",
            metadata: { kind: "number" },
          }),
        },
      });
      expect(emitField(field)).toBe("z.array(z.number()).min(1).max(5)");
    });
  });

  describe("tuple fields", () => {
    it("emits z.tuple() with mixed scalar elements", () => {
      const field = makeField({
        type: "tuple",
        metadata: {
          kind: "tuple",
          elements: [
            makeField({
              name: "0",
              type: "string",
              metadata: { kind: "string" },
            }),
            makeField({
              name: "1",
              type: "number",
              metadata: { kind: "number" },
            }),
            makeField({
              name: "2",
              type: "boolean",
              metadata: { kind: "boolean" },
            }),
          ],
        },
      });
      expect(emitField(field)).toBe(
        "z.tuple([z.string(), z.number(), z.boolean()])",
      );
    });

    it("emits z.tuple() with constrained elements", () => {
      const field = makeField({
        type: "tuple",
        metadata: {
          kind: "tuple",
          elements: [
            makeField({
              name: "0",
              type: "string",
              constraints: { minLength: 1 },
              metadata: { kind: "string" },
            }),
            makeField({
              name: "1",
              type: "number",
              constraints: { min: 0, max: 100 },
              metadata: { kind: "number" },
            }),
          ],
        },
      });
      expect(emitField(field)).toBe(
        "z.tuple([z.string().min(1), z.number().min(0).max(100)])",
      );
    });

    it("emits z.tuple().optional() for optional tuple", () => {
      const field = makeField({
        type: "tuple",
        isOptional: true,
        metadata: {
          kind: "tuple",
          elements: [
            makeField({
              name: "0",
              type: "string",
              metadata: { kind: "string" },
            }),
            makeField({
              name: "1",
              type: "number",
              metadata: { kind: "number" },
            }),
          ],
        },
      });
      expect(emitField(field)).toBe(
        "z.tuple([z.string(), z.number()]).optional()",
      );
    });

    it("emits z.tuple().nullable() for nullable tuple", () => {
      const field = makeField({
        type: "tuple",
        isNullable: true,
        metadata: {
          kind: "tuple",
          elements: [
            makeField({
              name: "0",
              type: "string",
              metadata: { kind: "string" },
            }),
          ],
        },
      });
      expect(emitField(field)).toBe("z.tuple([z.string()]).nullable()");
    });
  });

  describe("optional and nullable wrapping", () => {
    it("wraps with .optional()", () => {
      const field = makeField({
        type: "string",
        isOptional: true,
        metadata: { kind: "string" },
      });
      expect(emitField(field)).toBe("z.string().optional()");
    });

    it("wraps with .nullable()", () => {
      const field = makeField({
        type: "string",
        isNullable: true,
        metadata: { kind: "string" },
      });
      expect(emitField(field)).toBe("z.string().nullable()");
    });

    it("wraps nullable then optional (correct order)", () => {
      const field = makeField({
        type: "string",
        isOptional: true,
        isNullable: true,
        metadata: { kind: "string" },
      });
      expect(emitField(field)).toBe("z.string().nullable().optional()");
    });
  });

  describe("description", () => {
    it("chains .describe() when description exists", () => {
      const field = makeField({
        type: "string",
        description: "A user name",
        metadata: { kind: "string" },
      });
      expect(emitField(field)).toBe('z.string().describe("A user name")');
    });

    it("places .describe() after optional/nullable", () => {
      const field = makeField({
        type: "number",
        isOptional: true,
        isNullable: true,
        description: "Age in years",
        metadata: { kind: "number" },
      });
      expect(emitField(field)).toBe(
        'z.number().nullable().optional().describe("Age in years")',
      );
    });

    it("escapes special characters in description", () => {
      const field = makeField({
        type: "string",
        description: 'Uses "quotes" and \\backslashes',
        metadata: { kind: "string" },
      });
      expect(emitField(field)).toBe(
        'z.string().describe("Uses \\"quotes\\" and \\\\backslashes")',
      );
    });
  });

  describe("object fields", () => {
    it("emits z.object() with child fields", () => {
      const field = makeField({
        type: "object",
        metadata: {
          kind: "object",
          fields: [
            makeField({
              name: "street",
              type: "string",
              metadata: { kind: "string" },
            }),
            makeField({
              name: "city",
              type: "string",
              metadata: { kind: "string" },
            }),
          ],
        },
      });
      expect(emitField(field)).toBe(
        "z.object({ street: z.string(), city: z.string() })",
      );
    });

    it("emits z.object() with constrained children", () => {
      const field = makeField({
        type: "object",
        metadata: {
          kind: "object",
          fields: [
            makeField({
              name: "name",
              type: "string",
              constraints: { minLength: 1, maxLength: 50 },
              metadata: { kind: "string" },
            }),
            makeField({
              name: "age",
              type: "number",
              constraints: { min: 0, max: 150 },
              metadata: { kind: "number" },
            }),
          ],
        },
      });
      expect(emitField(field)).toBe(
        "z.object({ name: z.string().min(1).max(50), age: z.number().min(0).max(150) })",
      );
    });

    it("emits deeply nested objects", () => {
      const field = makeField({
        type: "object",
        metadata: {
          kind: "object",
          fields: [
            makeField({
              name: "inner",
              type: "object",
              metadata: {
                kind: "object",
                fields: [
                  makeField({
                    name: "value",
                    type: "string",
                    metadata: { kind: "string" },
                  }),
                ],
              },
            }),
          ],
        },
      });
      expect(emitField(field)).toBe(
        "z.object({ inner: z.object({ value: z.string() }) })",
      );
    });

    it("wraps with .optional() on optional nested object", () => {
      const field = makeField({
        type: "object",
        isOptional: true,
        metadata: {
          kind: "object",
          fields: [
            makeField({
              name: "x",
              type: "number",
              metadata: { kind: "number" },
            }),
          ],
        },
      });
      expect(emitField(field)).toBe("z.object({ x: z.number() }).optional()");
    });

    it("wraps with .nullable() on nullable nested object", () => {
      const field = makeField({
        type: "object",
        isNullable: true,
        metadata: {
          kind: "object",
          fields: [
            makeField({
              name: "x",
              type: "number",
              metadata: { kind: "number" },
            }),
          ],
        },
      });
      expect(emitField(field)).toBe("z.object({ x: z.number() }).nullable()");
    });

    it("quotes property names that are not valid identifiers", () => {
      const field = makeField({
        type: "object",
        metadata: {
          kind: "object",
          fields: [
            makeField({
              name: "my-field",
              type: "string",
              metadata: { kind: "string" },
            }),
            makeField({
              name: "has spaces",
              type: "number",
              metadata: { kind: "number" },
            }),
            makeField({
              name: "validName",
              type: "boolean",
              metadata: { kind: "boolean" },
            }),
          ],
        },
      });
      expect(emitField(field)).toBe(
        'z.object({ "my-field": z.string(), "has spaces": z.number(), validName: z.boolean() })',
      );
    });

    it("emits array of objects", () => {
      const field = makeField({
        type: "array",
        metadata: {
          kind: "array",
          element: makeField({
            name: "item",
            type: "object",
            metadata: {
              kind: "object",
              fields: [
                makeField({
                  name: "id",
                  type: "number",
                  metadata: { kind: "number" },
                }),
                makeField({
                  name: "label",
                  type: "string",
                  metadata: { kind: "string" },
                }),
              ],
            },
          }),
        },
      });
      expect(emitField(field)).toBe(
        "z.array(z.object({ id: z.number(), label: z.string() }))",
      );
    });
  });

  describe("unsupported types", () => {
    it("throws on union type", () => {
      const field = makeField({
        type: "union",
        metadata: { kind: "union", variants: [] },
      });
      expect(() => emitField(field)).toThrow('Unsupported field type "union"');
    });

    it("throws on record type", () => {
      const field = makeField({
        type: "record",
        metadata: {
          kind: "record",
          valueDescriptor: makeField({ name: "value" }),
        },
      });
      expect(() => emitField(field)).toThrow('Unsupported field type "record"');
    });
  });
});
