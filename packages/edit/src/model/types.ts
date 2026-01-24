/**
 * Block Document Model Types
 *
 * Core type definitions for the block-based document system.
 * Implements PZ-200: Block Document Model
 */

import { z } from "zod/v4";

// Result type for explicit error handling (no thrown exceptions)
export type Result<T, E = DocumentError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

// Error types for document operations
export type DocumentErrorCode =
  | "BLOCK_NOT_FOUND"
  | "INVALID_BLOCK_TYPE"
  | "INVALID_PARENT"
  | "DUPLICATE_ID"
  | "VALIDATION_ERROR"
  | "REGISTRY_ERROR"
  | "IMMUTABLE_VIOLATION";

export interface DocumentError {
  code: DocumentErrorCode;
  message: string;
  cause?: unknown;
}

export function createDocumentError(
  code: DocumentErrorCode,
  message: string,
  cause?: unknown
): DocumentError {
  return { code, message, cause };
}

// Block type identifiers - extensible via registry
export type BlockTypeId = string;

// Block categories for grouping in the sidebar
export type BlockCategory =
  | "typography"
  | "layout"
  | "media"
  | "form"
  | "embed"
  | "other";

/**
 * Base properties that all blocks share
 */
export interface BaseBlockProps {
  /** Custom CSS class name */
  className?: string;
  /** Inline styles (serializable subset) */
  style?: Record<string, string | number>;
  /** Data attributes for testing/integration */
  dataAttributes?: Record<string, string>;
}

/**
 * Zod schema for base block props validation
 */
export const BaseBlockPropsSchema = z.object({
  className: z.string().optional(),
  style: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
  dataAttributes: z.record(z.string(), z.string()).optional(),
});

/**
 * Props specific to a block type (generic)
 * Each block type can define its own props schema
 */
export type BlockProps<T = object> = BaseBlockProps & T;

/**
 * Schema for UUIDv7 validation
 * UUIDv7 format: xxxxxxxx-xxxx-7xxx-yxxx-xxxxxxxxxxxx
 * where x is any hex digit and y is 8, 9, a, or b
 */
export const UUIDv7Schema = z
  .string()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    "Must be a valid UUIDv7"
  );

/**
 * A block in the document tree
 */
export interface Block<T = object> {
  /** Unique identifier (UUIDv7) */
  id: string;
  /** Block type identifier */
  type: BlockTypeId;
  /** Block-specific properties */
  props: BlockProps<T>;
  /** Child blocks for container blocks */
  children?: Block[];
}

/**
 * Zod schema for block validation (recursive)
 */
export const BlockSchema: z.ZodType<Block> = z.lazy(() =>
  z.object({
    id: UUIDv7Schema,
    type: z.string().min(1),
    props: z.record(z.string(), z.unknown()),
    children: z.array(BlockSchema).optional(),
  })
);

/**
 * Document metadata
 */
export interface DocumentMeta {
  /** Document title */
  title?: string;
  /** Document description */
  description?: string;
  /** Author identifier */
  authorId?: string;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
  /** Document version (for optimistic locking) */
  version: number;
  /** Custom metadata */
  custom?: Record<string, unknown>;
}

/**
 * Zod schema for document metadata
 */
export const DocumentMetaSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  authorId: z.string().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  version: z.number().int().nonnegative(),
  custom: z.record(z.string(), z.unknown()).optional(),
});

/**
 * A complete block document
 */
export interface Document {
  /** Unique document identifier (UUIDv7) */
  id: string;
  /** Root-level blocks */
  blocks: Block[];
  /** Document metadata */
  meta: DocumentMeta;
}

/**
 * Zod schema for document validation
 */
export const DocumentSchema = z.object({
  id: UUIDv7Schema,
  blocks: z.array(BlockSchema),
  meta: DocumentMetaSchema,
});

/**
 * Selection state for the editor
 */
export interface SelectionState {
  /** Currently selected block ID (null if none) */
  blockId: string | null;
  /** Selection anchor position within block content */
  anchor?: number;
  /** Selection focus position within block content */
  focus?: number;
}

/**
 * Zod schema for selection state
 */
export const SelectionStateSchema = z.object({
  blockId: z.string().nullable(),
  anchor: z.number().optional(),
  focus: z.number().optional(),
});

/**
 * Clipboard content for copy/paste operations
 */
export interface ClipboardContent {
  /** Type of content */
  type: "blocks" | "text";
  /** Block data (for block copy) */
  blocks?: Block[];
  /** Text content (for text copy) */
  text?: string;
  /** Source document ID */
  sourceDocumentId?: string;
}

/**
 * Zod schema for clipboard content
 */
export const ClipboardContentSchema = z.object({
  type: z.enum(["blocks", "text"]),
  blocks: z.array(BlockSchema).optional(),
  text: z.string().optional(),
  sourceDocumentId: z.string().optional(),
});

/**
 * Block definition for the registry
 * Defines metadata and validation for a block type
 */
export interface BlockDefinition<T = object> {
  /** Unique type identifier */
  id: BlockTypeId;
  /** Human-readable display name */
  name: string;
  /** Icon identifier (e.g., Lucide icon name) */
  icon: string;
  /** Category for grouping in sidebar */
  category: BlockCategory;
  /** Description shown in block palette */
  description?: string;
  /** Whether this block can contain children */
  isContainer: boolean;
  /** Allowed child block types (if container, empty = all allowed) */
  allowedChildren?: BlockTypeId[];
  /** Zod schema for validating block props */
  propsSchema: z.ZodType<T>;
  /** Default props when creating new block */
  defaultProps: T;
  /** Keywords for search in block palette */
  keywords?: string[];
}

/**
 * The block registry interface
 */
export interface BlockRegistry {
  /** Register a new block type */
  register<T = object>(definition: BlockDefinition<T>): Result<void, DocumentError>;

  /** Get a block definition by ID */
  get(id: BlockTypeId): BlockDefinition | undefined;

  /** Get all registered block types */
  getAll(): BlockDefinition[];

  /** Get block types by category */
  getByCategory(category: BlockCategory): BlockDefinition[];

  /** Check if a block type is registered */
  has(id: BlockTypeId): boolean;

  /** Unregister a block type */
  unregister(id: BlockTypeId): boolean;

  /** Clear all registrations */
  clear(): void;

  /** Validate block props against its schema */
  validateProps(
    typeId: BlockTypeId,
    props: unknown
  ): Result<BlockProps, DocumentError>;

  /** Create a new block with default props */
  createBlock(typeId: BlockTypeId): Result<Block, DocumentError>;

  /** Check if a block can contain a child of given type */
  canContain(
    parentTypeId: BlockTypeId,
    childTypeId: BlockTypeId
  ): Result<boolean, DocumentError>;
}

/**
 * Document operations for immutable updates
 */
export type DocumentOperation =
  | { type: "INSERT_BLOCK"; block: Block; parentId?: string; index: number }
  | { type: "DELETE_BLOCK"; blockId: string }
  | { type: "MOVE_BLOCK"; blockId: string; newParentId?: string; newIndex: number }
  | { type: "UPDATE_BLOCK_PROPS"; blockId: string; props: Partial<BlockProps> }
  | { type: "SET_BLOCK_CHILDREN"; blockId: string; children: Block[] }
  | { type: "UPDATE_META"; meta: Partial<DocumentMeta> };

/**
 * Zod schema for document operations
 */
export const DocumentOperationSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("INSERT_BLOCK"),
    block: BlockSchema,
    parentId: z.string().optional(),
    index: z.number().int().nonnegative(),
  }),
  z.object({
    type: z.literal("DELETE_BLOCK"),
    blockId: z.string(),
  }),
  z.object({
    type: z.literal("MOVE_BLOCK"),
    blockId: z.string(),
    newParentId: z.string().optional(),
    newIndex: z.number().int().nonnegative(),
  }),
  z.object({
    type: z.literal("UPDATE_BLOCK_PROPS"),
    blockId: z.string(),
    props: z.record(z.string(), z.unknown()),
  }),
  z.object({
    type: z.literal("SET_BLOCK_CHILDREN"),
    blockId: z.string(),
    children: z.array(BlockSchema),
  }),
  z.object({
    type: z.literal("UPDATE_META"),
    meta: DocumentMetaSchema.partial(),
  }),
]);

/**
 * History entry for undo/redo
 */
export interface HistoryEntry {
  /** Timestamp of the operation */
  timestamp: Date;
  /** The operation that was performed */
  operation: DocumentOperation;
  /** Inverse operation for undo */
  inverse: DocumentOperation;
}

/**
 * Document state snapshot for history
 */
export interface DocumentSnapshot {
  /** The document state */
  document: Document;
  /** Selection state at time of snapshot */
  selection: SelectionState;
}
