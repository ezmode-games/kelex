import { describe, expect, it } from "vitest";
import {
  DividerPropsSchema,
  defaultDividerProps,
  defaultEmbedProps,
  defaultFormProps,
  defaultHeadingProps,
  defaultImageProps,
  defaultListProps,
  defaultParagraphProps,
  dividerDefinition,
  EmbedPropsSchema,
  embedDefinition,
  FormPropsSchema,
  formDefinition,
  HeadingPropsSchema,
  headingDefinition,
  ImagePropsSchema,
  imageDefinition,
  ListPropsSchema,
  listDefinition,
  ParagraphPropsSchema,
  paragraphDefinition,
} from "../src/blocks";

describe("Block schemas", () => {
  describe("HeadingPropsSchema", () => {
    it("accepts valid heading props", () => {
      const result = HeadingPropsSchema.safeParse({
        text: "Hello",
        level: "h1",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid level", () => {
      const result = HeadingPropsSchema.safeParse({
        text: "Hello",
        level: "h5",
      });
      expect(result.success).toBe(false);
    });

    it("defaults match schema", () => {
      const result = HeadingPropsSchema.safeParse(defaultHeadingProps);
      expect(result.success).toBe(true);
    });
  });

  describe("ParagraphPropsSchema", () => {
    it("accepts valid paragraph props", () => {
      const result = ParagraphPropsSchema.safeParse({ text: "Some text" });
      expect(result.success).toBe(true);
    });

    it("defaults match schema", () => {
      const result = ParagraphPropsSchema.safeParse(defaultParagraphProps);
      expect(result.success).toBe(true);
    });
  });

  describe("ListPropsSchema", () => {
    it("accepts valid list props", () => {
      const result = ListPropsSchema.safeParse({
        items: ["a", "b"],
        ordered: false,
      });
      expect(result.success).toBe(true);
    });

    it("defaults match schema", () => {
      const result = ListPropsSchema.safeParse(defaultListProps);
      expect(result.success).toBe(true);
    });
  });

  describe("ImagePropsSchema", () => {
    it("accepts valid image props", () => {
      const result = ImagePropsSchema.safeParse({
        src: "https://example.com/img.png",
        alt: "Test image",
      });
      expect(result.success).toBe(true);
    });

    it("accepts optional fields", () => {
      const result = ImagePropsSchema.safeParse({
        src: "",
        alt: "",
        caption: "A caption",
        alignment: "center",
      });
      expect(result.success).toBe(true);
    });

    it("defaults match schema", () => {
      const result = ImagePropsSchema.safeParse(defaultImageProps);
      expect(result.success).toBe(true);
    });
  });

  describe("EmbedPropsSchema", () => {
    it("accepts valid embed props", () => {
      const result = EmbedPropsSchema.safeParse({
        url: "https://youtube.com/watch?v=123",
      });
      expect(result.success).toBe(true);
    });

    it("defaults match schema", () => {
      const result = EmbedPropsSchema.safeParse(defaultEmbedProps);
      expect(result.success).toBe(true);
    });
  });

  describe("DividerPropsSchema", () => {
    it("accepts valid divider props", () => {
      const result = DividerPropsSchema.safeParse({ style: "dashed" });
      expect(result.success).toBe(true);
    });

    it("rejects invalid style", () => {
      const result = DividerPropsSchema.safeParse({ style: "wavy" });
      expect(result.success).toBe(false);
    });

    it("defaults match schema", () => {
      const result = DividerPropsSchema.safeParse(defaultDividerProps);
      expect(result.success).toBe(true);
    });
  });

  describe("FormPropsSchema", () => {
    it("accepts valid form props", () => {
      const result = FormPropsSchema.safeParse({ formId: "abc-123" });
      expect(result.success).toBe(true);
    });

    it("defaults match schema", () => {
      const result = FormPropsSchema.safeParse(defaultFormProps);
      expect(result.success).toBe(true);
    });
  });
});

describe("Block definitions", () => {
  const definitions = [
    headingDefinition,
    paragraphDefinition,
    listDefinition,
    imageDefinition,
    embedDefinition,
    dividerDefinition,
    formDefinition,
  ];

  it("all have required fields", () => {
    for (const def of definitions) {
      expect(def.type).toBeTruthy();
      expect(def.label).toBeTruthy();
      expect(def.category).toBeTruthy();
    }
  });

  it("all have unique types", () => {
    const types = definitions.map((d) => d.type);
    expect(new Set(types).size).toBe(types.length);
  });
});
