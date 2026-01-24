/**
 * Default Block Definitions with Components
 *
 * Core block types with React component stubs for the block-based document editor.
 * Implements PZ-201: Block Registry System
 */

import type { ComponentType } from "react";
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
  type CalloutBlockProps,
  type CodeBlockProps,
  type ColumnsBlockProps,
  type DividerBlockProps,
  type EmbedBlockProps,
  type FormBlockProps,
  type HeadingBlockProps,
  type ImageBlockProps,
  type ListBlockProps,
  type ParagraphBlockProps,
  type QuoteBlockProps,
  type SectionBlockProps,
  type TableBlockProps,
  type VideoBlockProps,
} from "../model/blocks";
import type { BaseComponentBlockDefinition, BlockComponentProps, BlockDefinition } from "./types";

/**
 * Create a placeholder component that renders a simple div with block info
 * Used as a stub until actual block components are implemented
 */
function createStubComponent<T>(blockType: string): ComponentType<BlockComponentProps<T>> {
  // Return a minimal functional component
  const StubComponent = function StubBlockComponent(props: BlockComponentProps<T>) {
    return null; // Stub returns null - real components will render actual UI
  };
  StubComponent.displayName = `${blockType}Block`;
  return StubComponent;
}

// Heading block with component
export const headingComponentBlockDefinition: BlockDefinition<HeadingBlockProps> = {
  id: "heading",
  name: "Heading",
  icon: "heading",
  category: "typography",
  description: "A heading for section titles",
  isContainer: false,
  propsSchema: HeadingBlockPropsSchema,
  defaultProps: {
    level: 2,
    content: "",
  },
  keywords: ["title", "h1", "h2", "h3", "header"],
  component: createStubComponent<HeadingBlockProps>("Heading"),
  version: "1.0.0",
};

// Paragraph block with component
export const paragraphComponentBlockDefinition: BlockDefinition<ParagraphBlockProps> = {
  id: "paragraph",
  name: "Paragraph",
  icon: "text",
  category: "typography",
  description: "A paragraph of text",
  isContainer: false,
  propsSchema: ParagraphBlockPropsSchema,
  defaultProps: {
    content: "",
  },
  keywords: ["text", "body", "p"],
  component: createStubComponent<ParagraphBlockProps>("Paragraph"),
  version: "1.0.0",
};

// List block with component
export const listComponentBlockDefinition: BlockDefinition<ListBlockProps> = {
  id: "list",
  name: "List",
  icon: "list",
  category: "typography",
  description: "A bullet, numbered, or checkbox list",
  isContainer: false,
  propsSchema: ListBlockPropsSchema,
  defaultProps: {
    type: "bullet",
    items: [{ content: "" }],
  },
  keywords: ["bullet", "numbered", "ul", "ol", "todo", "checkbox"],
  component: createStubComponent<ListBlockProps>("List"),
  version: "1.0.0",
};

// Quote block with component
export const quoteComponentBlockDefinition: BlockDefinition<QuoteBlockProps> = {
  id: "quote",
  name: "Quote",
  icon: "quote",
  category: "typography",
  description: "A blockquote with optional citation",
  isContainer: false,
  propsSchema: QuoteBlockPropsSchema,
  defaultProps: {
    content: "",
  },
  keywords: ["blockquote", "citation", "pullquote"],
  component: createStubComponent<QuoteBlockProps>("Quote"),
  version: "1.0.0",
};

// Code block with component
export const codeComponentBlockDefinition: BlockDefinition<CodeBlockProps> = {
  id: "code",
  name: "Code",
  icon: "code",
  category: "typography",
  description: "A code block with syntax highlighting",
  isContainer: false,
  propsSchema: CodeBlockPropsSchema,
  defaultProps: {
    content: "",
    showLineNumbers: true,
  },
  keywords: ["pre", "syntax", "programming"],
  component: createStubComponent<CodeBlockProps>("Code"),
  version: "1.0.0",
};

// Callout block with component
export const calloutComponentBlockDefinition: BlockDefinition<CalloutBlockProps> = {
  id: "callout",
  name: "Callout",
  icon: "alert-circle",
  category: "typography",
  description: "A highlighted callout or alert box",
  isContainer: false,
  propsSchema: CalloutBlockPropsSchema,
  defaultProps: {
    type: "info",
    content: "",
  },
  keywords: ["alert", "notice", "warning", "info", "tip"],
  component: createStubComponent<CalloutBlockProps>("Callout"),
  version: "1.0.0",
};

// Table block with component
export const tableComponentBlockDefinition: BlockDefinition<TableBlockProps> = {
  id: "table",
  name: "Table",
  icon: "table",
  category: "typography",
  description: "A data table",
  isContainer: false,
  propsSchema: TableBlockPropsSchema,
  defaultProps: {
    headers: ["Column 1", "Column 2"],
    rows: [["", ""]],
    striped: true,
    bordered: true,
  },
  keywords: ["grid", "data", "spreadsheet"],
  component: createStubComponent<TableBlockProps>("Table"),
  version: "1.0.0",
};

// Divider block with component
export const dividerComponentBlockDefinition: BlockDefinition<DividerBlockProps> = {
  id: "divider",
  name: "Divider",
  icon: "minus",
  category: "layout",
  description: "A horizontal divider line",
  isContainer: false,
  propsSchema: DividerBlockPropsSchema,
  defaultProps: {
    style: "solid",
  },
  keywords: ["hr", "line", "separator"],
  component: createStubComponent<DividerBlockProps>("Divider"),
  version: "1.0.0",
};

// Section block with component
export const sectionComponentBlockDefinition: BlockDefinition<SectionBlockProps> = {
  id: "section",
  name: "Section",
  icon: "layout",
  category: "layout",
  description: "A container section for grouping blocks",
  isContainer: true,
  propsSchema: SectionBlockPropsSchema,
  defaultProps: {
    padding: "medium",
  },
  keywords: ["container", "group", "wrapper", "div"],
  component: createStubComponent<SectionBlockProps>("Section"),
  version: "1.0.0",
};

// Columns block with component
export const columnsComponentBlockDefinition: BlockDefinition<ColumnsBlockProps> = {
  id: "columns",
  name: "Columns",
  icon: "columns",
  category: "layout",
  description: "A multi-column layout",
  isContainer: true,
  propsSchema: ColumnsBlockPropsSchema,
  defaultProps: {
    columns: 2,
    gap: "medium",
  },
  keywords: ["grid", "layout", "side-by-side"],
  component: createStubComponent<ColumnsBlockProps>("Columns"),
  version: "1.0.0",
};

// Image block with component
export const imageComponentBlockDefinition: BlockDefinition<ImageBlockProps> = {
  id: "image",
  name: "Image",
  icon: "image",
  category: "media",
  description: "An image with optional caption",
  isContainer: false,
  propsSchema: ImageBlockPropsSchema,
  defaultProps: {
    src: "",
    alt: "",
    align: "center",
  },
  keywords: ["picture", "photo", "img"],
  component: createStubComponent<ImageBlockProps>("Image"),
  version: "1.0.0",
};

// Video block with component
export const videoComponentBlockDefinition: BlockDefinition<VideoBlockProps> = {
  id: "video",
  name: "Video",
  icon: "video",
  category: "media",
  description: "An embedded video",
  isContainer: false,
  propsSchema: VideoBlockPropsSchema,
  defaultProps: {
    src: "",
    controls: true,
    muted: false,
  },
  keywords: ["movie", "clip", "mp4"],
  component: createStubComponent<VideoBlockProps>("Video"),
  version: "1.0.0",
};

// Embed block with component
export const embedComponentBlockDefinition: BlockDefinition<EmbedBlockProps> = {
  id: "embed",
  name: "Embed",
  icon: "globe",
  category: "embed",
  description: "Embed external content (YouTube, Twitter, etc.)",
  isContainer: false,
  propsSchema: EmbedBlockPropsSchema,
  defaultProps: {
    url: "",
    aspectRatio: "16:9",
  },
  keywords: ["iframe", "youtube", "twitter", "external"],
  component: createStubComponent<EmbedBlockProps>("Embed"),
  version: "1.0.0",
};

// Form block with component
export const formComponentBlockDefinition: BlockDefinition<FormBlockProps> = {
  id: "form",
  name: "Form",
  icon: "file-text",
  category: "form",
  description: "Embed a form",
  isContainer: false,
  propsSchema: FormBlockPropsSchema,
  defaultProps: {
    formId: "",
    submitButtonText: "Submit",
  },
  keywords: ["input", "survey", "questionnaire"],
  component: createStubComponent<FormBlockProps>("Form"),
  version: "1.0.0",
};

/**
 * All default component block definitions
 * Uses BaseComponentBlockDefinition for storage to handle type variance
 */
export const defaultComponentBlockDefinitions: BaseComponentBlockDefinition[] = [
  // Typography
  headingComponentBlockDefinition,
  paragraphComponentBlockDefinition,
  listComponentBlockDefinition,
  quoteComponentBlockDefinition,
  codeComponentBlockDefinition,
  calloutComponentBlockDefinition,
  tableComponentBlockDefinition,
  // Layout
  dividerComponentBlockDefinition,
  sectionComponentBlockDefinition,
  columnsComponentBlockDefinition,
  // Media
  imageComponentBlockDefinition,
  videoComponentBlockDefinition,
  // Embed
  embedComponentBlockDefinition,
  // Form
  formComponentBlockDefinition,
];
