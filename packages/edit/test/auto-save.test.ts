import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useAutoSave } from "../src/persistence/auto-save";
import type { AutoSaveOptions } from "../src/persistence/types";

function createMockPersistence() {
  return {
    save: vi.fn(async () => ({ version: 1 })),
    load: vi.fn(async () => null),
  };
}

describe("useAutoSave", () => {
  it("starts in idle status", () => {
    const persistence = createMockPersistence();
    const options: AutoSaveOptions = {
      persistence,
      guildId: "g1",
      pageId: "p1",
      debounceMs: 100,
    };

    const { result } = renderHook(() => useAutoSave([], options));
    expect(result.current.status).toBe("idle");
  });

  it("saves after debounce delay", async () => {
    vi.useFakeTimers();
    const persistence = createMockPersistence();
    const onSave = vi.fn();
    const options: AutoSaveOptions = {
      persistence,
      guildId: "g1",
      pageId: "p1",
      debounceMs: 100,
      onSave,
    };

    const blocks = [{ id: "1", type: "heading", props: { text: "Hello" } }];
    renderHook(() => useAutoSave(blocks, options));

    // Advance past debounce
    await act(async () => {
      vi.advanceTimersByTime(150);
      // Let the async save settle
      await vi.runAllTimersAsync();
    });

    expect(persistence.save).toHaveBeenCalledWith("g1", "p1", blocks);
    vi.useRealTimers();
  });

  it("does not save when content unchanged", async () => {
    vi.useFakeTimers();
    const persistence = createMockPersistence();
    const options: AutoSaveOptions = {
      persistence,
      guildId: "g1",
      pageId: "p1",
      debounceMs: 50,
    };

    const blocks = [{ id: "1", type: "heading", props: { text: "Hello" } }];
    const { rerender } = renderHook(({ b }) => useAutoSave(b, options), {
      initialProps: { b: blocks },
    });

    // First save
    await act(async () => {
      vi.advanceTimersByTime(100);
      await vi.runAllTimersAsync();
    });

    expect(persistence.save).toHaveBeenCalledTimes(1);

    // Re-render with same blocks (same reference)
    rerender({ b: blocks });
    await act(async () => {
      vi.advanceTimersByTime(100);
      await vi.runAllTimersAsync();
    });

    // Should skip because serialized content is the same
    expect(persistence.save).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("calls onError when save fails", async () => {
    vi.useFakeTimers();
    const persistence = createMockPersistence();
    persistence.save.mockRejectedValueOnce(new Error("network down"));
    const onError = vi.fn();

    const options: AutoSaveOptions = {
      persistence,
      guildId: "g1",
      pageId: "p1",
      debounceMs: 50,
      onError,
    };

    const blocks = [{ id: "1", type: "heading", props: { text: "Hello" } }];
    renderHook(() => useAutoSave(blocks, options));

    await act(async () => {
      vi.advanceTimersByTime(100);
      await vi.runAllTimersAsync();
    });

    expect(onError).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("saveNow triggers immediate save", async () => {
    vi.useFakeTimers();
    const persistence = createMockPersistence();
    const options: AutoSaveOptions = {
      persistence,
      guildId: "g1",
      pageId: "p1",
      debounceMs: 5000, // long debounce
    };

    const blocks = [{ id: "1", type: "heading", props: { text: "Hello" } }];
    const { result } = renderHook(() => useAutoSave(blocks, options));

    await act(async () => {
      result.current.saveNow();
      await vi.runAllTimersAsync();
    });

    expect(persistence.save).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
