import { describe, expect, it } from "vitest";
import {
  CalloutBlockPropsSchema,
  CodeBlockPropsSchema,
  ColumnsBlockPropsSchema,
  DividerBlockPropsSchema,
  EmbedBlockPropsSchema,
  FormBlockPropsSchema,
  HeadingBlockPropsSchema,
  ImageBlockPropsSchema,
  ListBlockPropsSchema,
  ParagraphBlockPropsSchema,
  QuoteBlockPropsSchema,
  SectionBlockPropsSchema,
  TableBlockPropsSchema,
  VideoBlockPropsSchema,
  calloutBlockDefinition,
  codeBlockDefinition,
  columnsBlockDefinition,
  defaultBlockDefinitions,
  dividerBlockDefinition,
  embedBlockDefinition,
  formBlockDefinition,
  headingBlockDefinition,
  imageBlockDefinition,
  listBlockDefinition,
  paragraphBlockDefinition,
  quoteBlockDefinition,
  sectionBlockDefinition,
  tableBlockDefinition,
  videoBlockDefinition,
} from "../../src/model/blocks";

describe("Default Block Definitions", () => {
  describe("All definitions", () => {
    it("exports all default definitions", () => {
      expect(defaultBlockDefinitions).toHaveLength(14);
    });

    it("all definitions have required properties", () => {
      for (const def of defaultBlockDefinitions) {
        expect(def.id).toBeDefined();
        expect(def.name).toBeDefined();
        expect(def.icon).toBeDefined();
        expect(def.category).toBeDefined();
        expect(def.propsSchema).toBeDefined();
        expect(def.defaultProps).toBeDefined();
        expect(typeof def.isContainer).toBe("boolean");
      }
    });

    it("all definitions have unique IDs", () => {
      const ids = defaultBlockDefinitions.map((d) => d.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("default props validate against schema", () => {
      for (const def of defaultBlockDefinitions) {
        const result = def.propsSchema.safeParse(def.defaultProps);
        expect(result.success).toBe(true);
      }
    });
  });

  describe("headingBlockDefinition", () => {
    it("has correct properties", () => {
      expect(headingBlockDefinition.id).toBe("heading");
      expect(headingBlockDefinition.name).toBe("Heading");
      expect(headingBlockDefinition.icon).toBe("heading");
      expect(headingBlockDefinition.category).toBe("typography");
      expect(headingBlockDefinition.isContainer).toBe(false);
    });

    it("validates level 1-6", () => {
      for (let level = 1; level <= 6; level++) {
        const result = HeadingBlockPropsSchema.safeParse({
          level,
          content: "Title",
        });
        expect(result.success).toBe(true);
      }
    });

    it("rejects invalid level", () => {
      const result = HeadingBlockPropsSchema.safeParse({
        level: 7,
        content: "Title",
      });
      expect(result.success).toBe(false);
    });

    it("validates align options", () => {
      for (const align of ["left", "center", "right"]) {
        const result = HeadingBlockPropsSchema.safeParse({
          level: 1,
          content: "Title",
          align,
        });
        expect(result.success).toBe(true);
      }
    });

    it("has correct default props", () => {
      expect(headingBlockDefinition.defaultProps.level).toBe(2);
      expect(headingBlockDefinition.defaultProps.content).toBe("");
    });
  });

  describe("paragraphBlockDefinition", () => {
    it("has correct properties", () => {
      expect(paragraphBlockDefinition.id).toBe("paragraph");
      expect(paragraphBlockDefinition.category).toBe("typography");
      expect(paragraphBlockDefinition.isContainer).toBe(false);
    });

    it("validates align options", () => {
      for (const align of ["left", "center", "right", "justify"]) {
        const result = ParagraphBlockPropsSchema.safeParse({
          content: "Text",
          align,
        });
        expect(result.success).toBe(true);
      }
    });

    it("requires content", () => {
      const result = ParagraphBlockPropsSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("listBlockDefinition", () => {
    it("has correct properties", () => {
      expect(listBlockDefinition.id).toBe("list");
      expect(listBlockDefinition.category).toBe("typography");
    });

    it("validates list types", () => {
      for (const type of ["bullet", "numbered", "checkbox"]) {
        const result = ListBlockPropsSchema.safeParse({
          type,
          items: [{ content: "Item" }],
        });
        expect(result.success).toBe(true);
      }
    });

    it("validates checkbox items with checked property", () => {
      const result = ListBlockPropsSchema.safeParse({
        type: "checkbox",
        items: [
          { content: "Item 1", checked: true },
          { content: "Item 2", checked: false },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("has correct default props", () => {
      expect(listBlockDefinition.defaultProps.type).toBe("bullet");
      expect(listBlockDefinition.defaultProps.items).toHaveLength(1);
    });
  });

  describe("quoteBlockDefinition", () => {
    it("has correct properties", () => {
      expect(quoteBlockDefinition.id).toBe("quote");
      expect(quoteBlockDefinition.category).toBe("typography");
    });

    it("validates optional citation", () => {
      const result = QuoteBlockPropsSchema.safeParse({
        content: "Quote text",
        citation: "Author Name",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("codeBlockDefinition", () => {
    it("has correct properties", () => {
      expect(codeBlockDefinition.id).toBe("code");
      expect(codeBlockDefinition.category).toBe("typography");
    });

    it("validates language and showLineNumbers", () => {
      const result = CodeBlockPropsSchema.safeParse({
        content: "const x = 1;",
        language: "javascript",
        showLineNumbers: true,
      });
      expect(result.success).toBe(true);
    });

    it("has correct default props", () => {
      expect(codeBlockDefinition.defaultProps.showLineNumbers).toBe(true);
    });
  });

  describe("dividerBlockDefinition", () => {
    it("has correct properties", () => {
      expect(dividerBlockDefinition.id).toBe("divider");
      expect(dividerBlockDefinition.category).toBe("layout");
    });

    it("validates style options", () => {
      for (const style of ["solid", "dashed", "dotted"]) {
        const result = DividerBlockPropsSchema.safeParse({ style });
        expect(result.success).toBe(true);
      }
    });
  });

  describe("sectionBlockDefinition", () => {
    it("has correct properties", () => {
      expect(sectionBlockDefinition.id).toBe("section");
      expect(sectionBlockDefinition.category).toBe("layout");
      expect(sectionBlockDefinition.isContainer).toBe(true);
    });

    it("validates padding options", () => {
      for (const padding of ["none", "small", "medium", "large"]) {
        const result = SectionBlockPropsSchema.safeParse({ padding });
        expect(result.success).toBe(true);
      }
    });
  });

  describe("columnsBlockDefinition", () => {
    it("has correct properties", () => {
      expect(columnsBlockDefinition.id).toBe("columns");
      expect(columnsBlockDefinition.category).toBe("layout");
      expect(columnsBlockDefinition.isContainer).toBe(true);
    });

    it("validates column counts", () => {
      for (const columns of [2, 3, 4]) {
        const result = ColumnsBlockPropsSchema.safeParse({ columns });
        expect(result.success).toBe(true);
      }
    });

    it("rejects invalid column count", () => {
      const result = ColumnsBlockPropsSchema.safeParse({ columns: 5 });
      expect(result.success).toBe(false);
    });

    it("has correct default props", () => {
      expect(columnsBlockDefinition.defaultProps.columns).toBe(2);
      expect(columnsBlockDefinition.defaultProps.gap).toBe("medium");
    });
  });

  describe("imageBlockDefinition", () => {
    it("has correct properties", () => {
      expect(imageBlockDefinition.id).toBe("image");
      expect(imageBlockDefinition.category).toBe("media");
    });

    it("validates width options", () => {
      for (const width of [100, "auto", "full"]) {
        const result = ImageBlockPropsSchema.safeParse({
          src: "https://example.com/image.png",
          alt: "Image",
          width,
        });
        expect(result.success).toBe(true);
      }
    });

    it("requires src and alt", () => {
      const result = ImageBlockPropsSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("videoBlockDefinition", () => {
    it("has correct properties", () => {
      expect(videoBlockDefinition.id).toBe("video");
      expect(videoBlockDefinition.category).toBe("media");
    });

    it("validates video options", () => {
      const result = VideoBlockPropsSchema.safeParse({
        src: "https://example.com/video.mp4",
        poster: "https://example.com/poster.png",
        autoplay: false,
        loop: true,
        muted: true,
        controls: true,
      });
      expect(result.success).toBe(true);
    });

    it("has correct default props", () => {
      expect(videoBlockDefinition.defaultProps.controls).toBe(true);
      expect(videoBlockDefinition.defaultProps.muted).toBe(false);
    });
  });

  describe("embedBlockDefinition", () => {
    it("has correct properties", () => {
      expect(embedBlockDefinition.id).toBe("embed");
      expect(embedBlockDefinition.category).toBe("embed");
    });

    it("validates aspect ratio options", () => {
      for (const aspectRatio of ["16:9", "4:3", "1:1", "custom"]) {
        const result = EmbedBlockPropsSchema.safeParse({
          url: "https://youtube.com/watch?v=123",
          aspectRatio,
        });
        expect(result.success).toBe(true);
      }
    });
  });

  describe("formBlockDefinition", () => {
    it("has correct properties", () => {
      expect(formBlockDefinition.id).toBe("form");
      expect(formBlockDefinition.category).toBe("form");
    });

    it("validates form props", () => {
      const result = FormBlockPropsSchema.safeParse({
        formId: "form-123",
        successMessage: "Thank you!",
        submitButtonText: "Send",
      });
      expect(result.success).toBe(true);
    });

    it("has correct default props", () => {
      expect(formBlockDefinition.defaultProps.submitButtonText).toBe("Submit");
    });
  });

  describe("calloutBlockDefinition", () => {
    it("has correct properties", () => {
      expect(calloutBlockDefinition.id).toBe("callout");
      expect(calloutBlockDefinition.category).toBe("typography");
    });

    it("validates callout types", () => {
      for (const type of ["info", "warning", "error", "success", "note"]) {
        const result = CalloutBlockPropsSchema.safeParse({
          type,
          content: "Important message",
        });
        expect(result.success).toBe(true);
      }
    });

    it("validates optional title", () => {
      const result = CalloutBlockPropsSchema.safeParse({
        type: "warning",
        title: "Warning!",
        content: "Be careful",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("tableBlockDefinition", () => {
    it("has correct properties", () => {
      expect(tableBlockDefinition.id).toBe("table");
      expect(tableBlockDefinition.category).toBe("typography");
    });

    it("validates table structure", () => {
      const result = TableBlockPropsSchema.safeParse({
        headers: ["Name", "Age", "City"],
        rows: [
          ["Alice", "25", "NYC"],
          ["Bob", "30", "LA"],
        ],
        striped: true,
        bordered: false,
      });
      expect(result.success).toBe(true);
    });

    it("has correct default props", () => {
      expect(tableBlockDefinition.defaultProps.headers).toHaveLength(2);
      expect(tableBlockDefinition.defaultProps.rows).toHaveLength(1);
      expect(tableBlockDefinition.defaultProps.striped).toBe(true);
      expect(tableBlockDefinition.defaultProps.bordered).toBe(true);
    });
  });

  describe("Keywords", () => {
    it("heading has search keywords", () => {
      expect(headingBlockDefinition.keywords).toContain("title");
      expect(headingBlockDefinition.keywords).toContain("h1");
    });

    it("paragraph has search keywords", () => {
      expect(paragraphBlockDefinition.keywords).toContain("text");
    });

    it("list has search keywords", () => {
      expect(listBlockDefinition.keywords).toContain("bullet");
      expect(listBlockDefinition.keywords).toContain("numbered");
    });

    it("section has search keywords", () => {
      expect(sectionBlockDefinition.keywords).toContain("container");
    });
  });

  describe("Container blocks", () => {
    it("section is a container", () => {
      expect(sectionBlockDefinition.isContainer).toBe(true);
    });

    it("columns is a container", () => {
      expect(columnsBlockDefinition.isContainer).toBe(true);
    });

    it("paragraph is not a container", () => {
      expect(paragraphBlockDefinition.isContainer).toBe(false);
    });

    it("heading is not a container", () => {
      expect(headingBlockDefinition.isContainer).toBe(false);
    });
  });
});
