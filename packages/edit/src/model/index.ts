/**
 * Block Document Model
 *
 * Core data model for block-based documents.
 * Implements PZ-200: Block Document Model
 */

// Types
export type {
  Block,
  BlockCategory,
  BlockDefinition,
  BlockProps,
  BlockRegistry,
  BlockTypeId,
  ClipboardContent,
  Document,
  DocumentError,
  DocumentErrorCode,
  DocumentMeta,
  DocumentOperation,
  DocumentSnapshot,
  HistoryEntry,
  Result,
  SelectionState,
  BaseBlockProps,
} from "./types";

// Type utilities
export { ok, err, createDocumentError } from "./types";

// Schemas
export {
  BaseBlockPropsSchema,
  BlockSchema,
  ClipboardContentSchema,
  DocumentMetaSchema,
  DocumentOperationSchema,
  DocumentSchema,
  SelectionStateSchema,
  UUIDv7Schema,
} from "./types";

// Registry
export {
  createBlockRegistry,
  createDefaultBlockRegistry,
  getBlockRegistry,
  resetGlobalBlockRegistry,
} from "./registry";

// Document state and operations
export {
  // Atoms
  $blocks,
  $blockCount,
  $clipboard,
  $document,
  $documentId,
  $meta,
  $selectedBlock,
  $selectedBlockId,
  $selection,
  // Factories
  createEmptyDocument,
  createInitialMeta,
  createInitialSelection,
  // Actions
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
  // Utilities
  applyOperation,
  cloneBlock,
  createSnapshot,
  findBlockById,
  findBlockIndex,
  findParentBlock,
  getBlockPath,
  restoreSnapshot,
  validateDocument,
} from "./document";

// Default block definitions
export {
  // Definition objects
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
} from "./blocks";

// Props types
export type {
  CalloutBlockProps,
  CodeBlockProps,
  ColumnsBlockProps,
  DividerBlockProps,
  EmbedBlockProps,
  FormBlockProps,
  HeadingBlockProps,
  ImageBlockProps,
  ListBlockProps,
  ParagraphBlockProps,
  QuoteBlockProps,
  SectionBlockProps,
  TableBlockProps,
  VideoBlockProps,
} from "./blocks";
