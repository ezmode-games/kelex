import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { uuidv7 } from "uuidv7";
import {
  $blocks,
  $blockCount,
  $clipboard,
  $document,
  $documentId,
  $meta,
  $selectedBlock,
  $selectedBlockId,
  $selection,
  applyOperation,
  cloneBlock,
  copyTextToClipboard,
  copyToClipboard,
  createEmptyDocument,
  createInitialMeta,
  createInitialSelection,
  createSnapshot,
  deleteBlockAction,
  findBlockById,
  findBlockIndex,
  findParentBlock,
  getBlockPath,
  initializeDocument,
  insertBlockAction,
  moveBlockAction,
  pasteFromClipboard,
  restoreSnapshot,
  selectBlock,
  setBlockChildrenAction,
  setSelection,
  updateBlockPropsAction,
  updateMetaAction,
  validateDocument,
} from "../../src/model/document";
import type { Block, Document, DocumentOperation } from "../../src/model/types";

// Helper to create a test block
function createTestBlock(
  type: string,
  props: Record<string, unknown> = {},
  children?: Block[]
): Block {
  const block: Block = {
    id: uuidv7(),
    type,
    props,
  };
  if (children !== undefined) {
    block.children = children;
  }
  return block;
}

describe("Document Model", () => {
  beforeEach(() => {
    initializeDocument();
  });

  afterEach(() => {
    initializeDocument();
  });

  describe("createEmptyDocument", () => {
    it("creates a document with UUIDv7 id", () => {
      const doc = createEmptyDocument();
      expect(doc.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it("creates a document with empty blocks array", () => {
      const doc = createEmptyDocument();
      expect(doc.blocks).toEqual([]);
    });

    it("creates a document with initial metadata", () => {
      const doc = createEmptyDocument();
      expect(doc.meta.version).toBe(0);
      expect(doc.meta.createdAt).toBeInstanceOf(Date);
      expect(doc.meta.updatedAt).toBeInstanceOf(Date);
    });

    it("creates unique documents each time", () => {
      const doc1 = createEmptyDocument();
      const doc2 = createEmptyDocument();
      expect(doc1.id).not.toBe(doc2.id);
    });
  });

  describe("createInitialMeta", () => {
    it("creates metadata with version 0", () => {
      const meta = createInitialMeta();
      expect(meta.version).toBe(0);
    });

    it("creates metadata with current timestamp", () => {
      const before = new Date();
      const meta = createInitialMeta();
      const after = new Date();

      expect(meta.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(meta.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it("sets createdAt and updatedAt to same value", () => {
      const meta = createInitialMeta();
      expect(meta.createdAt.getTime()).toBe(meta.updatedAt.getTime());
    });
  });

  describe("createInitialSelection", () => {
    it("creates selection with null blockId", () => {
      const selection = createInitialSelection();
      expect(selection.blockId).toBeNull();
    });
  });

  describe("findBlockById", () => {
    it("finds block at root level", () => {
      const block = createTestBlock("paragraph", { content: "Hello" });
      const blocks = [block];
      const found = findBlockById(blocks, block.id);
      expect(found).toBe(block);
    });

    it("finds nested block", () => {
      const child = createTestBlock("paragraph", { content: "Child" });
      const parent = createTestBlock("section", {}, [child]);
      const blocks = [parent];
      const found = findBlockById(blocks, child.id);
      expect(found).toBe(child);
    });

    it("finds deeply nested block", () => {
      const deepChild = createTestBlock("paragraph", { content: "Deep" });
      const innerParent = createTestBlock("section", {}, [deepChild]);
      const outerParent = createTestBlock("section", {}, [innerParent]);
      const blocks = [outerParent];
      const found = findBlockById(blocks, deepChild.id);
      expect(found).toBe(deepChild);
    });

    it("returns null for non-existent id", () => {
      const block = createTestBlock("paragraph");
      const blocks = [block];
      const found = findBlockById(blocks, "nonexistent");
      expect(found).toBeNull();
    });

    it("returns null for empty blocks array", () => {
      const found = findBlockById([], "any-id");
      expect(found).toBeNull();
    });
  });

  describe("findParentBlock", () => {
    it("returns null for root-level block", () => {
      const block = createTestBlock("paragraph");
      const blocks = [block];
      const parent = findParentBlock(blocks, block.id);
      expect(parent).toBeNull();
    });

    it("finds parent of nested block", () => {
      const child = createTestBlock("paragraph");
      const parentBlock = createTestBlock("section", {}, [child]);
      const blocks = [parentBlock];
      const parent = findParentBlock(blocks, child.id);
      expect(parent).toBe(parentBlock);
    });

    it("finds parent of deeply nested block", () => {
      const deepChild = createTestBlock("paragraph");
      const innerParent = createTestBlock("section", {}, [deepChild]);
      const outerParent = createTestBlock("section", {}, [innerParent]);
      const blocks = [outerParent];
      const parent = findParentBlock(blocks, deepChild.id);
      expect(parent).toBe(innerParent);
    });

    it("returns null for non-existent id", () => {
      const block = createTestBlock("paragraph");
      const blocks = [block];
      const parent = findParentBlock(blocks, "nonexistent");
      expect(parent).toBeNull();
    });
  });

  describe("findBlockIndex", () => {
    it("finds index of block in array", () => {
      const block1 = createTestBlock("paragraph");
      const block2 = createTestBlock("paragraph");
      const block3 = createTestBlock("paragraph");
      const blocks = [block1, block2, block3];

      expect(findBlockIndex(blocks, block1.id)).toBe(0);
      expect(findBlockIndex(blocks, block2.id)).toBe(1);
      expect(findBlockIndex(blocks, block3.id)).toBe(2);
    });

    it("returns -1 for non-existent id", () => {
      const block = createTestBlock("paragraph");
      const blocks = [block];
      expect(findBlockIndex(blocks, "nonexistent")).toBe(-1);
    });
  });

  describe("getBlockPath", () => {
    it("returns empty array for root-level block", () => {
      const block = createTestBlock("paragraph");
      const blocks = [block];
      const path = getBlockPath(blocks, block.id);
      expect(path).toEqual([]);
    });

    it("returns path for nested block", () => {
      const child = createTestBlock("paragraph");
      const parent = createTestBlock("section", {}, [child]);
      const blocks = [parent];
      const path = getBlockPath(blocks, child.id);
      expect(path).toEqual([parent.id]);
    });

    it("returns full path for deeply nested block", () => {
      const deepChild = createTestBlock("paragraph");
      const innerParent = createTestBlock("section", {}, [deepChild]);
      const outerParent = createTestBlock("section", {}, [innerParent]);
      const blocks = [outerParent];
      const path = getBlockPath(blocks, deepChild.id);
      expect(path).toEqual([outerParent.id, innerParent.id]);
    });

    it("returns empty array for non-existent id", () => {
      const block = createTestBlock("paragraph");
      const blocks = [block];
      const path = getBlockPath(blocks, "nonexistent");
      expect(path).toEqual([]);
    });
  });

  describe("cloneBlock", () => {
    it("creates new block with new id", () => {
      const original = createTestBlock("paragraph", { content: "Hello" });
      const cloned = cloneBlock(original);

      expect(cloned.id).not.toBe(original.id);
      expect(cloned.type).toBe(original.type);
      expect(cloned.props).toEqual(original.props);
    });

    it("clones children with new ids", () => {
      const child = createTestBlock("paragraph", { content: "Child" });
      const parent = createTestBlock("section", {}, [child]);
      const cloned = cloneBlock(parent);

      expect(cloned.children).toHaveLength(1);
      expect(cloned.children?.[0]?.id).not.toBe(child.id);
      expect(cloned.children?.[0]?.props).toEqual(child.props);
    });

    it("does not mutate original block", () => {
      const original = createTestBlock("paragraph", { content: "Hello" });
      const originalId = original.id;
      cloneBlock(original);

      expect(original.id).toBe(originalId);
    });
  });

  describe("applyOperation", () => {
    let doc: Document;

    beforeEach(() => {
      doc = createEmptyDocument();
    });

    describe("INSERT_BLOCK", () => {
      it("inserts block at root level", () => {
        const block = createTestBlock("paragraph");
        const op: DocumentOperation = {
          type: "INSERT_BLOCK",
          block,
          index: 0,
        };

        const result = applyOperation(doc, op);
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.blocks).toHaveLength(1);
          expect(result.value.blocks[0]).toBe(block);
        }
      });

      it("inserts block at specific index", () => {
        const block1 = createTestBlock("paragraph", { content: "First" });
        const block2 = createTestBlock("paragraph", { content: "Second" });
        doc.blocks = [block1];

        const op: DocumentOperation = {
          type: "INSERT_BLOCK",
          block: block2,
          index: 0,
        };

        const result = applyOperation(doc, op);
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.blocks[0]).toBe(block2);
          expect(result.value.blocks[1]).toBe(block1);
        }
      });

      it("inserts block into parent", () => {
        const parent = createTestBlock("section", {}, []);
        doc.blocks = [parent];

        const child = createTestBlock("paragraph");
        const op: DocumentOperation = {
          type: "INSERT_BLOCK",
          block: child,
          parentId: parent.id,
          index: 0,
        };

        const result = applyOperation(doc, op);
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.blocks[0]?.children).toHaveLength(1);
          expect(result.value.blocks[0]?.children?.[0]).toBe(child);
        }
      });

      it("increments version", () => {
        const block = createTestBlock("paragraph");
        const op: DocumentOperation = {
          type: "INSERT_BLOCK",
          block,
          index: 0,
        };

        const result = applyOperation(doc, op);
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.meta.version).toBe(1);
        }
      });
    });

    describe("DELETE_BLOCK", () => {
      it("deletes block from root level", () => {
        const block = createTestBlock("paragraph");
        doc.blocks = [block];

        const op: DocumentOperation = {
          type: "DELETE_BLOCK",
          blockId: block.id,
        };

        const result = applyOperation(doc, op);
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.blocks).toHaveLength(0);
        }
      });

      it("deletes nested block", () => {
        const child = createTestBlock("paragraph");
        const parent = createTestBlock("section", {}, [child]);
        doc.blocks = [parent];

        const op: DocumentOperation = {
          type: "DELETE_BLOCK",
          blockId: child.id,
        };

        const result = applyOperation(doc, op);
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.blocks[0]?.children).toHaveLength(0);
        }
      });

      it("returns error for non-existent block", () => {
        const op: DocumentOperation = {
          type: "DELETE_BLOCK",
          blockId: "nonexistent",
        };

        const result = applyOperation(doc, op);
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe("BLOCK_NOT_FOUND");
        }
      });
    });

    describe("MOVE_BLOCK", () => {
      it("moves block within root level", () => {
        const block1 = createTestBlock("paragraph", { content: "First" });
        const block2 = createTestBlock("paragraph", { content: "Second" });
        doc.blocks = [block1, block2];

        const op: DocumentOperation = {
          type: "MOVE_BLOCK",
          blockId: block2.id,
          newIndex: 0,
        };

        const result = applyOperation(doc, op);
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.blocks[0]?.props.content).toBe("Second");
          expect(result.value.blocks[1]?.props.content).toBe("First");
        }
      });

      it("moves block into parent", () => {
        const block = createTestBlock("paragraph");
        const parent = createTestBlock("section", {}, []);
        doc.blocks = [block, parent];

        const op: DocumentOperation = {
          type: "MOVE_BLOCK",
          blockId: block.id,
          newParentId: parent.id,
          newIndex: 0,
        };

        const result = applyOperation(doc, op);
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.blocks).toHaveLength(1);
          expect(result.value.blocks[0]?.children).toHaveLength(1);
        }
      });

      it("returns error for non-existent block", () => {
        const op: DocumentOperation = {
          type: "MOVE_BLOCK",
          blockId: "nonexistent",
          newIndex: 0,
        };

        const result = applyOperation(doc, op);
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe("BLOCK_NOT_FOUND");
        }
      });
    });

    describe("UPDATE_BLOCK_PROPS", () => {
      it("updates block props", () => {
        const block = createTestBlock("paragraph", { content: "Original" });
        doc.blocks = [block];

        const op: DocumentOperation = {
          type: "UPDATE_BLOCK_PROPS",
          blockId: block.id,
          props: { content: "Updated" },
        };

        const result = applyOperation(doc, op);
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.blocks[0]?.props.content).toBe("Updated");
        }
      });

      it("merges props with existing", () => {
        const block = createTestBlock("heading", { level: 1, content: "Title" });
        doc.blocks = [block];

        const op: DocumentOperation = {
          type: "UPDATE_BLOCK_PROPS",
          blockId: block.id,
          props: { content: "New Title" },
        };

        const result = applyOperation(doc, op);
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.blocks[0]?.props.level).toBe(1);
          expect(result.value.blocks[0]?.props.content).toBe("New Title");
        }
      });

      it("returns error for non-existent block", () => {
        const op: DocumentOperation = {
          type: "UPDATE_BLOCK_PROPS",
          blockId: "nonexistent",
          props: {},
        };

        const result = applyOperation(doc, op);
        expect(result.ok).toBe(false);
      });
    });

    describe("SET_BLOCK_CHILDREN", () => {
      it("sets children of container block", () => {
        const parent = createTestBlock("section", {}, []);
        doc.blocks = [parent];

        const child1 = createTestBlock("paragraph");
        const child2 = createTestBlock("paragraph");

        const op: DocumentOperation = {
          type: "SET_BLOCK_CHILDREN",
          blockId: parent.id,
          children: [child1, child2],
        };

        const result = applyOperation(doc, op);
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.blocks[0]?.children).toHaveLength(2);
        }
      });

      it("returns error for non-existent block", () => {
        const op: DocumentOperation = {
          type: "SET_BLOCK_CHILDREN",
          blockId: "nonexistent",
          children: [],
        };

        const result = applyOperation(doc, op);
        expect(result.ok).toBe(false);
      });
    });

    describe("UPDATE_META", () => {
      it("updates metadata", () => {
        const op: DocumentOperation = {
          type: "UPDATE_META",
          meta: { title: "New Title" },
        };

        const result = applyOperation(doc, op);
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.meta.title).toBe("New Title");
        }
      });

      it("preserves existing metadata", () => {
        doc.meta.description = "Existing description";

        const op: DocumentOperation = {
          type: "UPDATE_META",
          meta: { title: "New Title" },
        };

        const result = applyOperation(doc, op);
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.meta.description).toBe("Existing description");
        }
      });
    });
  });

  describe("Store actions", () => {
    describe("insertBlockAction", () => {
      it("inserts block into document", () => {
        const block = createTestBlock("paragraph");
        const result = insertBlockAction(block);

        expect(result.ok).toBe(true);
        expect($document.get().blocks).toHaveLength(1);
      });

      it("inserts at end by default", () => {
        const block1 = createTestBlock("paragraph", { content: "First" });
        const block2 = createTestBlock("paragraph", { content: "Second" });

        insertBlockAction(block1);
        insertBlockAction(block2);

        const blocks = $document.get().blocks;
        expect(blocks[0]?.props.content).toBe("First");
        expect(blocks[1]?.props.content).toBe("Second");
      });

      it("inserts at specific index", () => {
        const block1 = createTestBlock("paragraph", { content: "First" });
        const block2 = createTestBlock("paragraph", { content: "Second" });

        insertBlockAction(block1);
        insertBlockAction(block2, undefined, 0);

        const blocks = $document.get().blocks;
        expect(blocks[0]?.props.content).toBe("Second");
      });
    });

    describe("deleteBlockAction", () => {
      it("deletes block from document", () => {
        const block = createTestBlock("paragraph");
        insertBlockAction(block);

        const result = deleteBlockAction(block.id);
        expect(result.ok).toBe(true);
        expect($document.get().blocks).toHaveLength(0);
      });

      it("clears selection if deleted block was selected", () => {
        const block = createTestBlock("paragraph");
        insertBlockAction(block);
        selectBlock(block.id);

        deleteBlockAction(block.id);
        expect($selectedBlockId.get()).toBeNull();
      });
    });

    describe("moveBlockAction", () => {
      it("moves block to new position", () => {
        const block1 = createTestBlock("paragraph", { content: "First" });
        const block2 = createTestBlock("paragraph", { content: "Second" });
        insertBlockAction(block1);
        insertBlockAction(block2);

        const result = moveBlockAction(block2.id, undefined, 0);
        expect(result.ok).toBe(true);

        const blocks = $document.get().blocks;
        expect(blocks[0]?.props.content).toBe("Second");
      });
    });

    describe("updateBlockPropsAction", () => {
      it("updates block props", () => {
        const block = createTestBlock("paragraph", { content: "Original" });
        insertBlockAction(block);

        const result = updateBlockPropsAction(block.id, { content: "Updated" });
        expect(result.ok).toBe(true);
        expect($document.get().blocks[0]?.props.content).toBe("Updated");
      });
    });

    describe("setBlockChildrenAction", () => {
      it("sets children of container block", () => {
        const parent = createTestBlock("section", {}, []);
        insertBlockAction(parent);

        const child = createTestBlock("paragraph");
        const result = setBlockChildrenAction(parent.id, [child]);

        expect(result.ok).toBe(true);
        expect($document.get().blocks[0]?.children).toHaveLength(1);
      });
    });

    describe("updateMetaAction", () => {
      it("updates document metadata", () => {
        const result = updateMetaAction({ title: "My Document" });
        expect(result.ok).toBe(true);
        expect($document.get().meta.title).toBe("My Document");
      });
    });

    describe("selectBlock", () => {
      it("sets selected block id", () => {
        const block = createTestBlock("paragraph");
        insertBlockAction(block);

        selectBlock(block.id);
        expect($selectedBlockId.get()).toBe(block.id);
      });

      it("clears selection with null", () => {
        const block = createTestBlock("paragraph");
        insertBlockAction(block);
        selectBlock(block.id);

        selectBlock(null);
        expect($selectedBlockId.get()).toBeNull();
      });
    });

    describe("setSelection", () => {
      it("sets full selection state", () => {
        const block = createTestBlock("paragraph");
        insertBlockAction(block);

        setSelection({ blockId: block.id, anchor: 0, focus: 5 });

        const selection = $selection.get();
        expect(selection.blockId).toBe(block.id);
        expect(selection.anchor).toBe(0);
        expect(selection.focus).toBe(5);
      });
    });
  });

  describe("Clipboard operations", () => {
    describe("copyToClipboard", () => {
      it("copies blocks to clipboard", () => {
        const block = createTestBlock("paragraph", { content: "Hello" });
        insertBlockAction(block);

        const result = copyToClipboard([block.id]);
        expect(result.ok).toBe(true);

        const clipboard = $clipboard.get();
        expect(clipboard?.type).toBe("blocks");
        expect(clipboard?.blocks).toHaveLength(1);
      });

      it("clones blocks with new ids", () => {
        const block = createTestBlock("paragraph");
        insertBlockAction(block);

        copyToClipboard([block.id]);

        const clipboard = $clipboard.get();
        expect(clipboard?.blocks?.[0]?.id).not.toBe(block.id);
      });

      it("returns error for non-existent block", () => {
        const result = copyToClipboard(["nonexistent"]);
        expect(result.ok).toBe(false);
      });
    });

    describe("copyTextToClipboard", () => {
      it("copies text to clipboard", () => {
        copyTextToClipboard("Hello world");

        const clipboard = $clipboard.get();
        expect(clipboard?.type).toBe("text");
        expect(clipboard?.text).toBe("Hello world");
      });
    });

    describe("pasteFromClipboard", () => {
      it("pastes blocks from clipboard", () => {
        const block = createTestBlock("paragraph", { content: "Copied" });
        insertBlockAction(block);
        copyToClipboard([block.id]);

        // Clear document
        deleteBlockAction(block.id);
        expect($document.get().blocks).toHaveLength(0);

        const result = pasteFromClipboard();
        expect(result.ok).toBe(true);
        expect($document.get().blocks).toHaveLength(1);
      });

      it("returns error when clipboard is empty", () => {
        $clipboard.set(null);
        const result = pasteFromClipboard();
        expect(result.ok).toBe(false);
      });

      it("returns error when clipboard contains text", () => {
        copyTextToClipboard("Hello");
        const result = pasteFromClipboard();
        expect(result.ok).toBe(false);
      });
    });
  });

  describe("Snapshot operations", () => {
    describe("createSnapshot", () => {
      it("captures current document and selection state", () => {
        const block = createTestBlock("paragraph");
        insertBlockAction(block);
        selectBlock(block.id);

        const snapshot = createSnapshot();
        expect(snapshot.document.blocks).toHaveLength(1);
        expect(snapshot.selection.blockId).toBe(block.id);
      });
    });

    describe("restoreSnapshot", () => {
      it("restores document and selection from snapshot", () => {
        const block = createTestBlock("paragraph");
        insertBlockAction(block);
        selectBlock(block.id);
        const snapshot = createSnapshot();

        // Modify document
        deleteBlockAction(block.id);
        selectBlock(null);

        // Restore
        restoreSnapshot(snapshot);
        expect($document.get().blocks).toHaveLength(1);
        expect($selectedBlockId.get()).toBe(block.id);
      });
    });
  });

  describe("validateDocument", () => {
    it("accepts valid document", () => {
      const block = createTestBlock("paragraph");
      const doc = createEmptyDocument();
      doc.blocks = [block];

      const result = validateDocument(doc);
      expect(result.ok).toBe(true);
    });

    it("rejects document with duplicate block ids", () => {
      const id = uuidv7();
      const block1: Block = { id, type: "paragraph", props: {} };
      const block2: Block = { id, type: "paragraph", props: {} };

      const doc = createEmptyDocument();
      doc.blocks = [block1, block2];

      const result = validateDocument(doc);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("DUPLICATE_ID");
      }
    });

    it("validates nested blocks for duplicates", () => {
      const id = uuidv7();
      const child: Block = { id, type: "paragraph", props: {} };
      const parent: Block = { id, type: "section", props: {}, children: [child] };

      const doc = createEmptyDocument();
      doc.blocks = [parent];

      const result = validateDocument(doc);
      expect(result.ok).toBe(false);
    });
  });

  describe("Computed atoms", () => {
    it("$documentId reflects document id", () => {
      const doc = createEmptyDocument();
      initializeDocument(doc);
      expect($documentId.get()).toBe(doc.id);
    });

    it("$blocks reflects document blocks", () => {
      const block = createTestBlock("paragraph");
      insertBlockAction(block);
      expect($blocks.get()).toHaveLength(1);
    });

    it("$meta reflects document metadata", () => {
      updateMetaAction({ title: "Test" });
      expect($meta.get().title).toBe("Test");
    });

    it("$blockCount counts all blocks including nested", () => {
      const child1 = createTestBlock("paragraph");
      const child2 = createTestBlock("paragraph");
      const parent = createTestBlock("section", {}, [child1, child2]);
      const root = createTestBlock("paragraph");

      insertBlockAction(parent);
      insertBlockAction(root);

      expect($blockCount.get()).toBe(4); // parent + 2 children + root
    });

    it("$selectedBlock returns selected block object", () => {
      const block = createTestBlock("paragraph", { content: "Selected" });
      insertBlockAction(block);
      selectBlock(block.id);

      const selected = $selectedBlock.get();
      expect(selected?.props.content).toBe("Selected");
    });

    it("$selectedBlock returns null when nothing selected", () => {
      expect($selectedBlock.get()).toBeNull();
    });
  });
});
