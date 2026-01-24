import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { z } from "zod/v4";
import {
  createBlockRegistry,
  createDefaultBlockRegistry,
  getBlockRegistry,
  resetGlobalBlockRegistry,
} from "../../src/model/registry";
import {
  defaultBlockDefinitions,
  headingBlockDefinition,
  paragraphBlockDefinition,
  sectionBlockDefinition,
} from "../../src/model/blocks";
import type {
  BlockDefinition,
  BlockRegistry,
} from "../../src/model/types";

describe("Block Registry", () => {
  describe("createBlockRegistry", () => {
    let registry: BlockRegistry;

    beforeEach(() => {
      registry = createBlockRegistry();
    });

    it("creates an empty registry", () => {
      expect(registry.getAll()).toHaveLength(0);
    });

    it("registers a new block type", () => {
      const result = registry.register(paragraphBlockDefinition);
      expect(result.ok).toBe(true);
      expect(registry.has("paragraph")).toBe(true);
      expect(registry.get("paragraph")).toBeDefined();
    });

    it("returns error when registering duplicate block type", () => {
      registry.register(paragraphBlockDefinition);
      const result = registry.register(paragraphBlockDefinition);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("REGISTRY_ERROR");
        expect(result.error.message).toContain("paragraph");
        expect(result.error.message).toContain("already registered");
      }
    });

    it("retrieves block by ID", () => {
      registry.register(headingBlockDefinition);
      const block = registry.get("heading");
      expect(block).toBeDefined();
      expect(block?.id).toBe("heading");
      expect(block?.name).toBe("Heading");
    });

    it("returns undefined for unregistered ID", () => {
      expect(registry.get("nonexistent")).toBeUndefined();
    });

    it("returns all registered blocks", () => {
      registry.register(paragraphBlockDefinition);
      registry.register(headingBlockDefinition);
      const all = registry.getAll();
      expect(all).toHaveLength(2);
      expect(all.map((b) => b.id)).toContain("paragraph");
      expect(all.map((b) => b.id)).toContain("heading");
    });

    it("filters blocks by category", () => {
      registry.register(paragraphBlockDefinition);
      registry.register(headingBlockDefinition);
      registry.register(sectionBlockDefinition);

      const typography = registry.getByCategory("typography");
      expect(typography.map((b) => b.id)).toContain("paragraph");
      expect(typography.map((b) => b.id)).toContain("heading");

      const layout = registry.getByCategory("layout");
      expect(layout.map((b) => b.id)).toContain("section");
    });

    it("unregisters a block type", () => {
      registry.register(paragraphBlockDefinition);
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
      registry.register(paragraphBlockDefinition);
      registry.register(headingBlockDefinition);
      expect(registry.getAll()).toHaveLength(2);

      registry.clear();
      expect(registry.getAll()).toHaveLength(0);
      expect(registry.has("paragraph")).toBe(false);
    });
  });

  describe("validateProps", () => {
    let registry: BlockRegistry;

    beforeEach(() => {
      registry = createBlockRegistry();
      registry.register(paragraphBlockDefinition);
      registry.register(headingBlockDefinition);
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

  describe("createBlock", () => {
    let registry: BlockRegistry;

    beforeEach(() => {
      registry = createBlockRegistry();
      registry.register(paragraphBlockDefinition);
      registry.register(sectionBlockDefinition);
    });

    it("creates a new block with UUIDv7 id", () => {
      const result = registry.createBlock("paragraph");
      expect(result.ok).toBe(true);
      if (result.ok) {
        // UUIDv7 validation
        expect(result.value.id).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        );
        expect(result.value.type).toBe("paragraph");
        expect(result.value.props).toEqual({ content: "" });
      }
    });

    it("creates container block with empty children", () => {
      const result = registry.createBlock("section");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.children).toEqual([]);
      }
    });

    it("non-container blocks have no children property", () => {
      const result = registry.createBlock("paragraph");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.children).toBeUndefined();
      }
    });

    it("returns error for unknown block type", () => {
      const result = registry.createBlock("nonexistent");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("INVALID_BLOCK_TYPE");
      }
    });

    it("creates blocks with default props", () => {
      registry.register(headingBlockDefinition);
      const result = registry.createBlock("heading");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.props.level).toBe(2);
        expect(result.value.props.content).toBe("");
      }
    });
  });

  describe("canContain", () => {
    let registry: BlockRegistry;

    beforeEach(() => {
      registry = createBlockRegistry();
      registry.register(paragraphBlockDefinition);
      registry.register(sectionBlockDefinition);

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

  describe("createDefaultBlockRegistry", () => {
    it("creates registry with all default blocks", () => {
      const registry = createDefaultBlockRegistry();
      expect(registry.getAll().length).toBe(defaultBlockDefinitions.length);
    });

    it("includes all required block types", () => {
      const registry = createDefaultBlockRegistry();
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
      const registry1 = createDefaultBlockRegistry();
      const registry2 = createDefaultBlockRegistry();

      registry1.unregister("heading");
      expect(registry1.has("heading")).toBe(false);
      expect(registry2.has("heading")).toBe(true);
    });
  });

  describe("getBlockRegistry (global)", () => {
    afterEach(() => {
      resetGlobalBlockRegistry();
    });

    it("returns a pre-populated registry", () => {
      const registry = getBlockRegistry();
      expect(registry.getAll().length).toBe(defaultBlockDefinitions.length);
    });

    it("returns the same instance on multiple calls", () => {
      const registry1 = getBlockRegistry();
      const registry2 = getBlockRegistry();
      expect(registry1).toBe(registry2);
    });

    it("persists modifications across calls", () => {
      const registry = getBlockRegistry();
      registry.unregister("heading");

      const sameRegistry = getBlockRegistry();
      expect(sameRegistry.has("heading")).toBe(false);
    });
  });

  describe("resetGlobalBlockRegistry", () => {
    it("resets the global registry to fresh state", () => {
      const registry = getBlockRegistry();
      registry.unregister("heading");
      registry.unregister("paragraph");

      resetGlobalBlockRegistry();

      const freshRegistry = getBlockRegistry();
      expect(freshRegistry.has("heading")).toBe(true);
      expect(freshRegistry.has("paragraph")).toBe(true);
    });
  });

  describe("Category grouping", () => {
    it("groups typography blocks correctly", () => {
      const registry = createDefaultBlockRegistry();
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
      const registry = createDefaultBlockRegistry();
      const layout = registry.getByCategory("layout");
      const ids = layout.map((b) => b.id).sort();
      expect(ids).toContain("divider");
      expect(ids).toContain("section");
      expect(ids).toContain("columns");
    });

    it("groups media blocks correctly", () => {
      const registry = createDefaultBlockRegistry();
      const media = registry.getByCategory("media");
      const ids = media.map((b) => b.id).sort();
      expect(ids).toContain("image");
      expect(ids).toContain("video");
    });

    it("groups form blocks correctly", () => {
      const registry = createDefaultBlockRegistry();
      const form = registry.getByCategory("form");
      expect(form.map((b) => b.id)).toContain("form");
    });

    it("groups embed blocks correctly", () => {
      const registry = createDefaultBlockRegistry();
      const embed = registry.getByCategory("embed");
      expect(embed.map((b) => b.id)).toContain("embed");
    });
  });
});
