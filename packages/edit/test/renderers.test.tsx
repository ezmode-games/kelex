import { describe, expect, it } from "vitest";
import { renderBlockContent } from "../src/editor/renderers";

const defaultContext = {
  index: 0,
  total: 1,
  isFirst: true,
  isLast: true,
  isSelected: false,
  isFocused: false,
};

describe("renderBlockContent", () => {
  it("renders a heading block", () => {
    const el = renderBlockContent(
      { id: "1", type: "heading", props: { text: "Hello", level: "h1" } },
      defaultContext,
    );
    expect(el).toBeDefined();
  });

  it("renders a paragraph block", () => {
    const el = renderBlockContent(
      { id: "2", type: "paragraph", props: { text: "Some text" } },
      defaultContext,
    );
    expect(el).toBeDefined();
  });

  it("renders a list block", () => {
    const el = renderBlockContent(
      {
        id: "3",
        type: "list",
        props: { items: ["a", "b"], ordered: false },
      },
      defaultContext,
    );
    expect(el).toBeDefined();
  });

  it("renders an image block without src", () => {
    const el = renderBlockContent(
      { id: "4", type: "image", props: { src: "", alt: "" } },
      defaultContext,
    );
    expect(el).toBeDefined();
  });

  it("renders an image block with src", () => {
    const el = renderBlockContent(
      {
        id: "4b",
        type: "image",
        props: { src: "https://example.com/img.png", alt: "Test" },
      },
      defaultContext,
    );
    expect(el).toBeDefined();
  });

  it("renders an embed block", () => {
    const el = renderBlockContent(
      { id: "5", type: "embed", props: { url: "https://example.com" } },
      defaultContext,
    );
    expect(el).toBeDefined();
  });

  it("renders a divider block", () => {
    const el = renderBlockContent(
      { id: "6", type: "divider", props: { style: "solid" } },
      defaultContext,
    );
    expect(el).toBeDefined();
  });

  it("renders a form block", () => {
    const el = renderBlockContent(
      { id: "7", type: "form", props: { formId: "abc" } },
      defaultContext,
    );
    expect(el).toBeDefined();
  });

  it("renders unknown block type with fallback", () => {
    const el = renderBlockContent(
      { id: "99", type: "nonexistent", props: {} },
      defaultContext,
    );
    expect(el).toBeDefined();
  });
});
