// Block definitions and schemas

export type {
  DividerProps,
  EmbedBlockProps,
  FormBlockProps,
  HeadingProps,
  ImageBlockProps,
  ListProps,
  ParagraphProps,
} from "./blocks";
export {
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
} from "./blocks";

// Editor
export type { PageEditorProps } from "./editor/PageEditor";
export { PageEditor } from "./editor/PageEditor";
export type { BlockConfig } from "./editor/registry";
export {
  blockConfigs,
  blockDefaults,
  blockSchemas,
  defaultRegistry,
} from "./editor/registry";
export { renderBlockContent } from "./editor/renderers";
export type {
  UsePageEditorStateOptions,
  UsePageEditorStateReturn,
} from "./editor/state";
export { usePageEditorState } from "./editor/state";
// Pages
export type { Page, PageMeta, PageStorage, SavePageInput } from "./pages";
export { PageService } from "./pages";
// Persistence
export type {
  AutoSaveOptions,
  AutoSaveStatus,
  PagePersistence,
  UseAutoSaveReturn,
} from "./persistence";
export { useAutoSave } from "./persistence";
// Serialization
export {
  deserializeBlocks,
  SerializedBlockSchema,
  SerializedBlocksSchema,
  serializeBlocks,
} from "./serialization";
