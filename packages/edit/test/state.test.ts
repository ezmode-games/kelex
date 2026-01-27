import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { usePageEditorState } from "../src/editor/state";

describe("usePageEditorState", () => {
  it("initializes with empty blocks by default", () => {
    const { result } = renderHook(() => usePageEditorState());
    expect(result.current.blocks).toEqual([]);
    expect(result.current.selectedIds.size).toBe(0);
    expect(result.current.focusedId).toBeUndefined();
  });

  it("initializes with provided blocks", () => {
    const initial = [
      { id: "1", type: "heading", props: { text: "Hello", level: "h1" } },
      { id: "2", type: "paragraph", props: { text: "World" } },
    ];
    const { result } = renderHook(() =>
      usePageEditorState({ initialBlocks: initial }),
    );
    expect(result.current.blocks).toEqual(initial);
  });

  describe("addBlock", () => {
    it("adds a block at the end", () => {
      const { result } = renderHook(() => usePageEditorState());

      act(() => {
        result.current.addBlock("heading");
      });

      expect(result.current.blocks).toHaveLength(1);
      expect(result.current.blocks[0]?.type).toBe("heading");
      expect(result.current.blocks[0]?.id).toBeTruthy();
    });

    it("adds a block at a specific index", () => {
      const initial = [
        { id: "1", type: "heading", props: {} },
        { id: "2", type: "paragraph", props: {} },
      ];
      const { result } = renderHook(() =>
        usePageEditorState({ initialBlocks: initial }),
      );

      act(() => {
        result.current.addBlock("divider", 1);
      });

      expect(result.current.blocks).toHaveLength(3);
      expect(result.current.blocks[1]?.type).toBe("divider");
    });

    it("selects and focuses the new block", () => {
      const { result } = renderHook(() => usePageEditorState());

      act(() => {
        result.current.addBlock("heading");
      });

      const newId = result.current.blocks[0]?.id ?? "";
      expect(result.current.selectedIds.has(newId)).toBe(true);
      expect(result.current.focusedId).toBe(newId);
    });
  });

  describe("removeBlock", () => {
    it("removes a block by ID", () => {
      const initial = [
        { id: "1", type: "heading", props: {} },
        { id: "2", type: "paragraph", props: {} },
      ];
      const { result } = renderHook(() =>
        usePageEditorState({ initialBlocks: initial }),
      );

      act(() => {
        result.current.removeBlock("1");
      });

      expect(result.current.blocks).toHaveLength(1);
      expect(result.current.blocks[0]?.id).toBe("2");
    });

    it("clears selection when removed block was selected", () => {
      const initial = [{ id: "1", type: "heading", props: {} }];
      const { result } = renderHook(() =>
        usePageEditorState({ initialBlocks: initial }),
      );

      act(() => {
        result.current.setSelectedIds(new Set(["1"]));
      });

      act(() => {
        result.current.removeBlock("1");
      });

      expect(result.current.selectedIds.has("1")).toBe(false);
    });

    it("does nothing for non-existent ID", () => {
      const initial = [{ id: "1", type: "heading", props: {} }];
      const { result } = renderHook(() =>
        usePageEditorState({ initialBlocks: initial }),
      );

      act(() => {
        result.current.removeBlock("nonexistent");
      });

      expect(result.current.blocks).toHaveLength(1);
    });
  });

  describe("duplicateBlock", () => {
    it("duplicates a block after the original", () => {
      const initial = [
        {
          id: "1",
          type: "heading",
          props: { text: "Hello", level: "h1" },
        },
      ];
      const { result } = renderHook(() =>
        usePageEditorState({ initialBlocks: initial }),
      );

      act(() => {
        result.current.duplicateBlock("1");
      });

      expect(result.current.blocks).toHaveLength(2);
      expect(result.current.blocks[1]?.type).toBe("heading");
      expect(result.current.blocks[1]?.props).toEqual({
        text: "Hello",
        level: "h1",
      });
      expect(result.current.blocks[1]?.id).not.toBe("1");
    });
  });

  describe("moveBlock", () => {
    it("moves a block to a new index", () => {
      const initial = [
        { id: "1", type: "heading", props: {} },
        { id: "2", type: "paragraph", props: {} },
        { id: "3", type: "divider", props: {} },
      ];
      const { result } = renderHook(() =>
        usePageEditorState({ initialBlocks: initial }),
      );

      act(() => {
        result.current.moveBlock("1", 2);
      });

      expect(result.current.blocks.map((b) => b.id)).toEqual(["2", "3", "1"]);
    });

    it("does nothing when moving to same index", () => {
      const initial = [
        { id: "1", type: "heading", props: {} },
        { id: "2", type: "paragraph", props: {} },
      ];
      const { result } = renderHook(() =>
        usePageEditorState({ initialBlocks: initial }),
      );

      const blocksBefore = result.current.blocks;

      act(() => {
        result.current.moveBlock("1", 0);
      });

      // Should be referentially equal (no push to history)
      expect(result.current.blocks).toBe(blocksBefore);
    });
  });

  describe("moveBlockUp / moveBlockDown", () => {
    it("moves a block up", () => {
      const initial = [
        { id: "1", type: "heading", props: {} },
        { id: "2", type: "paragraph", props: {} },
      ];
      const { result } = renderHook(() =>
        usePageEditorState({ initialBlocks: initial }),
      );

      act(() => {
        result.current.moveBlockUp("2");
      });

      expect(result.current.blocks[0]?.id).toBe("2");
    });

    it("does not move first block up", () => {
      const initial = [
        { id: "1", type: "heading", props: {} },
        { id: "2", type: "paragraph", props: {} },
      ];
      const { result } = renderHook(() =>
        usePageEditorState({ initialBlocks: initial }),
      );

      const blocksBefore = result.current.blocks;

      act(() => {
        result.current.moveBlockUp("1");
      });

      expect(result.current.blocks).toBe(blocksBefore);
    });

    it("moves a block down", () => {
      const initial = [
        { id: "1", type: "heading", props: {} },
        { id: "2", type: "paragraph", props: {} },
      ];
      const { result } = renderHook(() =>
        usePageEditorState({ initialBlocks: initial }),
      );

      act(() => {
        result.current.moveBlockDown("1");
      });

      expect(result.current.blocks[1]?.id).toBe("1");
    });

    it("does not move last block down", () => {
      const initial = [
        { id: "1", type: "heading", props: {} },
        { id: "2", type: "paragraph", props: {} },
      ];
      const { result } = renderHook(() =>
        usePageEditorState({ initialBlocks: initial }),
      );

      const blocksBefore = result.current.blocks;

      act(() => {
        result.current.moveBlockDown("2");
      });

      expect(result.current.blocks).toBe(blocksBefore);
    });
  });

  describe("updateBlockProps", () => {
    it("merges new props into a block", () => {
      const initial = [
        {
          id: "1",
          type: "heading",
          props: { text: "Hello", level: "h1" },
        },
      ];
      const { result } = renderHook(() =>
        usePageEditorState({ initialBlocks: initial }),
      );

      act(() => {
        result.current.updateBlockProps("1", { text: "Updated" });
      });

      expect(result.current.blocks[0]?.props).toEqual({
        text: "Updated",
        level: "h1",
      });
    });
  });

  describe("selectedBlock", () => {
    it("returns undefined when nothing selected", () => {
      const { result } = renderHook(() => usePageEditorState());
      expect(result.current.selectedBlock).toBeUndefined();
    });

    it("returns the first selected block", () => {
      const initial = [
        { id: "1", type: "heading", props: {} },
        { id: "2", type: "paragraph", props: {} },
      ];
      const { result } = renderHook(() =>
        usePageEditorState({ initialBlocks: initial }),
      );

      act(() => {
        result.current.setSelectedIds(new Set(["2"]));
      });

      expect(result.current.selectedBlock?.id).toBe("2");
    });
  });

  describe("selection and focus", () => {
    it("sets and clears focused ID", () => {
      const { result } = renderHook(() => usePageEditorState());

      act(() => {
        result.current.setFocusedId("abc");
      });
      expect(result.current.focusedId).toBe("abc");

      act(() => {
        result.current.setFocusedId(null);
      });
      expect(result.current.focusedId).toBeUndefined();
    });
  });
});
