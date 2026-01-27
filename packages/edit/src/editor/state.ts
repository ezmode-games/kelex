import type { Block } from "@rafters/ui/components/editor";
import { useHistory } from "@rafters/ui/hooks/use-history";
import { useCallback, useMemo, useState } from "react";
import { blockDefaults } from "./registry";

/**
 * Generate a unique ID for blocks (UUIDv4-like).
 */
function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Options for the page editor state hook.
 */
export interface UsePageEditorStateOptions {
  /** Initial blocks to populate the editor */
  initialBlocks?: Block[];
  /** Maximum undo history depth */
  historyLimit?: number;
}

/**
 * Return type for the page editor state hook.
 */
export interface UsePageEditorStateReturn {
  /** Current list of blocks */
  blocks: Block[];
  /** Set of selected block IDs */
  selectedIds: Set<string>;
  /** Currently focused block ID */
  focusedId: string | undefined;
  /** History state from useHistory (for EditorToolbar) */
  history: ReturnType<typeof useHistory<Block[]>>;

  // Selection actions
  setSelectedIds: (ids: Set<string>) => void;
  setFocusedId: (id: string | null) => void;

  // Block mutation actions
  addBlock: (type: string, index?: number) => void;
  removeBlock: (id: string) => void;
  duplicateBlock: (id: string) => void;
  moveBlock: (id: string, toIndex: number) => void;
  moveBlockUp: (id: string) => void;
  moveBlockDown: (id: string) => void;
  updateBlockProps: (id: string, props: Record<string, unknown>) => void;

  /** Get the currently selected block (first selected) */
  selectedBlock: Block | undefined;
}

/**
 * Hook that manages the complete page editor state:
 * - Block list with undo/redo history
 * - Selection and focus state
 * - Block mutation actions
 */
export function usePageEditorState(
  options: UsePageEditorStateOptions = {},
): UsePageEditorStateReturn {
  const { initialBlocks = [], historyLimit = 100 } = options;

  // Block state with undo/redo
  const history = useHistory<Block[]>({
    initialState: initialBlocks,
    limit: historyLimit,
  });

  const blocks = history.state.current;

  // Selection state (not part of undo history)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [focusedId, setFocusedIdRaw] = useState<string | undefined>(undefined);

  const setFocusedId = useCallback((id: string | null) => {
    setFocusedIdRaw(id ?? undefined);
  }, []);

  // Block index map for efficient lookups
  const blockIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      if (block) {
        map.set(block.id, i);
      }
    }
    return map;
  }, [blocks]);

  // Add a new block of the given type
  const addBlock = useCallback(
    (type: string, index?: number) => {
      const defaults = blockDefaults[type] ?? {};
      const newBlock: Block = {
        id: generateId(),
        type,
        props: structuredClone(defaults),
      };

      const newBlocks = [...blocks];
      const insertIndex = index ?? newBlocks.length;
      newBlocks.splice(insertIndex, 0, newBlock);
      history.push(newBlocks);

      // Select and focus the new block
      setSelectedIds(new Set([newBlock.id]));
      setFocusedIdRaw(newBlock.id);
    },
    [blocks, history],
  );

  // Remove a block by ID
  const removeBlock = useCallback(
    (id: string) => {
      const index = blockIndexMap.get(id);
      if (index === undefined) return;

      const newBlocks = blocks.filter((b) => b.id !== id);
      history.push(newBlocks);

      // Clear selection if removed block was selected
      setSelectedIds((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

      // Move focus to adjacent block
      if (focusedId === id) {
        const nextBlock = newBlocks[Math.min(index, newBlocks.length - 1)];
        setFocusedIdRaw(nextBlock?.id);
      }
    },
    [blocks, blockIndexMap, focusedId, history],
  );

  // Duplicate a block
  const duplicateBlock = useCallback(
    (id: string) => {
      const index = blockIndexMap.get(id);
      if (index === undefined) return;

      const original = blocks[index];
      if (!original) return;

      const duplicate: Block = {
        id: generateId(),
        type: original.type,
        props: structuredClone(original.props),
        children: original.children
          ? original.children.map((child) => ({
              ...child,
              id: generateId(),
              props: structuredClone(child.props),
            }))
          : undefined,
      };

      const newBlocks = [...blocks];
      newBlocks.splice(index + 1, 0, duplicate);
      history.push(newBlocks);

      // Select the duplicate
      setSelectedIds(new Set([duplicate.id]));
      setFocusedIdRaw(duplicate.id);
    },
    [blocks, blockIndexMap, history],
  );

  // Move a block to a specific index
  const moveBlock = useCallback(
    (id: string, toIndex: number) => {
      const fromIndex = blockIndexMap.get(id);
      if (fromIndex === undefined) return;
      if (fromIndex === toIndex) return;

      const newBlocks = [...blocks];
      const [removed] = newBlocks.splice(fromIndex, 1);
      if (!removed) return;
      newBlocks.splice(toIndex, 0, removed);
      history.push(newBlocks);
    },
    [blocks, blockIndexMap, history],
  );

  // Move a block up by one position
  const moveBlockUp = useCallback(
    (id: string) => {
      const index = blockIndexMap.get(id);
      if (index === undefined || index === 0) return;
      moveBlock(id, index - 1);
    },
    [blockIndexMap, moveBlock],
  );

  // Move a block down by one position
  const moveBlockDown = useCallback(
    (id: string) => {
      const index = blockIndexMap.get(id);
      if (index === undefined || index >= blocks.length - 1) return;
      moveBlock(id, index + 1);
    },
    [blocks.length, blockIndexMap, moveBlock],
  );

  // Update a block's props
  const updateBlockProps = useCallback(
    (id: string, props: Record<string, unknown>) => {
      const newBlocks = blocks.map((block) =>
        block.id === id
          ? { ...block, props: { ...block.props, ...props } }
          : block,
      );
      history.push(newBlocks);
    },
    [blocks, history],
  );

  // Get the first selected block
  const selectedBlock = useMemo(() => {
    if (selectedIds.size === 0) return undefined;
    const firstId = selectedIds.values().next().value;
    return blocks.find((b) => b.id === firstId);
  }, [blocks, selectedIds]);

  return {
    blocks,
    selectedIds,
    focusedId,
    history,
    setSelectedIds,
    setFocusedId,
    addBlock,
    removeBlock,
    duplicateBlock,
    moveBlock,
    moveBlockUp,
    moveBlockDown,
    updateBlockProps,
    selectedBlock,
  };
}
