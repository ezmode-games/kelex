import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod/v4";
import {
  createComponentBlockRegistry,
  createDefaultComponentBlockRegistry,
  getComponentBlockRegistry,
  resetGlobalComponentBlockRegistry,
  defaultComponentBlockDefinitions,
  headingComponentBlockDefinition,
  paragraphComponentBlockDefinition,
  sectionComponentBlockDefinition,
  BLOCK_CATEGORIES,
} from "../../src/registry";
import type {
  BlockDefinition,
  BlockComponentProps,
  ComponentBlockRegistry,
  BlockLoader,
} from "../../src/registry";
import { BaseBlockPropsSchema } from "../../src/model/types";

describe("Component Block Registry (PZ-201)", () => {
  describe("createComponentBlockRegistry", () => {
    let registry: ComponentBlockRegistry;

    beforeEach(() => {
      registry = createComponentBlockRegistry();
    });

    it("creates an empty registry", () => {
      expect(registry.getAll()).toHaveLength(0);
    });

    it("registers a new block type with component", () => {
      const result = registry.register(paragraphComponentBlockDefinition);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.typeId).toBe("paragraph");
        expect(result.value.isLazy).toBe(false);
        expect(result.value.loadedAt).toBeInstanceOf(Date);
      }
      expect(registry.has("paragraph")).toBe(true);
      expect(registry.get("paragraph")).toBeDefined();
    });

    it("returns error when registering duplicate block type", () => {
      registry.register(paragraphComponentBlockDefinition);
      const result = registry.register(paragraphComponentBlockDefinition);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("REGISTRY_ERROR");
        expect(result.error.message).toContain("paragraph");
        expect(result.error.message).toContain("already registered");
      }
    });

    it("retrieves block by ID", () => {
      registry.register(headingComponentBlockDefinition);
      const block = registry.get("heading");
      expect(block).toBeDefined();
      expect(block?.id).toBe("heading");
      expect(block?.name).toBe("Heading");
      expect(block?.component).toBeDefined();
    });

    it("returns undefined for unregistered ID", () => {
      expect(registry.get("nonexistent")).toBeUndefined();
    });

    it("returns all registered blocks", () => {
      registry.register(paragraphComponentBlockDefinition);
      registry.register(headingComponentBlockDefinition);
      const all = registry.getAll();
      expect(all).toHaveLength(2);
      expect(all.map((b) => b.id)).toContain("paragraph");
      expect(all.map((b) => b.id)).toContain("heading");
    });

    it("filters blocks by category", () => {
      registry.register(paragraphComponentBlockDefinition);
      registry.register(headingComponentBlockDefinition);
      registry.register(sectionComponentBlockDefinition);

      const typography = registry.getByCategory("typography");
      expect(typography.map((b) => b.id)).toContain("paragraph");
      expect(typography.map((b) => b.id)).toContain("heading");

      const layout = registry.getByCategory("layout");
      expect(layout.map((b) => b.id)).toContain("section");
    });

    it("unregisters a block type", () => {
      registry.register(paragraphComponentBlockDefinition);
      expect(registry.has("paragraph")).toBe(true);

      const result = registry.unregister("paragraph");
      expect(result).toBe(true);
      expect(registry.has("paragraph")).toBe(false);
      expect(registry.get("paragraph")).toBeUndefined();
    });

    it("returns false when unregistering non-existent type", () => {
      const result = registry.unregister("nonexistent");
      expect(result).toBe(false);
    });

    it("clears all registrations", () => {
      registry.register(paragraphComponentBlockDefinition);
      registry.register(headingComponentBlockDefinition);
      expect(registry.getAll()).toHaveLength(2);

      registry.clear();
      expect(registry.getAll()).toHaveLength(0);
      expect(registry.has("paragraph")).toBe(false);
    });
  });

  describe("validateProps", () => {
    let registry: ComponentBlockRegistry;

    beforeEach(() => {
      registry = createComponentBlockRegistry();
      registry.register(paragraphComponentBlockDefinition);
      registry.register(headingComponentBlockDefinition);
    });

    it("validates valid props", () => {
      const result = registry.validateProps("paragraph", {
        content: "Hello world",
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.content).toBe("Hello world");
      }
    });

    it("returns error for invalid props", () => {
      const result = registry.validateProps("heading", {
        level: 10, // Invalid: must be 1-6
        content: "Title",
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("VALIDATION_ERROR");
      }
    });

    it("returns error for unknown block type", () => {
      const result = registry.validateProps("nonexistent", {});
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("INVALID_BLOCK_TYPE");
      }
    });

    it("validates optional props", () => {
      const result = registry.validateProps("paragraph", {
        content: "Text",
        align: "center",
      });
      expect(result.ok).toBe(true);
    });

    it("rejects invalid enum values", () => {
      const result = registry.validateProps("paragraph", {
        content: "Text",
        align: "invalid",
      });
      expect(result.ok).toBe(false);
    });
  });

  describe("canContain", () => {
    let registry: ComponentBlockRegistry;

    beforeEach(() => {
      registry = createComponentBlockRegistry();
      registry.register(paragraphComponentBlockDefinition);
      registry.register(sectionComponentBlockDefinition);

      // Register a container with restricted children
      const restrictedContainer: BlockDefinition<{ name: string }> = {
        id: "restricted-container",
        name: "Restricted Container",
        icon: "box",
        category: "layout",
        isContainer: true,
        allowedChildren: ["paragraph"],
        propsSchema: z.object({ name: z.string() }),
        defaultProps: { name: "" },
        component: () => null,
      };
      registry.register(restrictedContainer);
    });

    it("non-container blocks cannot contain children", () => {
      const result = registry.canContain("paragraph", "paragraph");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(false);
      }
    });

    it("container without restrictions allows any type", () => {
      const result = registry.canContain("section", "paragraph");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(true);
      }
    });

    it("restricted container allows specified types", () => {
      const result = registry.canContain("restricted-container", "paragraph");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(true);
      }
    });

    it("restricted container rejects non-allowed types", () => {
      const result = registry.canContain("restricted-container", "section");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(false);
      }
    });

    it("returns error for unknown parent type", () => {
      const result = registry.canContain("nonexistent", "paragraph");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("INVALID_BLOCK_TYPE");
      }
    });
  });

  describe("createDefaultComponentBlockRegistry", () => {
    it("creates registry with all default blocks", () => {
      const registry = createDefaultComponentBlockRegistry();
      expect(registry.getAll().length).toBe(defaultComponentBlockDefinitions.length);
    });

    it("includes all required block types", () => {
      const registry = createDefaultComponentBlockRegistry();
      expect(registry.has("heading")).toBe(true);
      expect(registry.has("paragraph")).toBe(true);
      expect(registry.has("list")).toBe(true);
      expect(registry.has("quote")).toBe(true);
      expect(registry.has("code")).toBe(true);
      expect(registry.has("section")).toBe(true);
      expect(registry.has("columns")).toBe(true);
      expect(registry.has("image")).toBe(true);
      expect(registry.has("form")).toBe(true);
    });

    it("creates isolated registry instances", () => {
      const registry1 = createDefaultComponentBlockRegistry();
      const registry2 = createDefaultComponentBlockRegistry();

      registry1.unregister("heading");
      expect(registry1.has("heading")).toBe(false);
      expect(registry2.has("heading")).toBe(true);
    });

    it("all default blocks have components", () => {
      const registry = createDefaultComponentBlockRegistry();
      for (const def of registry.getAll()) {
        expect(def.component).toBeDefined();
        expect(typeof def.component).toBe("function");
      }
    });

    it("all default blocks have version info", () => {
      const registry = createDefaultComponentBlockRegistry();
      for (const def of registry.getAll()) {
        expect(def.version).toBeDefined();
      }
    });
  });

  describe("getComponentBlockRegistry (global)", () => {
    afterEach(() => {
      resetGlobalComponentBlockRegistry();
    });

    it("returns a pre-populated registry", () => {
      const registry = getComponentBlockRegistry();
      expect(registry.getAll().length).toBe(defaultComponentBlockDefinitions.length);
    });

    it("returns the same instance on multiple calls", () => {
      const registry1 = getComponentBlockRegistry();
      const registry2 = getComponentBlockRegistry();
      expect(registry1).toBe(registry2);
    });

    it("persists modifications across calls", () => {
      const registry = getComponentBlockRegistry();
      registry.unregister("heading");

      const sameRegistry = getComponentBlockRegistry();
      expect(sameRegistry.has("heading")).toBe(false);
    });
  });

  describe("resetGlobalComponentBlockRegistry", () => {
    it("resets the global registry to fresh state", () => {
      const registry = getComponentBlockRegistry();
      registry.unregister("heading");
      registry.unregister("paragraph");

      resetGlobalComponentBlockRegistry();

      const freshRegistry = getComponentBlockRegistry();
      expect(freshRegistry.has("heading")).toBe(true);
      expect(freshRegistry.has("paragraph")).toBe(true);
    });
  });

  describe("Category grouping", () => {
    it("groups typography blocks correctly", () => {
      const registry = createDefaultComponentBlockRegistry();
      const typography = registry.getByCategory("typography");
      const ids = typography.map((b) => b.id).sort();
      expect(ids).toContain("heading");
      expect(ids).toContain("paragraph");
      expect(ids).toContain("list");
      expect(ids).toContain("quote");
      expect(ids).toContain("code");
      expect(ids).toContain("callout");
      expect(ids).toContain("table");
    });

    it("groups layout blocks correctly", () => {
      const registry = createDefaultComponentBlockRegistry();
      const layout = registry.getByCategory("layout");
      const ids = layout.map((b) => b.id).sort();
      expect(ids).toContain("divider");
      expect(ids).toContain("section");
      expect(ids).toContain("columns");
    });

    it("groups media blocks correctly", () => {
      const registry = createDefaultComponentBlockRegistry();
      const media = registry.getByCategory("media");
      const ids = media.map((b) => b.id).sort();
      expect(ids).toContain("image");
      expect(ids).toContain("video");
    });

    it("groups form blocks correctly", () => {
      const registry = createDefaultComponentBlockRegistry();
      const form = registry.getByCategory("form");
      expect(form.map((b) => b.id)).toContain("form");
    });

    it("groups embed blocks correctly", () => {
      const registry = createDefaultComponentBlockRegistry();
      const embed = registry.getByCategory("embed");
      expect(embed.map((b) => b.id)).toContain("embed");
    });
  });

  describe("getAllCategories", () => {
    it("returns a map of all categories with their blocks", () => {
      const registry = createDefaultComponentBlockRegistry();
      const categories = registry.getAllCategories();

      expect(categories).toBeInstanceOf(Map);
      expect(categories.has("typography")).toBe(true);
      expect(categories.has("layout")).toBe(true);
      expect(categories.has("media")).toBe(true);
      expect(categories.has("form")).toBe(true);
      expect(categories.has("embed")).toBe(true);
      expect(categories.has("platform")).toBe(true);
      expect(categories.has("gaming")).toBe(true);
      expect(categories.has("other")).toBe(true);
    });

    it("includes empty categories", () => {
      const registry = createDefaultComponentBlockRegistry();
      const categories = registry.getAllCategories();

      // Platform and gaming should exist but be empty with default blocks
      expect(categories.get("platform")).toEqual([]);
      expect(categories.get("gaming")).toEqual([]);
    });

    it("returns blocks grouped by their categories", () => {
      const registry = createDefaultComponentBlockRegistry();
      const categories = registry.getAllCategories();

      const typography = categories.get("typography");
      expect(typography).toBeDefined();
      expect(typography!.length).toBeGreaterThan(0);
      expect(typography!.every((b) => b.category === "typography")).toBe(true);
    });
  });

  describe("getCategoryMeta", () => {
    it("returns metadata for valid category", () => {
      const registry = createDefaultComponentBlockRegistry();
      const meta = registry.getCategoryMeta("typography");

      expect(meta).toBeDefined();
      expect(meta?.id).toBe("typography");
      expect(meta?.name).toBe("Typography");
      expect(meta?.icon).toBeDefined();
      expect(meta?.order).toBe(0);
    });

    it("returns undefined for invalid category", () => {
      const registry = createDefaultComponentBlockRegistry();
      // @ts-expect-error - testing invalid category
      const meta = registry.getCategoryMeta("invalid-category");
      expect(meta).toBeUndefined();
    });

    it("returns metadata for new categories (platform, gaming)", () => {
      const registry = createDefaultComponentBlockRegistry();

      const platform = registry.getCategoryMeta("platform");
      expect(platform).toBeDefined();
      expect(platform?.name).toBe("Platform");

      const gaming = registry.getCategoryMeta("gaming");
      expect(gaming).toBeDefined();
      expect(gaming?.name).toBe("Gaming");
    });
  });

  describe("BLOCK_CATEGORIES", () => {
    it("contains all expected categories", () => {
      const categoryIds = BLOCK_CATEGORIES.map((c) => c.id);
      expect(categoryIds).toContain("typography");
      expect(categoryIds).toContain("media");
      expect(categoryIds).toContain("layout");
      expect(categoryIds).toContain("form");
      expect(categoryIds).toContain("embed");
      expect(categoryIds).toContain("platform");
      expect(categoryIds).toContain("gaming");
      expect(categoryIds).toContain("other");
    });

    it("categories are sorted by order", () => {
      const orders = BLOCK_CATEGORIES.map((c) => c.order);
      expect(orders).toEqual([...orders].sort((a, b) => a - b));
    });

    it("each category has required properties", () => {
      for (const category of BLOCK_CATEGORIES) {
        expect(category.id).toBeDefined();
        expect(category.name).toBeDefined();
        expect(category.description).toBeDefined();
        expect(category.icon).toBeDefined();
        expect(typeof category.order).toBe("number");
      }
    });
  });

  describe("Dynamic loading", () => {
    let registry: ComponentBlockRegistry;

    beforeEach(() => {
      registry = createComponentBlockRegistry();
    });

    it("registers lazy block with loader", () => {
      const MockComponent = () => null;
      const loader: BlockLoader<{ content: string }> = async () => ({
        component: MockComponent,
      });

      const lazyBlock: BlockDefinition<{ content: string }> = {
        id: "lazy-block",
        name: "Lazy Block",
        icon: "clock",
        category: "other",
        isContainer: false,
        propsSchema: BaseBlockPropsSchema.extend({ content: z.string() }),
        defaultProps: { content: "" },
        loader,
      };

      const result = registry.register(lazyBlock);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.isLazy).toBe(true);
        expect(result.value.loadedAt).toBeUndefined();
      }
    });

    it("isLoaded returns false for lazy blocks", () => {
      const loader: BlockLoader<{ content: string }> = async () => ({
        component: () => null,
      });

      const lazyBlock: BlockDefinition<{ content: string }> = {
        id: "lazy-block",
        name: "Lazy Block",
        icon: "clock",
        category: "other",
        isContainer: false,
        propsSchema: BaseBlockPropsSchema.extend({ content: z.string() }),
        defaultProps: { content: "" },
        loader,
      };

      registry.register(lazyBlock);
      expect(registry.isLoaded("lazy-block")).toBe(false);
    });

    it("isLoaded returns true for blocks with component", () => {
      registry.register(paragraphComponentBlockDefinition);
      expect(registry.isLoaded("paragraph")).toBe(true);
    });

    it("loadBlock loads lazy block component", async () => {
      const MockComponent = () => null;
      const loader = vi.fn().mockResolvedValue({
        component: MockComponent,
      });

      const lazyBlock: BlockDefinition<{ content: string }> = {
        id: "lazy-block",
        name: "Lazy Block",
        icon: "clock",
        category: "other",
        isContainer: false,
        propsSchema: BaseBlockPropsSchema.extend({ content: z.string() }),
        defaultProps: { content: "" },
        loader,
      };

      registry.register(lazyBlock);
      expect(registry.isLoaded("lazy-block")).toBe(false);

      const result = await registry.loadBlock("lazy-block");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.component).toBe(MockComponent);
      }
      expect(registry.isLoaded("lazy-block")).toBe(true);
      expect(loader).toHaveBeenCalledTimes(1);
    });

    it("loadBlock returns existing definition if already loaded", async () => {
      const MockComponent = () => null;
      const loader = vi.fn().mockResolvedValue({
        component: MockComponent,
      });

      const lazyBlock: BlockDefinition<{ content: string }> = {
        id: "lazy-block",
        name: "Lazy Block",
        icon: "clock",
        category: "other",
        isContainer: false,
        propsSchema: BaseBlockPropsSchema.extend({ content: z.string() }),
        defaultProps: { content: "" },
        loader,
      };

      registry.register(lazyBlock);

      // Load once
      await registry.loadBlock("lazy-block");
      // Load again
      await registry.loadBlock("lazy-block");

      // Loader should only be called once
      expect(loader).toHaveBeenCalledTimes(1);
    });

    it("loadBlock returns error for unknown block", async () => {
      const result = await registry.loadBlock("nonexistent");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("INVALID_BLOCK_TYPE");
      }
    });

    it("loadBlock handles loader errors", async () => {
      const loader = vi.fn().mockRejectedValue(new Error("Load failed"));

      const lazyBlock: BlockDefinition<{ content: string }> = {
        id: "lazy-block",
        name: "Lazy Block",
        icon: "clock",
        category: "other",
        isContainer: false,
        propsSchema: BaseBlockPropsSchema.extend({ content: z.string() }),
        defaultProps: { content: "" },
        loader,
      };

      registry.register(lazyBlock);

      const result = await registry.loadBlock("lazy-block");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("REGISTRY_ERROR");
        expect(result.error.message).toContain("Load failed");
      }
    });

    it("loadBlock deduplicates concurrent loads", async () => {
      const MockComponent = () => null;
      const loader = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ component: MockComponent }), 10)
          )
      );

      const lazyBlock: BlockDefinition<{ content: string }> = {
        id: "lazy-block",
        name: "Lazy Block",
        icon: "clock",
        category: "other",
        isContainer: false,
        propsSchema: BaseBlockPropsSchema.extend({ content: z.string() }),
        defaultProps: { content: "" },
        loader,
      };

      registry.register(lazyBlock);

      // Start multiple loads concurrently
      const [result1, result2, result3] = await Promise.all([
        registry.loadBlock("lazy-block"),
        registry.loadBlock("lazy-block"),
        registry.loadBlock("lazy-block"),
      ]);

      // All should succeed
      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);
      expect(result3.ok).toBe(true);

      // Loader should only be called once
      expect(loader).toHaveBeenCalledTimes(1);
    });

    it("rejects blocks with both component and loader", () => {
      const blockWithBoth: BlockDefinition<{ content: string }> = {
        id: "invalid-block",
        name: "Invalid Block",
        icon: "x",
        category: "other",
        isContainer: false,
        propsSchema: BaseBlockPropsSchema.extend({ content: z.string() }),
        defaultProps: { content: "" },
        component: () => null,
        loader: async () => ({ component: () => null }),
      };

      const result = registry.register(blockWithBoth);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("VALIDATION_ERROR");
        expect(result.error.message).toContain("both component and loader");
      }
    });
  });

  describe("Guild restrictions", () => {
    it("getForGuild returns all blocks without restrictions", () => {
      const registry = createDefaultComponentBlockRegistry();
      const blocks = registry.getForGuild("guild-123");

      // All default blocks have no guild restrictions
      expect(blocks.length).toBe(defaultComponentBlockDefinitions.length);
    });

    it("getForGuild filters blocks by guild ID", () => {
      const registry = createComponentBlockRegistry();
      registry.register(paragraphComponentBlockDefinition);

      const restrictedBlock: BlockDefinition<{ content: string }> = {
        id: "guild-specific",
        name: "Guild Specific",
        icon: "star",
        category: "other",
        isContainer: false,
        propsSchema: BaseBlockPropsSchema.extend({ content: z.string() }),
        defaultProps: { content: "" },
        component: () => null,
        guildRestrictions: ["guild-123", "guild-456"],
      };
      registry.register(restrictedBlock);

      // Guild with access
      const withAccess = registry.getForGuild("guild-123");
      expect(withAccess.map((b) => b.id)).toContain("guild-specific");
      expect(withAccess.map((b) => b.id)).toContain("paragraph");

      // Guild without access
      const withoutAccess = registry.getForGuild("guild-789");
      expect(withoutAccess.map((b) => b.id)).not.toContain("guild-specific");
      expect(withoutAccess.map((b) => b.id)).toContain("paragraph");
    });

    it("registry with guildId option filters on registration", () => {
      const registry = createComponentBlockRegistry({ guildId: "guild-123" });

      // Should register successfully - guild is allowed
      const restrictedAllowed: BlockDefinition<{ content: string }> = {
        id: "allowed-block",
        name: "Allowed Block",
        icon: "check",
        category: "other",
        isContainer: false,
        propsSchema: BaseBlockPropsSchema.extend({ content: z.string() }),
        defaultProps: { content: "" },
        component: () => null,
        guildRestrictions: ["guild-123"],
      };
      const allowedResult = registry.register(restrictedAllowed);
      expect(allowedResult.ok).toBe(true);

      // Should fail - guild is not allowed
      const restrictedDenied: BlockDefinition<{ content: string }> = {
        id: "denied-block",
        name: "Denied Block",
        icon: "x",
        category: "other",
        isContainer: false,
        propsSchema: BaseBlockPropsSchema.extend({ content: z.string() }),
        defaultProps: { content: "" },
        component: () => null,
        guildRestrictions: ["guild-456"],
      };
      const deniedResult = registry.register(restrictedDenied);
      expect(deniedResult.ok).toBe(false);
      if (!deniedResult.ok) {
        expect(deniedResult.error.code).toBe("VALIDATION_ERROR");
        expect(deniedResult.error.message).toContain("not available for guild");
      }
    });

    it("blocks without restrictions pass guild filter", () => {
      const registry = createComponentBlockRegistry({ guildId: "guild-123" });
      const result = registry.register(paragraphComponentBlockDefinition);
      expect(result.ok).toBe(true);
    });
  });

  describe("Search functionality", () => {
    let registry: ComponentBlockRegistry;

    beforeEach(() => {
      registry = createDefaultComponentBlockRegistry();
    });

    it("searches by block name", () => {
      const results = registry.search("heading");
      expect(results.map((b) => b.id)).toContain("heading");
    });

    it("searches by block description", () => {
      const results = registry.search("syntax highlighting");
      expect(results.map((b) => b.id)).toContain("code");
    });

    it("searches by keywords", () => {
      const results = registry.search("h1");
      expect(results.map((b) => b.id)).toContain("heading");
    });

    it("searches by type ID", () => {
      const results = registry.search("paragraph");
      expect(results.map((b) => b.id)).toContain("paragraph");
    });

    it("search is case-insensitive", () => {
      const results = registry.search("HEADING");
      expect(results.map((b) => b.id)).toContain("heading");
    });

    it("returns empty array for empty query", () => {
      const results = registry.search("");
      expect(results).toHaveLength(0);
    });

    it("returns empty array for whitespace query", () => {
      const results = registry.search("   ");
      expect(results).toHaveLength(0);
    });

    it("returns empty array for no matches", () => {
      const results = registry.search("xyznonexistent123");
      expect(results).toHaveLength(0);
    });

    it("returns multiple matches", () => {
      const results = registry.search("text");
      // Should match paragraph (description contains "text") and others
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe("Premium blocks", () => {
    it("can register premium blocks", () => {
      const registry = createComponentBlockRegistry();

      const premiumBlock: BlockDefinition<{ content: string }> = {
        id: "premium-block",
        name: "Premium Block",
        icon: "crown",
        category: "other",
        isContainer: false,
        propsSchema: BaseBlockPropsSchema.extend({ content: z.string() }),
        defaultProps: { content: "" },
        component: () => null,
        isPremium: true,
      };

      const result = registry.register(premiumBlock);
      expect(result.ok).toBe(true);

      const retrieved = registry.get("premium-block");
      expect(retrieved?.isPremium).toBe(true);
    });

    it("default blocks are not premium", () => {
      const registry = createDefaultComponentBlockRegistry();
      for (const def of registry.getAll()) {
        expect(def.isPremium).toBeFalsy();
      }
    });
  });
});
