import type { Block } from "@rafters/ui/components/editor";
import { useCallback, useEffect, useRef, useState } from "react";
import { serializeBlocks } from "../serialization/json";
import type { AutoSaveOptions } from "./types";

/**
 * Status of the auto-save system.
 */
export type AutoSaveStatus = "idle" | "saving" | "saved" | "error";

/**
 * Return type for the useAutoSave hook.
 */
export interface UseAutoSaveReturn {
  /** Current auto-save status */
  status: AutoSaveStatus;
  /** Trigger an immediate save (bypasses debounce) */
  saveNow: () => void;
  /** The version number of the last successful save */
  lastSavedVersion: number | undefined;
}

/**
 * Hook that auto-saves block changes with debounce.
 *
 * Watches the blocks array for changes and persists after a debounce delay.
 * Skips saves when the serialized content hasn't changed.
 */
export function useAutoSave(
  blocks: Block[],
  options: AutoSaveOptions,
): UseAutoSaveReturn {
  const {
    persistence,
    guildId,
    pageId,
    debounceMs = 1000,
    onSave,
    onError,
  } = options;

  const statusRef = useRef<AutoSaveStatus>("idle");
  const lastSavedRef = useRef<string | undefined>(undefined);
  const lastVersionRef = useRef<number | undefined>(undefined);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // Force re-render on status change
  const forceUpdate = useForceUpdate();

  const setStatus = useCallback(
    (s: AutoSaveStatus) => {
      statusRef.current = s;
      forceUpdate();
    },
    [forceUpdate],
  );

  const doSave = useCallback(
    async (blocksToSave: Block[]) => {
      const serialized = serializeBlocks(blocksToSave);

      // Skip if content hasn't changed
      if (serialized === lastSavedRef.current) return;

      setStatus("saving");
      try {
        const result = await persistence.save(guildId, pageId, blocksToSave);
        lastSavedRef.current = serialized;
        lastVersionRef.current = result.version;
        setStatus("saved");
        onSave?.(result.version);
      } catch (error) {
        setStatus("error");
        onError?.(error);
      }
    },
    [persistence, guildId, pageId, setStatus, onSave, onError],
  );

  // Debounced save on blocks change
  useEffect(() => {
    if (timerRef.current !== undefined) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      void doSave(blocks);
    }, debounceMs);

    return () => {
      if (timerRef.current !== undefined) {
        clearTimeout(timerRef.current);
      }
    };
  }, [blocks, debounceMs, doSave]);

  // Immediate save
  const saveNow = useCallback(() => {
    if (timerRef.current !== undefined) {
      clearTimeout(timerRef.current);
    }
    void doSave(blocks);
  }, [blocks, doSave]);

  return {
    status: statusRef.current,
    saveNow,
    lastSavedVersion: lastVersionRef.current,
  };
}

/**
 * Minimal force-update hook using a counter.
 */
function useForceUpdate(): () => void {
  const [, setState] = useState(0);
  return useCallback(() => setState((n) => n + 1), []);
}
