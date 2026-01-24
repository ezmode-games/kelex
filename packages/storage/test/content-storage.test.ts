import { describe, expect, it, beforeEach } from "vitest";
import { R2Client } from "../src/r2-client";
import {
  ContentStorageService,
  createContentStorageService,
  type PutContentInput,
} from "../src/content-storage";
import { createMockBucket } from "./test-utils";

describe("ContentStorageService", () => {
  let client: R2Client;
  let service: ContentStorageService;

  beforeEach(() => {
    const { bucket } = createMockBucket();
    client = new R2Client(bucket);
    service = new ContentStorageService(client);
  });

  describe("createContentStorageService", () => {
    it("creates a ContentStorageService instance", () => {
      const { bucket } = createMockBucket();
      const client = new R2Client(bucket);
      const service = createContentStorageService(client);
      expect(service).toBeInstanceOf(ContentStorageService);
    });

    it("accepts configuration with path prefix", () => {
      const { bucket } = createMockBucket();
      const client = new R2Client(bucket);
      const service = createContentStorageService(client, {
        pathPrefix: "test-prefix",
      });
      expect(service).toBeInstanceOf(ContentStorageService);
    });
  });

  describe("putContent", () => {
    const validInput: PutContentInput = {
      guildId: "guild-001",
      pageId: "page-001",
      content: "# Hello World\n\nThis is MDX content.",
    };

    it("stores content with auto-incrementing version", async () => {
      const result = await service.putContent(validInput);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.version).toBe(1);
        expect(result.value.key).toContain("v1.json");
        expect(result.value.createdAt).toBeInstanceOf(Date);
      }
    });

    it("increments version on subsequent puts", async () => {
      await service.putContent(validInput);
      await service.putContent(validInput);
      const result = await service.putContent(validInput);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.version).toBe(3);
      }
    });

    it("stores optional metadata", async () => {
      const input: PutContentInput = {
        ...validInput,
        title: "Welcome Page",
        description: "The main welcome page",
        authorId: "user-123",
      };

      const putResult = await service.putContent(input);
      expect(putResult.ok).toBe(true);

      const getResult = await service.getContent("guild-001", "page-001", 1);
      expect(getResult.ok).toBe(true);
      if (getResult.ok) {
        expect(getResult.value.metadata.title).toBe("Welcome Page");
        expect(getResult.value.metadata.description).toBe("The main welcome page");
        expect(getResult.value.metadata.authorId).toBe("user-123");
      }
    });

    it("rejects empty guild ID", async () => {
      const input = { ...validInput, guildId: "" };
      const result = await service.putContent(input);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("INVALID_KEY");
        expect(result.error.message).toContain("guildId");
      }
    });

    it("rejects empty page ID", async () => {
      const input = { ...validInput, pageId: "" };
      const result = await service.putContent(input);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("INVALID_KEY");
        expect(result.error.message).toContain("pageId");
      }
    });

    it("accepts empty string content", async () => {
      const input = { ...validInput, content: "" };
      const result = await service.putContent(input);

      expect(result.ok).toBe(true);
    });
  });

  describe("getContent", () => {
    beforeEach(async () => {
      await service.putContent({
        guildId: "guild-001",
        pageId: "page-001",
        content: "# Test Content",
        title: "Test Page",
      });
    });

    it("retrieves a specific version", async () => {
      const result = await service.getContent("guild-001", "page-001", 1);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.content).toBe("# Test Content");
        expect(result.value.metadata.version).toBe(1);
        expect(result.value.metadata.title).toBe("Test Page");
      }
    });

    it("returns error for non-existent version", async () => {
      const result = await service.getContent("guild-001", "page-001", 999);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("VERSION_NOT_FOUND");
      }
    });

    it("rejects invalid version number", async () => {
      const result = await service.getContent("guild-001", "page-001", 0);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("INVALID_KEY");
      }
    });
  });

  describe("getCurrentContent", () => {
    beforeEach(async () => {
      await service.putContent({
        guildId: "guild-001",
        pageId: "page-001",
        content: "Version 1",
      });
      await service.putContent({
        guildId: "guild-001",
        pageId: "page-001",
        content: "Version 2",
      });
      await service.putContent({
        guildId: "guild-001",
        pageId: "page-001",
        content: "Version 3",
      });
    });

    it("retrieves the latest version", async () => {
      const result = await service.getCurrentContent("guild-001", "page-001");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.content).toBe("Version 3");
        expect(result.value.metadata.version).toBe(3);
      }
    });

    it("returns error for page with no content", async () => {
      const result = await service.getCurrentContent("guild-001", "no-content");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("CONTENT_NOT_FOUND");
      }
    });
  });

  describe("listVersions", () => {
    beforeEach(async () => {
      await service.putContent({
        guildId: "guild-001",
        pageId: "page-001",
        content: "V1",
      });
      await service.putContent({
        guildId: "guild-001",
        pageId: "page-001",
        content: "V2",
      });
      await service.putContent({
        guildId: "guild-001",
        pageId: "page-001",
        content: "V3",
      });
    });

    it("lists all versions in order", async () => {
      const result = await service.listVersions("guild-001", "page-001");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(3);
        expect(result.value[0].version).toBe(1);
        expect(result.value[1].version).toBe(2);
        expect(result.value[2].version).toBe(3);
      }
    });

    it("returns empty array for page with no versions", async () => {
      const result = await service.listVersions("guild-001", "no-versions");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(0);
      }
    });

    it("includes size and etag for each version", async () => {
      const result = await service.listVersions("guild-001", "page-001");

      expect(result.ok).toBe(true);
      if (result.ok) {
        for (const version of result.value) {
          expect(version.size).toBeGreaterThan(0);
          expect(version.etag).toBeDefined();
          expect(version.createdAt).toBeInstanceOf(Date);
        }
      }
    });
  });

  describe("listPages", () => {
    beforeEach(async () => {
      // Create content for multiple pages
      await service.putContent({
        guildId: "guild-001",
        pageId: "page-a",
        content: "Page A v1",
      });
      await service.putContent({
        guildId: "guild-001",
        pageId: "page-a",
        content: "Page A v2",
      });
      await service.putContent({
        guildId: "guild-001",
        pageId: "page-b",
        content: "Page B v1",
      });
      await service.putContent({
        guildId: "guild-001",
        pageId: "page-c",
        content: "Page C v1",
      });
    });

    it("lists all pages for a guild", async () => {
      const result = await service.listPages("guild-001");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(3);
        expect(result.value.map((p) => p.pageId)).toContain("page-a");
        expect(result.value.map((p) => p.pageId)).toContain("page-b");
        expect(result.value.map((p) => p.pageId)).toContain("page-c");
      }
    });

    it("includes current version for each page", async () => {
      const result = await service.listPages("guild-001");

      expect(result.ok).toBe(true);
      if (result.ok) {
        const pageA = result.value.find((p) => p.pageId === "page-a");
        const pageB = result.value.find((p) => p.pageId === "page-b");
        expect(pageA?.currentVersion).toBe(2);
        expect(pageB?.currentVersion).toBe(1);
      }
    });

    it("returns empty array for guild with no pages", async () => {
      const result = await service.listPages("empty-guild");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(0);
      }
    });
  });

  describe("exists", () => {
    beforeEach(async () => {
      await service.putContent({
        guildId: "guild-001",
        pageId: "page-001",
        content: "Content",
      });
    });

    it("returns true when content exists", async () => {
      const result = await service.exists("guild-001", "page-001");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(true);
      }
    });

    it("returns false when content does not exist", async () => {
      const result = await service.exists("guild-001", "no-content");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(false);
      }
    });
  });

  describe("versionExists", () => {
    beforeEach(async () => {
      await service.putContent({
        guildId: "guild-001",
        pageId: "page-001",
        content: "Content",
      });
    });

    it("returns true for existing version", async () => {
      const result = await service.versionExists("guild-001", "page-001", 1);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(true);
      }
    });

    it("returns false for non-existing version", async () => {
      const result = await service.versionExists("guild-001", "page-001", 99);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(false);
      }
    });
  });

  describe("deleteVersion", () => {
    beforeEach(async () => {
      await service.putContent({
        guildId: "guild-001",
        pageId: "page-001",
        content: "V1",
      });
      await service.putContent({
        guildId: "guild-001",
        pageId: "page-001",
        content: "V2",
      });
    });

    it("deletes a specific version", async () => {
      const deleteResult = await service.deleteVersion("guild-001", "page-001", 1);
      expect(deleteResult.ok).toBe(true);

      const existsResult = await service.versionExists("guild-001", "page-001", 1);
      expect(existsResult.ok && existsResult.value).toBe(false);

      // Version 2 should still exist
      const existsResult2 = await service.versionExists("guild-001", "page-001", 2);
      expect(existsResult2.ok && existsResult2.value).toBe(true);
    });

    it("rejects invalid version number", async () => {
      const result = await service.deleteVersion("guild-001", "page-001", 0);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("INVALID_KEY");
      }
    });
  });

  describe("deleteAllVersions", () => {
    beforeEach(async () => {
      await service.putContent({
        guildId: "guild-001",
        pageId: "page-001",
        content: "V1",
      });
      await service.putContent({
        guildId: "guild-001",
        pageId: "page-001",
        content: "V2",
      });
      await service.putContent({
        guildId: "guild-001",
        pageId: "page-001",
        content: "V3",
      });
    });

    it("deletes all versions and returns count", async () => {
      const result = await service.deleteAllVersions("guild-001", "page-001");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(3);
      }

      const existsResult = await service.exists("guild-001", "page-001");
      expect(existsResult.ok && existsResult.value).toBe(false);
    });

    it("returns 0 for page with no versions", async () => {
      const result = await service.deleteAllVersions("guild-001", "no-versions");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(0);
      }
    });
  });

  describe("path prefix", () => {
    it("prepends prefix to all keys", async () => {
      const { bucket } = createMockBucket();
      const client = new R2Client(bucket);
      const service = new ContentStorageService(client, { pathPrefix: "prod" });

      await service.putContent({
        guildId: "guild-001",
        pageId: "page-001",
        content: "Content",
      });

      const listResult = await client.listAll("prod/");
      expect(listResult.ok).toBe(true);
      if (listResult.ok) {
        expect(listResult.value.length).toBe(1);
        expect(listResult.value[0].key).toContain("prod/");
      }
    });
  });

  describe("isolation", () => {
    it("maintains separate version counters per page", async () => {
      // Page 1: 3 versions
      await service.putContent({
        guildId: "guild-001",
        pageId: "page-001",
        content: "V1",
      });
      await service.putContent({
        guildId: "guild-001",
        pageId: "page-001",
        content: "V2",
      });
      await service.putContent({
        guildId: "guild-001",
        pageId: "page-001",
        content: "V3",
      });

      // Page 2: should start at version 1
      const result = await service.putContent({
        guildId: "guild-001",
        pageId: "page-002",
        content: "New page",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.version).toBe(1);
      }
    });

    it("maintains separate content per guild", async () => {
      await service.putContent({
        guildId: "guild-001",
        pageId: "page-001",
        content: "Guild 1 content",
      });
      await service.putContent({
        guildId: "guild-002",
        pageId: "page-001",
        content: "Guild 2 content",
      });

      const result1 = await service.getCurrentContent("guild-001", "page-001");
      const result2 = await service.getCurrentContent("guild-002", "page-001");

      expect(result1.ok && result1.value.content).toBe("Guild 1 content");
      expect(result2.ok && result2.value.content).toBe("Guild 2 content");
    });
  });
});
