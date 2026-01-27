import { deserializeBlocks, serializeBlocks } from "../serialization/json";
import type { Page, PageMeta, SavePageInput } from "./types";

/**
 * Abstract page storage backend.
 *
 * Consumers provide an implementation backed by their storage layer
 * (e.g. ContentStorageService from @phantom-zone/storage).
 */
export interface PageStorage {
  /** Save serialized page content. Returns the assigned version. */
  saveContent(
    guildId: string,
    pageId: string,
    content: string,
    metadata?: { title?: string; description?: string; authorId?: string },
  ): Promise<{ version: number }>;

  /** Load the latest serialized content. Returns null if not found. */
  loadContent(
    guildId: string,
    pageId: string,
  ): Promise<{
    content: string;
    version: number;
    updatedAt: Date;
    title?: string;
    description?: string;
    authorId?: string;
  } | null>;

  /** List all pages for a guild. */
  listPages(
    guildId: string,
  ): Promise<Array<{ pageId: string; version: number; updatedAt: Date }>>;

  /** Delete a page and all its versions. */
  deletePage(guildId: string, pageId: string): Promise<void>;
}

/**
 * Page service providing CRUD operations for pages.
 *
 * Handles serialization/deserialization and delegates storage
 * to the injected PageStorage backend.
 */
export class PageService {
  constructor(
    private readonly storage: PageStorage,
    private readonly guildId: string,
  ) {}

  /**
   * Save a page (create or update).
   */
  async save(input: SavePageInput): Promise<{ version: number }> {
    const content = serializeBlocks(input.blocks);
    return this.storage.saveContent(this.guildId, input.pageId, content, {
      title: input.title,
      description: input.description,
      authorId: input.authorId,
    });
  }

  /**
   * Load a page by ID. Returns null if not found.
   */
  async load(pageId: string): Promise<Page | null> {
    const stored = await this.storage.loadContent(this.guildId, pageId);
    if (!stored) return null;

    const result = deserializeBlocks(stored.content);
    if (!result.ok) {
      throw new Error(`Failed to deserialize page ${pageId}: ${result.error}`);
    }

    return {
      meta: {
        pageId,
        title: stored.title ?? pageId,
        description: stored.description,
        version: stored.version,
        updatedAt: stored.updatedAt,
        authorId: stored.authorId,
      },
      blocks: result.blocks,
    };
  }

  /**
   * List all pages for the guild.
   */
  async list(): Promise<PageMeta[]> {
    const pages = await this.storage.listPages(this.guildId);
    return pages.map((p) => ({
      pageId: p.pageId,
      title: p.pageId, // Title requires loading content; use pageId as fallback
      version: p.version,
      updatedAt: p.updatedAt,
    }));
  }

  /**
   * Delete a page and all its versions.
   */
  async delete(pageId: string): Promise<void> {
    return this.storage.deletePage(this.guildId, pageId);
  }
}
