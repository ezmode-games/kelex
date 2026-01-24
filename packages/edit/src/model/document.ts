/**
 * Document Model with Nanostores State Management
 *
 * Reactive state management for block-based documents using nanostores.
 * All updates are immutable for undo/redo compatibility.
 * Implements PZ-200: Block Document Model
 */

import { atom, computed, type ReadableAtom, type WritableAtom } from "nanostores";
import { uuidv7 } from "uuidv7";
import type {
  Block,
  BlockProps,
  ClipboardContent,
  Document,
  DocumentError,
  DocumentMeta,
  DocumentOperation,
  DocumentSnapshot,
  Result,
  SelectionState,
} from "./types";
import { createDocumentError, err, ok } from "./types";

/**
 * Create initial document metadata
 */
export function createInitialMeta(): DocumentMeta {
  const now = new Date();
  return {
    createdAt: now,
    updatedAt: now,
    version: 0,
  };
}

/**
 * Create an empty document
 */
export function createEmptyDocument(): Document {
  return {
    id: uuidv7(),
    blocks: [],
    meta: createInitialMeta(),
  };
}

/**
 * Create initial selection state
 */
export function createInitialSelection(): SelectionState {
  return {
    blockId: null,
  };
}

// Document state atoms
export const $document: WritableAtom<Document> = atom<Document>(createEmptyDocument());
export const $selectedBlockId: WritableAtom<string | null> = atom<string | null>(null);
export const $selection: WritableAtom<SelectionState> = atom<SelectionState>(
  createInitialSelection()
);
export const $clipboard: WritableAtom<ClipboardContent | null> =
  atom<ClipboardContent | null>(null);

// Computed atoms for derived state
export const $documentId: ReadableAtom<string> = computed($document, (doc) => doc.id);
export const $blocks: ReadableAtom<Block[]> = computed($document, (doc) => doc.blocks);
export const $meta: ReadableAtom<DocumentMeta> = computed($document, (doc) => doc.meta);
export const $blockCount: ReadableAtom<number> = computed(
  $document,
  (doc) => countBlocks(doc.blocks)
);

/**
 * Count total blocks including nested children
 */
function countBlocks(blocks: Block[]): number {
  let count = blocks.length;
  for (const block of blocks) {
    if (block.children) {
      count += countBlocks(block.children);
    }
  }
  return count;
}

/**
 * Get the currently selected block
 */
export const $selectedBlock: ReadableAtom<Block | null> = computed(
  [$document, $selectedBlockId],
  (doc, selectedId) => {
    if (!selectedId) return null;
    return findBlockById(doc.blocks, selectedId);
  }
);

/**
 * Find a block by ID in the block tree
 */
export function findBlockById(blocks: Block[], id: string): Block | null {
  for (const block of blocks) {
    if (block.id === id) {
      return block;
    }
    if (block.children) {
      const found = findBlockById(block.children, id);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Find the parent of a block by ID
 */
export function findParentBlock(
  blocks: Block[],
  id: string,
  parent: Block | null = null
): Block | null {
  for (const block of blocks) {
    if (block.id === id) {
      return parent;
    }
    if (block.children) {
      const found = findParentBlock(block.children, id, block);
      if (found !== null || block.children.some((b) => b.id === id)) {
        return found ?? block;
      }
    }
  }
  return null;
}

/**
 * Find the index of a block within its parent's children array
 */
export function findBlockIndex(blocks: Block[], id: string): number {
  return blocks.findIndex((block) => block.id === id);
}

/**
 * Get the path to a block (array of parent IDs)
 */
export function getBlockPath(blocks: Block[], id: string): string[] {
  const path: string[] = [];

  function traverse(currentBlocks: Block[], currentPath: string[]): boolean {
    for (const block of currentBlocks) {
      if (block.id === id) {
        path.push(...currentPath);
        return true;
      }
      if (block.children) {
        if (traverse(block.children, [...currentPath, block.id])) {
          return true;
        }
      }
    }
    return false;
  }

  traverse(blocks, []);
  return path;
}

// Document operations (immutable updates)

/**
 * Deep clone a block and its children with new IDs
 */
export function cloneBlock(block: Block): Block {
  const cloned: Block = {
    id: uuidv7(),
    type: block.type,
    props: { ...block.props },
  };

  if (block.children) {
    cloned.children = block.children.map(cloneBlock);
  }

  return cloned;
}

/**
 * Update a block's props immutably
 */
function updateBlockProps(
  blocks: Block[],
  id: string,
  updater: (props: BlockProps) => BlockProps
): Block[] {
  return blocks.map((block) => {
    if (block.id === id) {
      return {
        ...block,
        props: updater(block.props),
      };
    }
    if (block.children) {
      return {
        ...block,
        children: updateBlockProps(block.children, id, updater),
      };
    }
    return block;
  });
}

/**
 * Insert a block at a specific position
 */
function insertBlock(
  blocks: Block[],
  newBlock: Block,
  parentId: string | undefined,
  index: number
): Block[] {
  // Insert at root level
  if (!parentId) {
    const newBlocks = [...blocks];
    newBlocks.splice(index, 0, newBlock);
    return newBlocks;
  }

  // Insert into a parent block's children
  return blocks.map((block) => {
    if (block.id === parentId) {
      const newChildren = [...(block.children ?? [])];
      newChildren.splice(index, 0, newBlock);
      return {
        ...block,
        children: newChildren,
      };
    }
    if (block.children) {
      return {
        ...block,
        children: insertBlock(block.children, newBlock, parentId, index),
      };
    }
    return block;
  });
}

/**
 * Remove a block by ID
 */
function removeBlock(blocks: Block[], id: string): Block[] {
  // Filter out the block at current level
  const filtered = blocks.filter((block) => block.id !== id);

  // If we removed something, return early
  if (filtered.length < blocks.length) {
    return filtered;
  }

  // Recurse into children
  return blocks.map((block) => {
    if (block.children) {
      return {
        ...block,
        children: removeBlock(block.children, id),
      };
    }
    return block;
  });
}

/**
 * Set children of a specific block
 */
function setBlockChildren(
  blocks: Block[],
  id: string,
  children: Block[]
): Block[] {
  return blocks.map((block) => {
    if (block.id === id) {
      return {
        ...block,
        children,
      };
    }
    if (block.children) {
      return {
        ...block,
        children: setBlockChildren(block.children, id, children),
      };
    }
    return block;
  });
}

/**
 * Apply a document operation immutably
 */
export function applyOperation(
  doc: Document,
  operation: DocumentOperation
): Result<Document, DocumentError> {
  const now = new Date();

  switch (operation.type) {
    case "INSERT_BLOCK": {
      const newBlocks = insertBlock(
        doc.blocks,
        operation.block,
        operation.parentId,
        operation.index
      );
      return ok({
        ...doc,
        blocks: newBlocks,
        meta: {
          ...doc.meta,
          updatedAt: now,
          version: doc.meta.version + 1,
        },
      });
    }

    case "DELETE_BLOCK": {
      const block = findBlockById(doc.blocks, operation.blockId);
      if (!block) {
        return err(
          createDocumentError(
            "BLOCK_NOT_FOUND",
            `Block not found: ${operation.blockId}`
          )
        );
      }
      const newBlocks = removeBlock(doc.blocks, operation.blockId);
      return ok({
        ...doc,
        blocks: newBlocks,
        meta: {
          ...doc.meta,
          updatedAt: now,
          version: doc.meta.version + 1,
        },
      });
    }

    case "MOVE_BLOCK": {
      const block = findBlockById(doc.blocks, operation.blockId);
      if (!block) {
        return err(
          createDocumentError(
            "BLOCK_NOT_FOUND",
            `Block not found: ${operation.blockId}`
          )
        );
      }
      // Remove from old location
      const withoutBlock = removeBlock(doc.blocks, operation.blockId);
      // Insert at new location
      const newBlocks = insertBlock(
        withoutBlock,
        block,
        operation.newParentId,
        operation.newIndex
      );
      return ok({
        ...doc,
        blocks: newBlocks,
        meta: {
          ...doc.meta,
          updatedAt: now,
          version: doc.meta.version + 1,
        },
      });
    }

    case "UPDATE_BLOCK_PROPS": {
      const block = findBlockById(doc.blocks, operation.blockId);
      if (!block) {
        return err(
          createDocumentError(
            "BLOCK_NOT_FOUND",
            `Block not found: ${operation.blockId}`
          )
        );
      }
      const newBlocks = updateBlockProps(
        doc.blocks,
        operation.blockId,
        (props) => ({ ...props, ...operation.props })
      );
      return ok({
        ...doc,
        blocks: newBlocks,
        meta: {
          ...doc.meta,
          updatedAt: now,
          version: doc.meta.version + 1,
        },
      });
    }

    case "SET_BLOCK_CHILDREN": {
      const block = findBlockById(doc.blocks, operation.blockId);
      if (!block) {
        return err(
          createDocumentError(
            "BLOCK_NOT_FOUND",
            `Block not found: ${operation.blockId}`
          )
        );
      }
      const newBlocks = setBlockChildren(
        doc.blocks,
        operation.blockId,
        operation.children
      );
      return ok({
        ...doc,
        blocks: newBlocks,
        meta: {
          ...doc.meta,
          updatedAt: now,
          version: doc.meta.version + 1,
        },
      });
    }

    case "UPDATE_META": {
      return ok({
        ...doc,
        meta: {
          ...doc.meta,
          ...operation.meta,
          updatedAt: now,
          version: doc.meta.version + 1,
        },
      });
    }

    default: {
      // Exhaustive check
      const _exhaustive: never = operation;
      return err(
        createDocumentError(
          "VALIDATION_ERROR",
          `Unknown operation type: ${(_exhaustive as DocumentOperation).type}`
        )
      );
    }
  }
}

// Store actions (mutate the atoms)

/**
 * Initialize document state with a new or existing document
 */
export function initializeDocument(doc?: Document): void {
  $document.set(doc ?? createEmptyDocument());
  $selectedBlockId.set(null);
  $selection.set(createInitialSelection());
}

/**
 * Insert a block into the document
 */
export function insertBlockAction(
  block: Block,
  parentId?: string,
  index?: number
): Result<void, DocumentError> {
  const doc = $document.get();

  // Determine insertion index
  let insertIndex = index ?? 0;
  if (index === undefined) {
    if (parentId) {
      const parent = findBlockById(doc.blocks, parentId);
      insertIndex = parent?.children?.length ?? 0;
    } else {
      insertIndex = doc.blocks.length;
    }
  }

  const operation: DocumentOperation = {
    type: "INSERT_BLOCK",
    block,
    parentId,
    index: insertIndex,
  };

  const result = applyOperation(doc, operation);
  if (!result.ok) {
    return err(result.error);
  }

  $document.set(result.value);
  return ok(undefined);
}

/**
 * Delete a block from the document
 */
export function deleteBlockAction(blockId: string): Result<void, DocumentError> {
  const doc = $document.get();
  const operation: DocumentOperation = {
    type: "DELETE_BLOCK",
    blockId,
  };

  const result = applyOperation(doc, operation);
  if (!result.ok) {
    return err(result.error);
  }

  $document.set(result.value);

  // Clear selection if deleted block was selected
  if ($selectedBlockId.get() === blockId) {
    $selectedBlockId.set(null);
  }

  return ok(undefined);
}

/**
 * Move a block to a new position
 */
export function moveBlockAction(
  blockId: string,
  newParentId?: string,
  newIndex?: number
): Result<void, DocumentError> {
  const doc = $document.get();

  // Determine new index
  let targetIndex = newIndex ?? 0;
  if (newIndex === undefined) {
    if (newParentId) {
      const parent = findBlockById(doc.blocks, newParentId);
      targetIndex = parent?.children?.length ?? 0;
    } else {
      targetIndex = doc.blocks.length;
    }
  }

  const operation: DocumentOperation = {
    type: "MOVE_BLOCK",
    blockId,
    newParentId,
    newIndex: targetIndex,
  };

  const result = applyOperation(doc, operation);
  if (!result.ok) {
    return err(result.error);
  }

  $document.set(result.value);
  return ok(undefined);
}

/**
 * Update a block's props
 */
export function updateBlockPropsAction(
  blockId: string,
  props: Partial<BlockProps>
): Result<void, DocumentError> {
  const doc = $document.get();
  const operation: DocumentOperation = {
    type: "UPDATE_BLOCK_PROPS",
    blockId,
    props,
  };

  const result = applyOperation(doc, operation);
  if (!result.ok) {
    return err(result.error);
  }

  $document.set(result.value);
  return ok(undefined);
}

/**
 * Set children of a container block
 */
export function setBlockChildrenAction(
  blockId: string,
  children: Block[]
): Result<void, DocumentError> {
  const doc = $document.get();
  const operation: DocumentOperation = {
    type: "SET_BLOCK_CHILDREN",
    blockId,
    children,
  };

  const result = applyOperation(doc, operation);
  if (!result.ok) {
    return err(result.error);
  }

  $document.set(result.value);
  return ok(undefined);
}

/**
 * Update document metadata
 */
export function updateMetaAction(
  meta: Partial<DocumentMeta>
): Result<void, DocumentError> {
  const doc = $document.get();
  const operation: DocumentOperation = {
    type: "UPDATE_META",
    meta,
  };

  const result = applyOperation(doc, operation);
  if (!result.ok) {
    return err(result.error);
  }

  $document.set(result.value);
  return ok(undefined);
}

/**
 * Select a block
 */
export function selectBlock(blockId: string | null): void {
  $selectedBlockId.set(blockId);
  $selection.set({
    blockId,
  });
}

/**
 * Set selection with cursor position
 */
export function setSelection(selection: SelectionState): void {
  $selectedBlockId.set(selection.blockId);
  $selection.set(selection);
}

/**
 * Copy blocks to clipboard
 */
export function copyToClipboard(blockIds: string[]): Result<void, DocumentError> {
  const doc = $document.get();
  const blocks: Block[] = [];

  for (const id of blockIds) {
    const block = findBlockById(doc.blocks, id);
    if (!block) {
      return err(
        createDocumentError("BLOCK_NOT_FOUND", `Block not found: ${id}`)
      );
    }
    blocks.push(cloneBlock(block));
  }

  $clipboard.set({
    type: "blocks",
    blocks,
    sourceDocumentId: doc.id,
  });

  return ok(undefined);
}

/**
 * Copy text to clipboard
 */
export function copyTextToClipboard(text: string): void {
  const doc = $document.get();
  $clipboard.set({
    type: "text",
    text,
    sourceDocumentId: doc.id,
  });
}

/**
 * Paste from clipboard
 */
export function pasteFromClipboard(
  parentId?: string,
  index?: number
): Result<void, DocumentError> {
  const content = $clipboard.get();
  if (!content) {
    return err(
      createDocumentError("VALIDATION_ERROR", "Clipboard is empty")
    );
  }

  if (content.type !== "blocks" || !content.blocks) {
    return err(
      createDocumentError(
        "VALIDATION_ERROR",
        "Clipboard does not contain blocks"
      )
    );
  }

  // Clone blocks with new IDs for paste
  const doc = $document.get();
  let currentIndex = index ?? doc.blocks.length;

  for (const block of content.blocks) {
    const cloned = cloneBlock(block);
    const result = insertBlockAction(cloned, parentId, currentIndex);
    if (!result.ok) {
      return result;
    }
    currentIndex++;
  }

  return ok(undefined);
}

/**
 * Create a snapshot of the current document state
 */
export function createSnapshot(): DocumentSnapshot {
  return {
    document: $document.get(),
    selection: $selection.get(),
  };
}

/**
 * Restore document state from a snapshot
 */
export function restoreSnapshot(snapshot: DocumentSnapshot): void {
  $document.set(snapshot.document);
  $selection.set(snapshot.selection);
  $selectedBlockId.set(snapshot.selection.blockId);
}

/**
 * Validate the entire document structure
 */
export function validateDocument(doc: Document): Result<void, DocumentError> {
  const seenIds = new Set<string>();

  function validateBlocks(blocks: Block[]): Result<void, DocumentError> {
    for (const block of blocks) {
      // Check for duplicate IDs
      if (seenIds.has(block.id)) {
        return err(
          createDocumentError("DUPLICATE_ID", `Duplicate block ID: ${block.id}`)
        );
      }
      seenIds.add(block.id);

      // Validate children recursively
      if (block.children) {
        const result = validateBlocks(block.children);
        if (!result.ok) {
          return result;
        }
      }
    }
    return ok(undefined);
  }

  return validateBlocks(doc.blocks);
}
