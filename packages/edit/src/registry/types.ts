/**
 * Block Registry Types
 *
 * Extended type definitions for the block registry with React component support.
 * Implements PZ-201: Block Registry System
 */

import type { ComponentType } from "react";
import type { z } from "zod/v4";
import type {
  BlockCategory as BaseBlockCategory,
  BlockDefinition as BaseBlockDefinition,
  BlockProps,
  BlockTypeId,
  DocumentError,
  Result,
} from "../model/types";

/**
 * Extended block categories including platform and gaming
 */
export type BlockCategory =
  | BaseBlockCategory
  | "platform"
  | "gaming";

/**
 * All available block categories with metadata for sidebar display
 */
export interface BlockCategoryMeta {
  id: BlockCategory;
  name: string;
  description: string;
  icon: string;
  order: number;
}

/**
 * Block category metadata for sidebar grouping
 */
export const BLOCK_CATEGORIES: readonly BlockCategoryMeta[] = [
  { id: "typography", name: "Typography", description: "Text and content blocks", icon: "type", order: 0 },
  { id: "media", name: "Media", description: "Images, videos, and embeds", icon: "image", order: 1 },
  { id: "layout", name: "Layout", description: "Structural and container blocks", icon: "layout", order: 2 },
  { id: "form", name: "Forms", description: "Form and input blocks", icon: "file-text", order: 3 },
  { id: "embed", name: "Embeds", description: "External content embeds", icon: "globe", order: 4 },
  { id: "platform", name: "Platform", description: "Platform-specific blocks", icon: "puzzle", order: 5 },
  { id: "gaming", name: "Gaming", description: "Game-related blocks", icon: "gamepad-2", order: 6 },
  { id: "other", name: "Other", description: "Miscellaneous blocks", icon: "more-horizontal", order: 7 },
] as const;

/**
 * Lazy loader function type for dynamic block loading
 */
export type BlockLoader<T = unknown> = () => Promise<{
  component: ComponentType<BlockComponentProps<T>>;
  propsSchema?: z.ZodType<T>;
}>;

/**
 * Props passed to block components
 */
export interface BlockComponentProps<T = unknown> {
  /** Block ID */
  id: string;
  /** Block-specific props */
  props: BlockProps<T>;
  /** Whether the block is selected */
  isSelected?: boolean;
  /** Whether the block is in edit mode */
  isEditing?: boolean;
  /** Callback to update block props */
  onPropsChange?: (props: Partial<T>) => void;
  /** Children for container blocks */
  children?: React.ReactNode;
}

/**
 * Base block definition for storage in heterogeneous registry.
 * Uses any for component type to allow storing different block types together.
 */
export interface BaseComponentBlockDefinition {
  /** Unique type identifier */
  id: BlockTypeId;
  /** Human-readable display name */
  name: string;
  /** Icon identifier (e.g., Lucide icon name) */
  icon: string;
  /** Category for grouping in sidebar (extended) */
  category: BlockCategory;
  /** Description shown in block palette */
  description?: string;
  /** Whether this block can contain children */
  isContainer: boolean;
  /** Allowed child block types (if container, empty = all allowed) */
  allowedChildren?: BlockTypeId[];
  /** Zod schema for validating block props */
  // biome-ignore lint/suspicious/noExplicitAny: Required for heterogeneous registry storage
  propsSchema: z.ZodType<any>;
  /** Default props when creating new block */
  // biome-ignore lint/suspicious/noExplicitAny: Required for heterogeneous registry storage
  defaultProps: any;
  /** Keywords for search in block palette */
  keywords?: string[];
  /** React component for rendering the block */
  // biome-ignore lint/suspicious/noExplicitAny: Required for heterogeneous registry storage
  component?: ComponentType<any>;
  /** Lazy loader for dynamic loading (mutually exclusive with component) */
  // biome-ignore lint/suspicious/noExplicitAny: Required for heterogeneous registry storage
  loader?: () => Promise<{ component: ComponentType<any>; propsSchema?: z.ZodType<any> }>;
  /** Guild IDs that can use this block (empty = all guilds) */
  guildRestrictions?: string[];
  /** Whether this is a premium/paid block */
  isPremium?: boolean;
  /** Version info for the block */
  version?: string;
}

/**
 * Extended block definition with React component support.
 * Use this typed version when defining custom blocks for full type safety.
 */
export interface BlockDefinition<T = unknown> extends Omit<BaseBlockDefinition<T>, "category"> {
  /** Category for grouping in sidebar (extended) */
  category: BlockCategory;
  /** React component for rendering the block */
  component?: ComponentType<BlockComponentProps<T>>;
  /** Lazy loader for dynamic loading (mutually exclusive with component) */
  loader?: BlockLoader<T>;
  /** Guild IDs that can use this block (empty = all guilds) */
  guildRestrictions?: string[];
  /** Whether this is a premium/paid block */
  isPremium?: boolean;
  /** Version info for the block */
  version?: string;
}

/**
 * Registration result for tracking loaded state
 */
export interface BlockRegistrationResult {
  typeId: BlockTypeId;
  isLazy: boolean;
  loadedAt?: Date;
}

/**
 * Extended block registry interface with component support.
 * Uses BaseComponentBlockDefinition for return types to handle heterogeneous storage.
 */
export interface ComponentBlockRegistry {
  /** Register a new block type with component */
  register<T = unknown>(definition: BlockDefinition<T>): Result<BlockRegistrationResult, DocumentError>;

  /** Get a block definition by ID */
  get(id: BlockTypeId): BaseComponentBlockDefinition | undefined;

  /** Get all registered block types */
  getAll(): BaseComponentBlockDefinition[];

  /** Get block types by category */
  getByCategory(category: BlockCategory): BaseComponentBlockDefinition[];

  /** Get all available categories with their blocks */
  getAllCategories(): Map<BlockCategory, BaseComponentBlockDefinition[]>;

  /** Get category metadata */
  getCategoryMeta(category: BlockCategory): BlockCategoryMeta | undefined;

  /** Check if a block type is registered */
  has(id: BlockTypeId): boolean;

  /** Unregister a block type */
  unregister(id: BlockTypeId): boolean;

  /** Clear all registrations */
  clear(): void;

  /** Validate block props against its schema */
  validateProps(typeId: BlockTypeId, props: unknown): Result<BlockProps, DocumentError>;

  /** Check if a block can contain a child of given type */
  canContain(parentTypeId: BlockTypeId, childTypeId: BlockTypeId): Result<boolean, DocumentError>;

  /** Load a lazy block's component */
  loadBlock(typeId: BlockTypeId): Promise<Result<BaseComponentBlockDefinition, DocumentError>>;

  /** Check if a block is loaded (for lazy blocks) */
  isLoaded(typeId: BlockTypeId): boolean;

  /** Get blocks available for a specific guild */
  getForGuild(guildId: string): BaseComponentBlockDefinition[];

  /** Search blocks by keyword */
  search(query: string): BaseComponentBlockDefinition[];
}

/**
 * Options for creating a component block registry
 */
export interface ComponentBlockRegistryOptions {
  /** Pre-load all lazy blocks on registry creation */
  preloadAll?: boolean;
  /** Filter blocks by guild ID on creation */
  guildId?: string;
}

export type { BlockTypeId, BlockProps, DocumentError, Result };
