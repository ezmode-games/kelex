import { describe, expect, it, vi } from "vitest";
import type { PageStorage } from "../src/pages/page-service";
import { PageService } from "../src/pages/page-service";
import { serializeBlocks } from "../src/serialization/json";

function createMockStorage(): PageStorage {
  const pages = new Map<
    string,
    {
      content: string;
      version: number;
      updatedAt: Date;
      title?: string;
      description?: string;
      authorId?: string;
    }
  >();

  return {
    saveContent: vi.fn(async (_guildId, pageId, content, metadata) => {
      const existing = pages.get(pageId);
      const version = (existing?.version ?? 0) + 1;
      pages.set(pageId, {
        content,
        version,
        updatedAt: new Date(),
        title: metadata?.title,
        description: metadata?.description,
        authorId: metadata?.authorId,
      });
      return { version };
    }),
    loadContent: vi.fn(async (_guildId, pageId) => {
      return pages.get(pageId) ?? null;
    }),
    listPages: vi.fn(async () => {
      return Array.from(pages.entries()).map(([pageId, data]) => ({
        pageId,
        version: data.version,
        updatedAt: data.updatedAt,
      }));
    }),
    deletePage: vi.fn(async (_guildId, pageId) => {
      pages.delete(pageId);
    }),
  };
}

describe("PageService", () => {
  const guildId = "guild-1";

  it("saves and loads a page", async () => {
    const storage = createMockStorage();
    const service = new PageService(storage, guildId);

    await service.save({
      pageId: "page-1",
      title: "My Page",
      description: "A test page",
      blocks: [{ id: "1", type: "heading", props: { text: "Hello" } }],
    });

    const page = await service.load("page-1");
    expect(page).not.toBeNull();
    expect(page?.meta.title).toBe("My Page");
    expect(page?.meta.description).toBe("A test page");
    expect(page?.meta.version).toBe(1);
    expect(page?.blocks).toEqual([
      { id: "1", type: "heading", props: { text: "Hello" } },
    ]);
  });

  it("returns null for non-existent page", async () => {
    const storage = createMockStorage();
    const service = new PageService(storage, guildId);

    const page = await service.load("nonexistent");
    expect(page).toBeNull();
  });

  it("increments version on subsequent saves", async () => {
    const storage = createMockStorage();
    const service = new PageService(storage, guildId);

    const input = {
      pageId: "page-1",
      title: "My Page",
      blocks: [{ id: "1", type: "heading", props: { text: "v1" } }],
    };

    const r1 = await service.save(input);
    expect(r1.version).toBe(1);

    const r2 = await service.save({
      ...input,
      blocks: [{ id: "1", type: "heading", props: { text: "v2" } }],
    });
    expect(r2.version).toBe(2);
  });

  it("lists pages", async () => {
    const storage = createMockStorage();
    const service = new PageService(storage, guildId);

    await service.save({
      pageId: "page-a",
      title: "A",
      blocks: [],
    });
    await service.save({
      pageId: "page-b",
      title: "B",
      blocks: [],
    });

    const list = await service.list();
    expect(list).toHaveLength(2);
    expect(list.map((p) => p.pageId).sort()).toEqual(["page-a", "page-b"]);
  });

  it("deletes a page", async () => {
    const storage = createMockStorage();
    const service = new PageService(storage, guildId);

    await service.save({
      pageId: "page-1",
      title: "Delete me",
      blocks: [],
    });

    await service.delete("page-1");
    const page = await service.load("page-1");
    expect(page).toBeNull();
  });

  it("passes serialized blocks to storage", async () => {
    const storage = createMockStorage();
    const service = new PageService(storage, guildId);
    const blocks = [{ id: "1", type: "heading", props: { text: "Hello" } }];

    await service.save({ pageId: "p1", title: "T", blocks });

    expect(storage.saveContent).toHaveBeenCalledWith(
      guildId,
      "p1",
      serializeBlocks(blocks),
      { title: "T", description: undefined, authorId: undefined },
    );
  });

  it("throws on corrupted content", async () => {
    const storage = createMockStorage();
    // Inject bad content directly
    (storage.loadContent as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      content: "not-valid-json{",
      version: 1,
      updatedAt: new Date(),
    });

    const service = new PageService(storage, guildId);
    await expect(service.load("bad-page")).rejects.toThrow(
      "Failed to deserialize",
    );
  });
});
