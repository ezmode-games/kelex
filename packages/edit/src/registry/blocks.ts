/**
 * Block Registry Implementation with Component Support
 *
 * Dynamic block type registration system with React component support,
 * lazy loading, and guild-specific filtering.
 * Implements PZ-201: Block Registry System
 */

import type { ComponentType } from "react";
import { createDocumentError, err, ok } from "../model/types";
import type {
  BaseComponentBlockDefinition,
  BlockCategory,
  BlockCategoryMeta,
  BlockComponentProps,
  BlockDefinition,
  BlockProps,
  BlockRegistrationResult,
  BlockTypeId,
  ComponentBlockRegistry,
  ComponentBlockRegistryOptions,
  DocumentError,
  Result,
} from "./types";
import { BLOCK_CATEGORIES } from "./types";

/**
 * Create a new component block registry
 */
export function createComponentBlockRegistry(
  options: ComponentBlockRegistryOptions = {}
): ComponentBlockRegistry {
  // Use BaseComponentBlockDefinition for internal storage to handle type variance
  const definitions = new Map<BlockTypeId, BaseComponentBlockDefinition>();
  const loadedBlocks = new Set<BlockTypeId>();
  const loadingPromises = new Map<BlockTypeId, Promise<Result<BaseComponentBlockDefinition, DocumentError>>>();

  const registry: ComponentBlockRegistry = {
    register<T = unknown>(definition: BlockDefinition<T>): Result<BlockRegistrationResult, DocumentError> {
      if (definitions.has(definition.id)) {
        return err(
          createDocumentError(
            "REGISTRY_ERROR",
            `Block type "${definition.id}" is already registered`
          )
        );
      }

      // Validate that either component or loader is provided, but not both
      if (definition.component && definition.loader) {
        return err(
          createDocumentError(
            "VALIDATION_ERROR",
            `Block type "${definition.id}" cannot have both component and loader`
          )
        );
      }

      // Apply guild filter if configured
      if (options.guildId && definition.guildRestrictions?.length) {
        if (!definition.guildRestrictions.includes(options.guildId)) {
          return err(
            createDocumentError(
              "VALIDATION_ERROR",
              `Block type "${definition.id}" is not available for guild "${options.guildId}"`
            )
          );
        }
      }

      // Store as BaseComponentBlockDefinition for heterogeneous storage
      definitions.set(definition.id, definition as BaseComponentBlockDefinition);

      // Mark as loaded if component is provided directly
      const isLazy = !definition.component && !!definition.loader;
      if (!isLazy) {
        loadedBlocks.add(definition.id);
      }

      const result: BlockRegistrationResult = {
        typeId: definition.id,
        isLazy,
        loadedAt: isLazy ? undefined : new Date(),
      };

      return ok(result);
    },

    get(id: BlockTypeId): BaseComponentBlockDefinition | undefined {
      return definitions.get(id);
    },

    getAll(): BaseComponentBlockDefinition[] {
      return Array.from(definitions.values());
    },

    getByCategory(category: BlockCategory): BaseComponentBlockDefinition[] {
      return Array.from(definitions.values()).filter(
        (def) => def.category === category
      );
    },

    getAllCategories(): Map<BlockCategory, BaseComponentBlockDefinition[]> {
      const categoryMap = new Map<BlockCategory, BaseComponentBlockDefinition[]>();

      // Initialize with all categories (including empty ones)
      for (const meta of BLOCK_CATEGORIES) {
        categoryMap.set(meta.id, []);
      }

      // Group blocks by category
      for (const def of definitions.values()) {
        const blocks = categoryMap.get(def.category) || [];
        blocks.push(def);
        categoryMap.set(def.category, blocks);
      }

      return categoryMap;
    },

    getCategoryMeta(category: BlockCategory): BlockCategoryMeta | undefined {
      return BLOCK_CATEGORIES.find((meta) => meta.id === category);
    },

    has(id: BlockTypeId): boolean {
      return definitions.has(id);
    },

    unregister(id: BlockTypeId): boolean {
      loadedBlocks.delete(id);
      loadingPromises.delete(id);
      return definitions.delete(id);
    },

    clear(): void {
      definitions.clear();
      loadedBlocks.clear();
      loadingPromises.clear();
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

    async loadBlock(typeId: BlockTypeId): Promise<Result<BaseComponentBlockDefinition, DocumentError>> {
      const definition = definitions.get(typeId);
      if (!definition) {
        return err(
          createDocumentError(
            "INVALID_BLOCK_TYPE",
            `Unknown block type: ${typeId}`
          )
        );
      }

      // Already loaded
      if (loadedBlocks.has(typeId)) {
        return ok(definition);
      }

      // No loader means it should already be loaded
      if (!definition.loader) {
        loadedBlocks.add(typeId);
        return ok(definition);
      }

      // Check if already loading
      const existingPromise = loadingPromises.get(typeId);
      if (existingPromise) {
        return existingPromise;
      }

      // Start loading
      const loadPromise = (async (): Promise<Result<BaseComponentBlockDefinition, DocumentError>> => {
        try {
          const loaded = await definition.loader!();

          // Update the definition with the loaded component
          const updatedDefinition: BaseComponentBlockDefinition = {
            ...definition,
            component: loaded.component,
          };

          // Update schema if provided
          if (loaded.propsSchema) {
            // biome-ignore lint/suspicious/noExplicitAny: Schema types are runtime validated
            (updatedDefinition as any).propsSchema = loaded.propsSchema;
          }

          definitions.set(typeId, updatedDefinition);
          loadedBlocks.add(typeId);
          loadingPromises.delete(typeId);

          return ok(updatedDefinition);
        } catch (error) {
          loadingPromises.delete(typeId);
          return err(
            createDocumentError(
              "REGISTRY_ERROR",
              `Failed to load block type "${typeId}": ${error instanceof Error ? error.message : "Unknown error"}`,
              error
            )
          );
        }
      })();

      loadingPromises.set(typeId, loadPromise);
      return loadPromise;
    },

    isLoaded(typeId: BlockTypeId): boolean {
      return loadedBlocks.has(typeId);
    },

    getForGuild(guildId: string): BaseComponentBlockDefinition[] {
      return Array.from(definitions.values()).filter((def) => {
        // No restrictions means available to all
        if (!def.guildRestrictions || def.guildRestrictions.length === 0) {
          return true;
        }
        return def.guildRestrictions.includes(guildId);
      });
    },

    search(query: string): BaseComponentBlockDefinition[] {
      const normalizedQuery = query.toLowerCase().trim();
      if (!normalizedQuery) {
        return [];
      }

      return Array.from(definitions.values()).filter((def) => {
        // Search in name
        if (def.name.toLowerCase().includes(normalizedQuery)) {
          return true;
        }
        // Search in description
        if (def.description?.toLowerCase().includes(normalizedQuery)) {
          return true;
        }
        // Search in keywords
        if (def.keywords?.some((kw) => kw.toLowerCase().includes(normalizedQuery))) {
          return true;
        }
        // Search in type ID
        if (def.id.toLowerCase().includes(normalizedQuery)) {
          return true;
        }
        return false;
      });
    },
  };

  return registry;
}

// Global registry instance (lazy initialized)
let globalComponentRegistry: ComponentBlockRegistry | null = null;

/**
 * Get the global component block registry instance
 * Creates one if it doesn't exist, pre-populated with default block types
 */
export function getComponentBlockRegistry(): ComponentBlockRegistry {
  if (!globalComponentRegistry) {
    globalComponentRegistry = createDefaultComponentBlockRegistry();
  }
  return globalComponentRegistry;
}

/**
 * Reset the global component registry (useful for testing)
 */
export function resetGlobalComponentBlockRegistry(): void {
  globalComponentRegistry = null;
}

/**
 * Create a registry pre-populated with default block types including stub components
 */
export function createDefaultComponentBlockRegistry(
  options: ComponentBlockRegistryOptions = {}
): ComponentBlockRegistry {
  const registry = createComponentBlockRegistry(options);

  // Register all default block definitions with stub components
  for (const definition of defaultComponentBlockDefinitions) {
    registry.register(definition);
  }

  return registry;
}

// Re-export types
export type {
  BlockCategory,
  BlockCategoryMeta,
  BlockComponentProps,
  BlockDefinition,
  BlockLoader,
  BlockRegistrationResult,
  BlockTypeId,
  ComponentBlockRegistry,
  ComponentBlockRegistryOptions,
} from "./types";

export { BLOCK_CATEGORIES } from "./types";

// Import default definitions after registry functions are defined
import { defaultComponentBlockDefinitions } from "./default-blocks";
