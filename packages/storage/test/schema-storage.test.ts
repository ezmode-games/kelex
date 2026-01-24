import { describe, expect, it, beforeEach } from "vitest";
import { z } from "zod/v4";
import { R2Client } from "../src/r2-client";
import {
  SchemaStorageService,
  createSchemaStorageService,
  defaultSchemaSerializer,
} from "../src/schema-storage";
import { createMockBucket } from "./test-utils";

describe("SchemaStorageService", () => {
  let client: R2Client;
  let service: SchemaStorageService;

  beforeEach(() => {
    const { bucket } = createMockBucket();
    client = new R2Client(bucket);
    service = new SchemaStorageService(client);
  });

  describe("createSchemaStorageService", () => {
    it("creates a SchemaStorageService instance", () => {
      const { bucket } = createMockBucket();
      const client = new R2Client(bucket);
      const service = createSchemaStorageService(client);
      expect(service).toBeInstanceOf(SchemaStorageService);
    });

    it("accepts configuration with path prefix", () => {
      const { bucket } = createMockBucket();
      const client = new R2Client(bucket);
      const service = createSchemaStorageService(client, {
        pathPrefix: "test-prefix",
      });
      expect(service).toBeInstanceOf(SchemaStorageService);
    });
  });

  describe("defaultSchemaSerializer", () => {
    it("serializes a simple Zod schema", () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      const result = defaultSchemaSerializer.serialize(schema);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeDefined();
        expect(typeof result.value).toBe("object");
      }
    });

    it("deserializes JSON Schema", () => {
      const jsonSchema = {
        type: "object",
        properties: {
          name: { type: "string" },
        },
      };

      const result = defaultSchemaSerializer.deserialize(jsonSchema);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(jsonSchema);
      }
    });
  });

  describe("putSchema", () => {
    const testSchema = z.object({
      name: z.string(),
      email: z.string(),
    });

    it("stores a schema with auto-incrementing version", async () => {
      const result = await service.putSchema("guild-001", "form-001", testSchema);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.version).toBe(1);
        expect(result.value.key).toContain("v1.json");
        expect(result.value.createdAt).toBeInstanceOf(Date);
      }
    });

    it("increments version number on subsequent puts", async () => {
      await service.putSchema("guild-001", "form-001", testSchema);
      await service.putSchema("guild-001", "form-001", testSchema);
      const result = await service.putSchema("guild-001", "form-001", testSchema);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.version).toBe(3);
        expect(result.value.key).toContain("v3.json");
      }
    });

    it("stores optional description", async () => {
      const result = await service.putSchema(
        "guild-001",
        "form-001",
        testSchema,
        "Initial schema version",
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        // Verify by getting the schema back
        const getResult = await service.getSchema("guild-001", "form-001", 1);
        expect(getResult.ok).toBe(true);
        if (getResult.ok) {
          expect(getResult.value.metadata.description).toBe(
            "Initial schema version",
          );
        }
      }
    });

    it("rejects empty guild ID", async () => {
      const result = await service.putSchema("", "form-001", testSchema);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("INVALID_KEY");
        expect(result.error.message).toContain("guildId");
      }
    });

    it("rejects empty form ID", async () => {
      const result = await service.putSchema("guild-001", "", testSchema);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("INVALID_KEY");
        expect(result.error.message).toContain("formId");
      }
    });
  });

  describe("getSchema", () => {
    beforeEach(async () => {
      const schema = z.object({ name: z.string() });
      await service.putSchema("guild-001", "form-001", schema);
    });

    it("retrieves a specific version", async () => {
      const result = await service.getSchema("guild-001", "form-001", 1);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.metadata.version).toBe(1);
        expect(result.value.metadata.guildId).toBe("guild-001");
        expect(result.value.metadata.formId).toBe("form-001");
        expect(result.value.schema).toBeDefined();
      }
    });

    it("returns error for non-existent version", async () => {
      const result = await service.getSchema("guild-001", "form-001", 999);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("VERSION_NOT_FOUND");
      }
    });

    it("rejects invalid version number", async () => {
      const result = await service.getSchema("guild-001", "form-001", 0);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("INVALID_KEY");
        expect(result.error.message).toContain("version");
      }
    });

    it("rejects negative version number", async () => {
      const result = await service.getSchema("guild-001", "form-001", -1);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("INVALID_KEY");
      }
    });
  });

  describe("getCurrentSchema", () => {
    beforeEach(async () => {
      const schema1 = z.object({ v: z.literal(1) });
      const schema2 = z.object({ v: z.literal(2) });
      const schema3 = z.object({ v: z.literal(3) });

      await service.putSchema("guild-001", "form-001", schema1);
      await service.putSchema("guild-001", "form-001", schema2);
      await service.putSchema("guild-001", "form-001", schema3);
    });

    it("retrieves the latest version", async () => {
      const result = await service.getCurrentSchema("guild-001", "form-001");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.metadata.version).toBe(3);
      }
    });

    it("returns error for form with no schemas", async () => {
      const result = await service.getCurrentSchema("guild-001", "no-schema");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("SCHEMA_NOT_FOUND");
      }
    });
  });

  describe("listVersions", () => {
    beforeEach(async () => {
      const schema = z.object({ name: z.string() });
      await service.putSchema("guild-001", "form-001", schema);
      await service.putSchema("guild-001", "form-001", schema);
      await service.putSchema("guild-001", "form-001", schema);
    });

    it("lists all versions in order", async () => {
      const result = await service.listVersions("guild-001", "form-001");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(3);
        expect(result.value[0].version).toBe(1);
        expect(result.value[1].version).toBe(2);
        expect(result.value[2].version).toBe(3);
      }
    });

    it("returns empty array for form with no versions", async () => {
      const result = await service.listVersions("guild-001", "no-versions");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(0);
      }
    });

    it("includes size and etag for each version", async () => {
      const result = await service.listVersions("guild-001", "form-001");

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

  describe("exists", () => {
    beforeEach(async () => {
      const schema = z.object({ name: z.string() });
      await service.putSchema("guild-001", "form-001", schema);
    });

    it("returns true when schema exists", async () => {
      const result = await service.exists("guild-001", "form-001");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(true);
      }
    });

    it("returns false when schema does not exist", async () => {
      const result = await service.exists("guild-001", "no-schema");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(false);
      }
    });
  });

  describe("versionExists", () => {
    beforeEach(async () => {
      const schema = z.object({ name: z.string() });
      await service.putSchema("guild-001", "form-001", schema);
    });

    it("returns true for existing version", async () => {
      const result = await service.versionExists("guild-001", "form-001", 1);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(true);
      }
    });

    it("returns false for non-existing version", async () => {
      const result = await service.versionExists("guild-001", "form-001", 99);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(false);
      }
    });
  });

  describe("deleteVersion", () => {
    beforeEach(async () => {
      const schema = z.object({ name: z.string() });
      await service.putSchema("guild-001", "form-001", schema);
      await service.putSchema("guild-001", "form-001", schema);
    });

    it("deletes a specific version", async () => {
      const deleteResult = await service.deleteVersion("guild-001", "form-001", 1);
      expect(deleteResult.ok).toBe(true);

      const existsResult = await service.versionExists("guild-001", "form-001", 1);
      expect(existsResult.ok && existsResult.value).toBe(false);

      // Version 2 should still exist
      const existsResult2 = await service.versionExists("guild-001", "form-001", 2);
      expect(existsResult2.ok && existsResult2.value).toBe(true);
    });

    it("rejects invalid version number", async () => {
      const result = await service.deleteVersion("guild-001", "form-001", 0);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("INVALID_KEY");
      }
    });
  });

  describe("deleteAllVersions", () => {
    beforeEach(async () => {
      const schema = z.object({ name: z.string() });
      await service.putSchema("guild-001", "form-001", schema);
      await service.putSchema("guild-001", "form-001", schema);
      await service.putSchema("guild-001", "form-001", schema);
    });

    it("deletes all versions and returns count", async () => {
      const result = await service.deleteAllVersions("guild-001", "form-001");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(3);
      }

      const existsResult = await service.exists("guild-001", "form-001");
      expect(existsResult.ok && existsResult.value).toBe(false);
    });

    it("returns 0 for form with no versions", async () => {
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
      const service = new SchemaStorageService(client, { pathPrefix: "prod" });

      const schema = z.object({ name: z.string() });
      await service.putSchema("guild-001", "form-001", schema);

      // Verify the key includes the prefix
      const listResult = await client.listAll("prod/");
      expect(listResult.ok).toBe(true);
      if (listResult.ok) {
        expect(listResult.value.length).toBe(1);
        expect(listResult.value[0].key).toContain("prod/");
      }
    });
  });

  describe("isolation between forms", () => {
    it("maintains separate version counters per form", async () => {
      const schema = z.object({ name: z.string() });

      // Form 1: 3 versions
      await service.putSchema("guild-001", "form-001", schema);
      await service.putSchema("guild-001", "form-001", schema);
      await service.putSchema("guild-001", "form-001", schema);

      // Form 2: 1 version
      const result = await service.putSchema("guild-001", "form-002", schema);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.version).toBe(1); // Should be 1, not 4
      }
    });

    it("maintains separate version counters per guild", async () => {
      const schema = z.object({ name: z.string() });

      // Guild 1: 2 versions
      await service.putSchema("guild-001", "form-001", schema);
      await service.putSchema("guild-001", "form-001", schema);

      // Guild 2: 1 version
      const result = await service.putSchema("guild-002", "form-001", schema);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.version).toBe(1); // Should be 1, not 3
      }
    });
  });
});
