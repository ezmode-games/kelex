import type { Block } from "@rafters/ui/components/editor";

/**
 * Page metadata for listing and display.
 */
export interface PageMeta {
  /** Unique page identifier */
  pageId: string;
  /** Page title */
  title: string;
  /** Optional description */
  description?: string;
  /** Current version number */
  version: number;
  /** Last updated timestamp */
  updatedAt: Date;
  /** Author identifier */
  authorId?: string;
}

/**
 * Full page content (metadata + blocks).
 */
export interface Page {
  meta: PageMeta;
  blocks: Block[];
}

/**
 * Input for creating or updating a page.
 */
export interface SavePageInput {
  /** Page ID (generated if creating new) */
  pageId: string;
  /** Page title */
  title: string;
  /** Optional description */
  description?: string;
  /** Author ID */
  authorId?: string;
  /** Block content */
  blocks: Block[];
}
