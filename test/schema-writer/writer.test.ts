import { describe, expect, it } from "vitest";
import { writeSchema } from "../../src/schema-writer/writer";
import { makeField, makeForm } from "./helpers";

describe("writeSchema", () => {
  describe("output structure", () => {
    it("generates correct import statement", () => {
      const form = makeForm({
        fields: [makeField({ name: "name" })],
      });
      const result = writeSchema({ form });
      expect(result.code).toContain('import { z } from "zod/v4";');
    });

    it("generates const export with schema name", () => {
      const form = makeForm({
        schemaExportName: "userSchema",
        fields: [makeField({ name: "name" })],
      });
      const result = writeSchema({ form });
      expect(result.code).toContain("export const userSchema = z.object({");
    });

    it("generates type export with inferred name", () => {
      const form = makeForm({
        schemaExportName: "userSchema",
        fields: [makeField({ name: "name" })],
      });
      const result = writeSchema({ form });
      expect(result.code).toContain(
        "export type User = z.infer<typeof userSchema>;",
      );
    });

    it("generates type name from profileSchema -> Profile", () => {
      const form = makeForm({
        schemaExportName: "profileSchema",
        fields: [makeField({ name: "bio" })],
      });
      const result = writeSchema({ form });
      expect(result.code).toContain(
        "export type Profile = z.infer<typeof profileSchema>;",
      );
    });

    it("returns empty warnings when all fields succeed", () => {
      const form = makeForm({
        fields: [makeField({ name: "name" })],
      });
      const result = writeSchema({ form });
      expect(result.warnings).toEqual([]);
    });
  });

  describe("field ordering", () => {
    it("preserves field order in output", () => {
      const form = makeForm({
        fields: [
          makeField({ name: "alpha" }),
          makeField({ name: "beta" }),
          makeField({ name: "gamma" }),
        ],
      });
      const result = writeSchema({ form });
      const alphaIdx = result.code.indexOf("alpha:");
      const betaIdx = result.code.indexOf("beta:");
      const gammaIdx = result.code.indexOf("gamma:");
      expect(alphaIdx).toBeLessThan(betaIdx);
      expect(betaIdx).toBeLessThan(gammaIdx);
    });
  });

  describe("multiple field types", () => {
    it("generates full schema with mixed types", () => {
      const form = makeForm({
        schemaExportName: "contactSchema",
        fields: [
          makeField({
            name: "name",
            type: "string",
            metadata: { kind: "string" },
          }),
          makeField({
            name: "email",
            type: "string",
            constraints: { format: "email" },
            metadata: { kind: "string" },
          }),
          makeField({
            name: "age",
            type: "number",
            metadata: { kind: "number" },
          }),
          makeField({
            name: "active",
            type: "boolean",
            metadata: { kind: "boolean" },
          }),
          makeField({
            name: "role",
            type: "enum",
            metadata: { kind: "enum", values: ["admin", "user"] },
          }),
          makeField({
            name: "tags",
            type: "array",
            metadata: {
              kind: "array",
              element: makeField({
                name: "item",
                type: "string",
                metadata: { kind: "string" },
              }),
            },
          }),
        ],
      });
      const result = writeSchema({ form });

      expect(result.code).toContain("name: z.string(),");
      expect(result.code).toContain("email: z.email(),");
      expect(result.code).toContain("age: z.number(),");
      expect(result.code).toContain("active: z.boolean(),");
      expect(result.code).toContain('role: z.enum(["admin", "user"]),');
      expect(result.code).toContain("tags: z.array(z.string()),");
      expect(result.code).toContain(
        "export type Contact = z.infer<typeof contactSchema>;",
      );
    });

    it("emits record type through writer", () => {
      const form = makeForm({
        fields: [
          makeField({
            name: "scores",
            type: "record",
            metadata: {
              kind: "record",
              valueDescriptor: makeField({
                name: "value",
                type: "number",
                metadata: { kind: "number" },
              }),
            },
          }),
        ],
      });
      const result = writeSchema({ form });
      expect(result.code).toContain("scores: z.record(z.string(), z.number())");
    });
  });

  describe("tuple fields", () => {
    it("generates tuple field in schema output", () => {
      const form = makeForm({
        fields: [
          makeField({
            name: "coord",
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
              ],
            },
          }),
        ],
      });
      const result = writeSchema({ form });
      expect(result.code).toContain(
        "coord: z.tuple([z.string(), z.number()]),",
      );
    });
  });

  describe("nested object fields", () => {
    it("emits nested object fields", () => {
      const form = makeForm({
        fields: [
          makeField({
            name: "address",
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
          }),
        ],
      });
      const result = writeSchema({ form });
      expect(result.code).toContain(
        "address: z.object({ street: z.string(), city: z.string() }),",
      );
    });
  });

  describe("error handling", () => {
    it("throws on unsupported union type", () => {
      const form = makeForm({
        fields: [
          makeField({
            name: "choice",
            type: "union",
            metadata: { kind: "union", variants: [] },
          }),
        ],
      });
      expect(() => writeSchema({ form })).toThrow(
        'Unsupported field type "union"',
      );
    });

    it("emits record type through writer", () => {
      const form = makeForm({
        fields: [
          makeField({
            name: "scores",
            type: "record",
            metadata: {
              kind: "record",
              valueDescriptor: makeField({
                name: "value",
                type: "number",
                metadata: { kind: "number" },
              }),
            },
          }),
        ],
      });
      const result = writeSchema({ form });
      expect(result.code).toContain("scores: z.record(z.string(), z.number())");
    });
  });

  describe("empty schema", () => {
    it("generates valid empty object schema", () => {
      const form = makeForm({ fields: [] });
      const result = writeSchema({ form });
      expect(result.code).toContain("export const testSchema = z.object({");
      expect(result.code).toContain("});");
    });
  });
});
