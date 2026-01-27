import type { Block } from "@rafters/ui/components/editor";
import { describe, expect, it } from "vitest";
import {
  deserializeBlocks,
  SerializedBlocksSchema,
  serializeBlocks,
} from "../src/serialization";

describe("serializeBlocks", () => {
  it("serializes an empty array", () => {
    expect(serializeBlocks([])).toBe("[]");
  });

  it("serializes blocks to JSON", () => {
    const blocks: Block[] = [
      { id: "1", type: "heading", props: { text: "Hello", level: "h1" } },
      { id: "2", type: "paragraph", props: { text: "World" } },
    ];
    const json = serializeBlocks(blocks);
    expect(JSON.parse(json)).toEqual(blocks);
  });
});

describe("deserializeBlocks", () => {
  it("deserializes valid JSON", () => {
    const blocks: Block[] = [
      { id: "1", type: "heading", props: { text: "Hello", level: "h1" } },
    ];
    const json = serializeBlocks(blocks);
    const result = deserializeBlocks(json);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.blocks).toEqual(blocks);
    }
  });

  it("returns error for invalid JSON", () => {
    const result = deserializeBlocks("not json{");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Invalid JSON");
    }
  });

  it("returns error for non-array JSON", () => {
    const result = deserializeBlocks('{"foo": 1}');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Invalid block data");
    }
  });

  it("returns error for blocks missing required fields", () => {
    const result = deserializeBlocks('[{"id": "1"}]');
    expect(result.ok).toBe(false);
  });

  it("accepts blocks with children", () => {
    const json = JSON.stringify([
      {
        id: "1",
        type: "container",
        props: {},
        children: [{ id: "2", type: "paragraph", props: { text: "nested" } }],
      },
    ]);
    const result = deserializeBlocks(json);
    expect(result.ok).toBe(true);
  });

  it("round-trips correctly", () => {
    const blocks: Block[] = [
      { id: "a", type: "heading", props: { text: "Title", level: "h2" } },
      {
        id: "b",
        type: "list",
        props: { items: ["one", "two"], ordered: true },
      },
      { id: "c", type: "divider", props: { style: "dashed" } },
    ];
    const result = deserializeBlocks(serializeBlocks(blocks));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.blocks).toEqual(blocks);
    }
  });
});

describe("SerializedBlocksSchema", () => {
  it("validates a valid block array", () => {
    const data = [{ id: "1", type: "heading", props: { text: "Hello" } }];
    expect(SerializedBlocksSchema.safeParse(data).success).toBe(true);
  });

  it("rejects blocks with empty id", () => {
    const data = [{ id: "", type: "heading", props: {} }];
    expect(SerializedBlocksSchema.safeParse(data).success).toBe(false);
  });

  it("rejects blocks with empty type", () => {
    const data = [{ id: "1", type: "", props: {} }];
    expect(SerializedBlocksSchema.safeParse(data).success).toBe(false);
  });
});
