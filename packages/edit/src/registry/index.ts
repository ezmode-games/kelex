/**
 * Block Registry Module
 *
 * Exports for the block registry system with React component support.
 * Implements PZ-201: Block Registry System
 */

// Registry types
export type {
  BaseComponentBlockDefinition,
  BlockCategory,
  BlockCategoryMeta,
  BlockComponentProps,
  BlockDefinition,
  BlockLoader,
  BlockProps,
  BlockRegistrationResult,
  BlockTypeId,
  ComponentBlockRegistry,
  ComponentBlockRegistryOptions,
  DocumentError,
  Result,
} from "./types";

// Category metadata
export { BLOCK_CATEGORIES } from "./types";

// Registry factory and utilities
export {
  createComponentBlockRegistry,
  createDefaultComponentBlockRegistry,
  getComponentBlockRegistry,
  resetGlobalComponentBlockRegistry,
} from "./blocks";

// Default block definitions with components
export {
  calloutComponentBlockDefinition,
  codeComponentBlockDefinition,
  columnsComponentBlockDefinition,
  defaultComponentBlockDefinitions,
  dividerComponentBlockDefinition,
  embedComponentBlockDefinition,
  formComponentBlockDefinition,
  headingComponentBlockDefinition,
  imageComponentBlockDefinition,
  listComponentBlockDefinition,
  paragraphComponentBlockDefinition,
  quoteComponentBlockDefinition,
  sectionComponentBlockDefinition,
  tableComponentBlockDefinition,
  videoComponentBlockDefinition,
} from "./default-blocks";
