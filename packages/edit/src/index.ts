/**
 * @phantom-zone/edit
 *
 * Block-based content editor including:
 * - Block document model (PZ-200)
 * - Block registry system (PZ-201)
 * - Typography blocks (PZ-202)
 * - Layout blocks (PZ-203)
 * - Media blocks (PZ-204)
 * - Form blocks (PZ-205)
 * - Block sidebar (PZ-206)
 * - Block selection & focus (PZ-207)
 * - Block property editor (PZ-208)
 * - Drag and drop (PZ-209)
 * - Undo/redo history (PZ-210)
 * - Clipboard operations (PZ-211)
 * - MDX serialization (PZ-212)
 * - Auto-save & versioning (PZ-213)
 * - Multi-page management (PZ-214)
 * - Slash commands (PZ-215)
 * - Preview modes (PZ-218)
 * - Collaborative editing indicators (PZ-219)
 * - Mobile editor (PZ-220)
 */

export const VERSION = "0.0.1";

// Block Document Model (PZ-200)
export {
  // Types
  type Block,
  type BlockCategory,
  type BlockDefinition,
  type BlockProps,
  type BlockRegistry,
  type BlockTypeId,
  type ClipboardContent,
  type Document,
  type DocumentError,
  type DocumentErrorCode,
  type DocumentMeta,
  type DocumentOperation,
  type DocumentSnapshot,
  type HistoryEntry,
  type Result,
  type SelectionState,
  type BaseBlockProps,
  // Type utilities
  ok,
  err,
  createDocumentError,
  // Schemas
  BaseBlockPropsSchema,
  BlockSchema,
  ClipboardContentSchema,
  DocumentMetaSchema,
  DocumentOperationSchema,
  DocumentSchema,
  SelectionStateSchema,
  UUIDv7Schema,
  // Registry
  createBlockRegistry,
  createDefaultBlockRegistry,
  getBlockRegistry,
  resetGlobalBlockRegistry,
  // Document state and operations
  $blocks,
  $blockCount,
  $clipboard,
  $document,
  $documentId,
  $meta,
  $selectedBlock,
  $selectedBlockId,
  $selection,
  createEmptyDocument,
  createInitialMeta,
  createInitialSelection,
  copyTextToClipboard,
  copyToClipboard,
  deleteBlockAction,
  initializeDocument,
  insertBlockAction,
  moveBlockAction,
  pasteFromClipboard,
  selectBlock,
  setBlockChildrenAction,
  setSelection,
  updateBlockPropsAction,
  updateMetaAction,
  applyOperation,
  cloneBlock,
  createSnapshot,
  findBlockById,
  findBlockIndex,
  findParentBlock,
  getBlockPath,
  restoreSnapshot,
  validateDocument,
  // Default block definitions
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
  // Props schemas
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
  // Props types
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
} from "./model";

// Placeholder - to be implemented in Phase 2
export function BlockEditor(): never {
  throw new Error("Not implemented - see PZ-200: https://github.com/ezmode-games/phantom-zone/issues/41");
}
