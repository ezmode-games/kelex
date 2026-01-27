/**
 * Ambient type declarations for @rafters/ui.
 *
 * These prevent TypeScript from following the link: dependency
 * into rafters source and typechecking the entire project.
 * Types are manually declared to match the rafters API surface
 * that packages/edit consumes.
 */

declare module "@rafters/ui/components/editor" {
  import type * as React from "react";
  import type { ZodObject, ZodRawShape } from "zod";

  // Block model
  export interface Block {
    id: string;
    type: string;
    props: Record<string, unknown>;
    children?: Block[];
  }

  export interface BlockRenderContext {
    index: number;
    total: number;
    isFirst: boolean;
    isLast: boolean;
    isSelected: boolean;
    isFocused: boolean;
  }

  // BlockCanvas
  export interface BlockCanvasProps {
    blocks: Block[];
    selectedIds: Set<string>;
    focusedId?: string;
    dropTargetIndex?: number | null;
    onSelectionChange: (ids: Set<string>) => void;
    onFocusChange?: (id: string | null) => void;
    onBlocksChange?: (blocks: Block[]) => void;
    onBlockAdd?: (block: Block, index: number) => void;
    onBlockRemove?: (id: string) => void;
    onBlockMove?: (id: string, toIndex: number) => void;
    renderBlock: (block: Block, context: BlockRenderContext) => React.ReactNode;
    onSlashCommand?: (position: { x: number; y: number }) => void;
    onCanvasClick?: (event: React.MouseEvent) => void;
    className?: string;
    emptyState?: React.ReactNode;
  }
  export function BlockCanvas(props: BlockCanvasProps): React.JSX.Element;

  // BlockWrapper
  export interface BlockWrapperProps {
    id: string;
    isSelected: boolean;
    isFocused: boolean;
    isFirst: boolean;
    isLast: boolean;
    onSelect: (additive?: boolean) => void;
    onFocus: () => void;
    onDelete: () => void;
    onDuplicate: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onDragStart?: () => void;
    onDragEnd?: () => void;
    draggable?: boolean;
    children: React.ReactNode;
    className?: string;
  }
  export function BlockWrapper(props: BlockWrapperProps): React.JSX.Element;

  // BlockSidebar
  export interface BlockDefinition {
    type: string;
    label: string;
    description?: string;
    icon?: string;
    category: string;
    keywords?: string[];
  }

  export interface BlockRegistry {
    blocks: BlockDefinition[];
    categories: { id: string; label: string; order?: number }[];
  }

  export interface BlockSidebarProps {
    registry: BlockRegistry;
    onInsert: (blockType: string, index?: number) => void;
    recentlyUsed?: string[];
    className?: string;
    collapsed?: boolean;
    onCollapse?: (collapsed: boolean) => void;
  }
  export function BlockSidebar(props: BlockSidebarProps): React.JSX.Element;

  // PropertyEditor
  export interface PropertyEditorProps<T extends ZodRawShape = ZodRawShape> {
    schema: ZodObject<T>;
    values: Record<string, unknown>;
    onChange: (values: Record<string, unknown>) => void;
    blockType?: string;
    title?: string;
    className?: string;
  }
  export function PropertyEditor<T extends ZodRawShape>(
    props: PropertyEditorProps<T>,
  ): React.JSX.Element;

  // EditorToolbar
  export interface EditorToolbarProps<T = unknown> {
    history: UseHistoryReturn<T>;
    onBold?: () => void;
    onItalic?: () => void;
    onUnderline?: () => void;
    onStrikethrough?: () => void;
    onLink?: () => void;
    onCode?: () => void;
    className?: string;
  }
  export function EditorToolbar<T = unknown>(
    props: EditorToolbarProps<T>,
  ): React.JSX.Element;

  // Re-export for EditorToolbar dependency
  import type { UseHistoryReturn } from "@rafters/ui/hooks/use-history";
}

declare module "@rafters/ui/hooks/use-history" {
  export interface HistoryState<T> {
    current: T;
    canUndo: boolean;
    canRedo: boolean;
  }

  export interface UseHistoryOptions<T> {
    initialState: T;
    limit?: number;
    isEqual?: (a: T, b: T) => boolean;
  }

  export interface UseHistoryReturn<T> {
    state: HistoryState<T>;
    push: (state: T) => void;
    undo: () => T | null;
    redo: () => T | null;
    batch: (fn: () => void) => void;
    clear: () => void;
  }

  export function useHistory<T>(
    options: UseHistoryOptions<T>,
  ): UseHistoryReturn<T>;
}

declare module "@rafters/ui/hooks/use-drag-drop" {
  export interface UseDraggableOptions {
    data: unknown;
    onDragStart?: () => void;
    onDragEnd?: () => void;
  }

  export interface UseDraggableReturn {
    ref: React.RefCallback<HTMLElement>;
    isDragging: boolean;
  }

  export function useDraggable(
    options: UseDraggableOptions,
  ): UseDraggableReturn;
}
