import type { Block } from "@rafters/ui/components/editor";

/**
 * Abstract persistence backend for page content.
 *
 * Consumers provide an implementation backed by their storage
 * (e.g. ContentStorageService from @phantom-zone/storage).
 */
export interface PagePersistence {
  /** Save blocks for a page. Returns the assigned version number. */
  save(
    guildId: string,
    pageId: string,
    blocks: Block[],
    metadata?: { title?: string; description?: string; authorId?: string },
  ): Promise<{ version: number }>;

  /** Load the latest blocks for a page. Returns null if no content exists. */
  load(
    guildId: string,
    pageId: string,
  ): Promise<{ blocks: Block[]; version: number } | null>;
}

/**
 * Options for the auto-save hook.
 */
export interface AutoSaveOptions {
  /** Persistence backend */
  persistence: PagePersistence;
  /** Guild ID */
  guildId: string;
  /** Page ID */
  pageId: string;
  /** Debounce delay in milliseconds (default: 1000) */
  debounceMs?: number;
  /** Called after a successful save */
  onSave?: (version: number) => void;
  /** Called when a save fails */
  onError?: (error: unknown) => void;
}
