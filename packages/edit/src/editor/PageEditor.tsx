import type { Block, BlockRenderContext } from "@rafters/ui/components/editor";
import {
  BlockCanvas,
  BlockSidebar,
  BlockWrapper,
  EditorToolbar,
  PropertyEditor,
} from "@rafters/ui/components/editor";
import * as React from "react";
import { useCallback } from "react";
import { blockSchemas, defaultRegistry } from "./registry";
import { renderBlockContent } from "./renderers";
import type { UsePageEditorStateOptions } from "./state";
import { usePageEditorState } from "./state";

/**
 * Props for the PageEditor component.
 */
export interface PageEditorProps {
  /** Initial blocks for the editor */
  initialBlocks?: Block[];
  /** Maximum undo history depth */
  historyLimit?: number;
  /** Called when blocks change (for persistence) */
  onBlocksChange?: (blocks: Block[]) => void;
  /** Additional CSS classes for the outer container */
  className?: string;
}

/**
 * PageEditor - Composed page editor wiring rafters components.
 *
 * Provides:
 * - Block canvas with selection and keyboard navigation
 * - Block sidebar with search and drag-to-insert
 * - Property editor for the selected block
 * - Undo/redo toolbar
 */
export function PageEditor({
  initialBlocks,
  historyLimit,
  onBlocksChange,
  className,
}: PageEditorProps): React.JSX.Element {
  const options: UsePageEditorStateOptions = {
    initialBlocks,
    historyLimit,
  };

  const {
    blocks,
    selectedIds,
    focusedId,
    history,
    selectedBlock,
    setSelectedIds,
    setFocusedId,
    addBlock,
    removeBlock,
    duplicateBlock,
    moveBlockUp,
    moveBlockDown,
    updateBlockProps,
  } = usePageEditorState(options);

  // Notify parent of block changes
  const prevBlocksRef = React.useRef(blocks);
  React.useEffect(() => {
    if (onBlocksChange && blocks !== prevBlocksRef.current) {
      prevBlocksRef.current = blocks;
      onBlocksChange(blocks);
    }
  }, [blocks, onBlocksChange]);

  // Render each block with BlockWrapper chrome
  const renderBlock = useCallback(
    (block: Block, context: BlockRenderContext) => {
      return (
        <BlockWrapper
          id={block.id}
          isSelected={context.isSelected}
          isFocused={context.isFocused}
          isFirst={context.isFirst}
          isLast={context.isLast}
          onSelect={(additive) => {
            if (additive) {
              const next = new Set(selectedIds);
              if (next.has(block.id)) {
                next.delete(block.id);
              } else {
                next.add(block.id);
              }
              setSelectedIds(next);
            } else {
              setSelectedIds(new Set([block.id]));
            }
          }}
          onFocus={() => setFocusedId(block.id)}
          onDelete={() => removeBlock(block.id)}
          onDuplicate={() => duplicateBlock(block.id)}
          onMoveUp={() => moveBlockUp(block.id)}
          onMoveDown={() => moveBlockDown(block.id)}
          draggable
        >
          {renderBlockContent(block, context)}
        </BlockWrapper>
      );
    },
    [
      selectedIds,
      setSelectedIds,
      setFocusedId,
      removeBlock,
      duplicateBlock,
      moveBlockUp,
      moveBlockDown,
    ],
  );

  // Handle insert from sidebar
  const handleInsert = useCallback(
    (blockType: string) => {
      // Insert after the focused block, or at end
      if (focusedId) {
        const focusedIndex = blocks.findIndex((b) => b.id === focusedId);
        addBlock(blockType, focusedIndex + 1);
      } else {
        addBlock(blockType);
      }
    },
    [focusedId, blocks, addBlock],
  );

  // Get the schema for the selected block's PropertyEditor
  const selectedSchema = selectedBlock
    ? blockSchemas[selectedBlock.type]
    : undefined;

  return (
    <div className={`flex h-full ${className ?? ""}`}>
      {/* Sidebar */}
      <BlockSidebar
        registry={defaultRegistry}
        onInsert={handleInsert}
        className="flex-shrink-0"
      />

      {/* Main editor area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="border-b p-2">
          <EditorToolbar history={history} />
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-y-auto p-8">
          <BlockCanvas
            blocks={blocks}
            selectedIds={selectedIds}
            focusedId={focusedId}
            onSelectionChange={setSelectedIds}
            onFocusChange={(id) => setFocusedId(id)}
            renderBlock={renderBlock}
            emptyState={
              <div className="flex flex-col items-center justify-center h-full min-h-52 text-muted-foreground gap-2">
                <p>No blocks yet</p>
                <p className="text-sm">
                  Add blocks from the sidebar or press /
                </p>
              </div>
            }
          />
        </div>
      </div>

      {/* Property editor panel */}
      {selectedBlock && selectedSchema && (
        <div className="w-72 flex-shrink-0 border-l bg-background overflow-y-auto p-4">
          <PropertyEditor
            schema={selectedSchema}
            values={selectedBlock.props}
            onChange={(values) => updateBlockProps(selectedBlock.id, values)}
            blockType={selectedBlock.type}
          />
        </div>
      )}
    </div>
  );
}

PageEditor.displayName = "PageEditor";
