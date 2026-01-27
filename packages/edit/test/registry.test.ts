import { describe, expect, it } from "vitest";
import {
  blockDefaults,
  blockSchemas,
  defaultRegistry,
} from "../src/editor/registry";

describe("defaultRegistry", () => {
  it("contains all block definitions", () => {
    const types = defaultRegistry.blocks.map((b) => b.type);
    expect(types).toContain("heading");
    expect(types).toContain("paragraph");
    expect(types).toContain("list");
    expect(types).toContain("image");
    expect(types).toContain("embed");
    expect(types).toContain("divider");
    expect(types).toContain("form");
  });

  it("has categories", () => {
    expect(defaultRegistry.categories.length).toBeGreaterThan(0);
    const categoryIds = defaultRegistry.categories.map((c) => c.id);
    expect(categoryIds).toContain("text");
    expect(categoryIds).toContain("media");
    expect(categoryIds).toContain("interactive");
  });

  it("all blocks reference valid categories", () => {
    const categoryIds = new Set(defaultRegistry.categories.map((c) => c.id));
    for (const block of defaultRegistry.blocks) {
      expect(categoryIds.has(block.category)).toBe(true);
    }
  });
});

describe("blockSchemas", () => {
  it("has a schema for each block type in the registry", () => {
    for (const block of defaultRegistry.blocks) {
      expect(blockSchemas[block.type]).toBeDefined();
    }
  });
});

describe("blockDefaults", () => {
  it("has defaults for each block type in the registry", () => {
    for (const block of defaultRegistry.blocks) {
      expect(blockDefaults[block.type]).toBeDefined();
    }
  });

  it("defaults validate against their schemas", () => {
    for (const block of defaultRegistry.blocks) {
      const schema = blockSchemas[block.type];
      const defaults = blockDefaults[block.type];
      if (schema && defaults) {
        const result = schema.safeParse(defaults);
        expect(result.success).toBe(true);
      }
    }
  });
});
