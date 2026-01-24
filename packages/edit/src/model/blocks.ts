/**
 * Default Block Definitions
 *
 * Core block types for the block-based document editor.
 * Implements PZ-200: Block Document Model
 */

import { z } from "zod/v4";
import type { BlockDefinition } from "./types";
import { BaseBlockPropsSchema } from "./types";

// Heading block props
export interface HeadingBlockProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  content: string;
  align?: "left" | "center" | "right";
}

export const HeadingBlockPropsSchema = BaseBlockPropsSchema.extend({
  level: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
    z.literal(6),
  ]),
  content: z.string(),
  align: z.enum(["left", "center", "right"]).optional(),
});

export const headingBlockDefinition: BlockDefinition<HeadingBlockProps> = {
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
};

// Paragraph block props
export interface ParagraphBlockProps {
  content: string;
  align?: "left" | "center" | "right" | "justify";
}

export const ParagraphBlockPropsSchema = BaseBlockPropsSchema.extend({
  content: z.string(),
  align: z.enum(["left", "center", "right", "justify"]).optional(),
});

export const paragraphBlockDefinition: BlockDefinition<ParagraphBlockProps> = {
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
};

// List block props
export interface ListBlockProps {
  type: "bullet" | "numbered" | "checkbox";
  items: Array<{
    content: string;
    checked?: boolean;
  }>;
}

export const ListBlockPropsSchema = BaseBlockPropsSchema.extend({
  type: z.enum(["bullet", "numbered", "checkbox"]),
  items: z.array(
    z.object({
      content: z.string(),
      checked: z.boolean().optional(),
    })
  ),
});

export const listBlockDefinition: BlockDefinition<ListBlockProps> = {
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
};

// Quote block props
export interface QuoteBlockProps {
  content: string;
  citation?: string;
}

export const QuoteBlockPropsSchema = BaseBlockPropsSchema.extend({
  content: z.string(),
  citation: z.string().optional(),
});

export const quoteBlockDefinition: BlockDefinition<QuoteBlockProps> = {
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
};

// Code block props
export interface CodeBlockProps {
  content: string;
  language?: string;
  showLineNumbers?: boolean;
}

export const CodeBlockPropsSchema = BaseBlockPropsSchema.extend({
  content: z.string(),
  language: z.string().optional(),
  showLineNumbers: z.boolean().optional(),
});

export const codeBlockDefinition: BlockDefinition<CodeBlockProps> = {
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
};

// Divider block props (minimal)
export interface DividerBlockProps {
  style?: "solid" | "dashed" | "dotted";
}

export const DividerBlockPropsSchema = BaseBlockPropsSchema.extend({
  style: z.enum(["solid", "dashed", "dotted"]).optional(),
});

export const dividerBlockDefinition: BlockDefinition<DividerBlockProps> = {
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
};

// Container/Section block props
export interface SectionBlockProps {
  name?: string;
  padding?: "none" | "small" | "medium" | "large";
  background?: string;
}

export const SectionBlockPropsSchema = BaseBlockPropsSchema.extend({
  name: z.string().optional(),
  padding: z.enum(["none", "small", "medium", "large"]).optional(),
  background: z.string().optional(),
});

export const sectionBlockDefinition: BlockDefinition<SectionBlockProps> = {
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
};

// Columns block props
export interface ColumnsBlockProps {
  columns: 2 | 3 | 4;
  gap?: "none" | "small" | "medium" | "large";
}

export const ColumnsBlockPropsSchema = BaseBlockPropsSchema.extend({
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]),
  gap: z.enum(["none", "small", "medium", "large"]).optional(),
});

export const columnsBlockDefinition: BlockDefinition<ColumnsBlockProps> = {
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
};

// Image block props
export interface ImageBlockProps {
  src: string;
  alt: string;
  caption?: string;
  width?: number | "auto" | "full";
  align?: "left" | "center" | "right";
}

export const ImageBlockPropsSchema = BaseBlockPropsSchema.extend({
  src: z.string(),
  alt: z.string(),
  caption: z.string().optional(),
  width: z.union([z.number(), z.literal("auto"), z.literal("full")]).optional(),
  align: z.enum(["left", "center", "right"]).optional(),
});

export const imageBlockDefinition: BlockDefinition<ImageBlockProps> = {
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
};

// Video block props
export interface VideoBlockProps {
  src: string;
  poster?: string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
}

export const VideoBlockPropsSchema = BaseBlockPropsSchema.extend({
  src: z.string(),
  poster: z.string().optional(),
  autoplay: z.boolean().optional(),
  loop: z.boolean().optional(),
  muted: z.boolean().optional(),
  controls: z.boolean().optional(),
});

export const videoBlockDefinition: BlockDefinition<VideoBlockProps> = {
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
};

// Embed block props
export interface EmbedBlockProps {
  url: string;
  aspectRatio?: "16:9" | "4:3" | "1:1" | "custom";
  customHeight?: number;
}

export const EmbedBlockPropsSchema = BaseBlockPropsSchema.extend({
  url: z.string(),
  aspectRatio: z.enum(["16:9", "4:3", "1:1", "custom"]).optional(),
  customHeight: z.number().optional(),
});

export const embedBlockDefinition: BlockDefinition<EmbedBlockProps> = {
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
};

// Form block props (references a form by ID)
export interface FormBlockProps {
  formId: string;
  successMessage?: string;
  submitButtonText?: string;
}

export const FormBlockPropsSchema = BaseBlockPropsSchema.extend({
  formId: z.string(),
  successMessage: z.string().optional(),
  submitButtonText: z.string().optional(),
});

export const formBlockDefinition: BlockDefinition<FormBlockProps> = {
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
};

// Callout/Alert block props
export interface CalloutBlockProps {
  type: "info" | "warning" | "error" | "success" | "note";
  title?: string;
  content: string;
}

export const CalloutBlockPropsSchema = BaseBlockPropsSchema.extend({
  type: z.enum(["info", "warning", "error", "success", "note"]),
  title: z.string().optional(),
  content: z.string(),
});

export const calloutBlockDefinition: BlockDefinition<CalloutBlockProps> = {
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
};

// Table block props
export interface TableBlockProps {
  headers: string[];
  rows: string[][];
  striped?: boolean;
  bordered?: boolean;
}

export const TableBlockPropsSchema = BaseBlockPropsSchema.extend({
  headers: z.array(z.string()),
  rows: z.array(z.array(z.string())),
  striped: z.boolean().optional(),
  bordered: z.boolean().optional(),
});

export const tableBlockDefinition: BlockDefinition<TableBlockProps> = {
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
};

/**
 * All default block definitions
 */
export const defaultBlockDefinitions: BlockDefinition[] = [
  // Typography
  headingBlockDefinition,
  paragraphBlockDefinition,
  listBlockDefinition,
  quoteBlockDefinition,
  codeBlockDefinition,
  calloutBlockDefinition,
  tableBlockDefinition,
  // Layout
  dividerBlockDefinition,
  sectionBlockDefinition,
  columnsBlockDefinition,
  // Media
  imageBlockDefinition,
  videoBlockDefinition,
  // Embed
  embedBlockDefinition,
  // Form
  formBlockDefinition,
];
