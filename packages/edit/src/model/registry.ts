/**
 * Block Registry Implementation
 *
 * Dynamic block type registration system for the block-based document editor.
 * Implements PZ-200: Block Document Model
 */

import { uuidv7 } from "uuidv7";
import type {
  Block,
  BlockCategory,
  BlockDefinition,
  BlockProps,
  BlockRegistry,
  BlockTypeId,
  DocumentError,
  Result,
} from "./types";
import { createDocumentError, err, ok } from "./types";

/**
 * Create a new block registry
 */
export function createBlockRegistry(): BlockRegistry {
  const definitions = new Map<BlockTypeId, BlockDefinition>();

  const registry: BlockRegistry = {
    register<T = object>(definition: BlockDefinition<T>): Result<void, DocumentError> {
      if (definitions.has(definition.id)) {
        return err(
          createDocumentError(
            "REGISTRY_ERROR",
            `Block type "${definition.id}" is already registered`
          )
        );
      }

      // Type assertion needed because Map stores generic BlockDefinition
      definitions.set(definition.id, definition as BlockDefinition);
      return ok(undefined);
    },

    get(id: BlockTypeId): BlockDefinition | undefined {
      return definitions.get(id);
    },

    getAll(): BlockDefinition[] {
      return Array.from(definitions.values());
    },

    getByCategory(category: BlockCategory): BlockDefinition[] {
      return Array.from(definitions.values()).filter(
        (def) => def.category === category
      );
    },

    has(id: BlockTypeId): boolean {
      return definitions.has(id);
    },

    unregister(id: BlockTypeId): boolean {
      return definitions.delete(id);
    },

    clear(): void {
      definitions.clear();
    },

    validateProps(
      typeId: BlockTypeId,
      props: unknown
    ): Result<BlockProps, DocumentError> {
      const definition = definitions.get(typeId);
      if (!definition) {
        return err(
          createDocumentError(
            "INVALID_BLOCK_TYPE",
            `Unknown block type: ${typeId}`
          )
        );
      }

      const result = definition.propsSchema.safeParse(props);
      if (!result.success) {
        return err(
          createDocumentError(
            "VALIDATION_ERROR",
            `Invalid props for block type "${typeId}": ${result.error.message}`,
            result.error
          )
        );
      }

      return ok(result.data as BlockProps);
    },

    createBlock(typeId: BlockTypeId): Result<Block, DocumentError> {
      const definition = definitions.get(typeId);
      if (!definition) {
        return err(
          createDocumentError(
            "INVALID_BLOCK_TYPE",
            `Unknown block type: ${typeId}`
          )
        );
      }

      const block: Block = {
        id: uuidv7(),
        type: typeId,
        props: { ...definition.defaultProps },
      };

      // Container blocks start with empty children array
      if (definition.isContainer) {
        block.children = [];
      }

      return ok(block);
    },

    canContain(
      parentTypeId: BlockTypeId,
      childTypeId: BlockTypeId
    ): Result<boolean, DocumentError> {
      const parentDef = definitions.get(parentTypeId);
      if (!parentDef) {
        return err(
          createDocumentError(
            "INVALID_BLOCK_TYPE",
            `Unknown parent block type: ${parentTypeId}`
          )
        );
      }

      // Non-container blocks cannot contain children
      if (!parentDef.isContainer) {
        return ok(false);
      }

      // If allowedChildren is not specified, all types are allowed
      if (!parentDef.allowedChildren || parentDef.allowedChildren.length === 0) {
        return ok(true);
      }

      // Check if child type is in the allowed list
      return ok(parentDef.allowedChildren.includes(childTypeId));
    },
  };

  return registry;
}

// Global registry instance (lazy initialized)
let globalRegistry: BlockRegistry | null = null;

/**
 * Get the global block registry instance
 * Creates one if it doesn't exist, pre-populated with default block types
 */
export function getBlockRegistry(): BlockRegistry {
  if (!globalRegistry) {
    globalRegistry = createDefaultBlockRegistry();
  }
  return globalRegistry;
}

/**
 * Reset the global registry (useful for testing)
 */
export function resetGlobalBlockRegistry(): void {
  globalRegistry = null;
}

/**
 * Create a registry pre-populated with default block types
 */
export function createDefaultBlockRegistry(): BlockRegistry {
  const registry = createBlockRegistry();

  // Register all default block types
  for (const definition of defaultBlockDefinitions) {
    registry.register(definition);
  }

  return registry;
}

// Import default block definitions
import { defaultBlockDefinitions } from "./blocks";
