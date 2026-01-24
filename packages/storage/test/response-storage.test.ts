import { describe, expect, it, beforeEach } from "vitest";
import { R2Client } from "../src/r2-client";
import {
  ResponseStorageService,
  createResponseStorageService,
  type CreateResponseInput,
} from "../src/response-storage";
import { createMockBucket } from "./test-utils";

describe("ResponseStorageService", () => {
  let client: R2Client;
  let service: ResponseStorageService;

  beforeEach(() => {
    const { bucket } = createMockBucket();
    client = new R2Client(bucket);
    service = new ResponseStorageService(client);
  });

  describe("createResponseStorageService", () => {
    it("creates a ResponseStorageService instance", () => {
      const { bucket } = createMockBucket();
      const client = new R2Client(bucket);
      const service = createResponseStorageService(client);
      expect(service).toBeInstanceOf(ResponseStorageService);
    });

    it("accepts configuration with path prefix", () => {
      const { bucket } = createMockBucket();
      const client = new R2Client(bucket);
      const service = createResponseStorageService(client, {
        pathPrefix: "test-prefix",
      });
      expect(service).toBeInstanceOf(ResponseStorageService);
    });
  });

  describe("create", () => {
    const validInput: CreateResponseInput = {
      id: "resp-001",
      formId: "form-001",
      guildId: "guild-001",
      schemaVersion: 1,
      data: { name: "John", email: "john@example.com" },
    };

    it("creates a new response with pending status", async () => {
      const result = await service.create(validInput);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe("resp-001");
        expect(result.value.formId).toBe("form-001");
        expect(result.value.guildId).toBe("guild-001");
        expect(result.value.schemaVersion).toBe(1);
        expect(result.value.status).toBe("pending");
        expect(result.value.data).toEqual(validInput.data);
        expect(result.value.createdAt).toBeInstanceOf(Date);
        expect(result.value.updatedAt).toBeInstanceOf(Date);
      }
    });

    it("stores optional submitter ID", async () => {
      const input = { ...validInput, submitterId: "user-123" };
      const result = await service.create(input);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.submitterId).toBe("user-123");
      }
    });

    it("rejects empty response ID", async () => {
      const input = { ...validInput, id: "" };
      const result = await service.create(input);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("VALIDATION_ERROR");
        expect(result.error.message).toContain("ID");
      }
    });

    it("rejects empty form ID", async () => {
      const input = { ...validInput, formId: "" };
      const result = await service.create(input);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("VALIDATION_ERROR");
        expect(result.error.message).toContain("Form");
      }
    });

    it("rejects empty guild ID", async () => {
      const input = { ...validInput, guildId: "" };
      const result = await service.create(input);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("VALIDATION_ERROR");
        expect(result.error.message).toContain("Guild");
      }
    });

    it("rejects invalid schema version", async () => {
      const input = { ...validInput, schemaVersion: 0 };
      const result = await service.create(input);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("VALIDATION_ERROR");
        expect(result.error.message).toContain("Schema version");
      }
    });

    it("rejects negative schema version", async () => {
      const input = { ...validInput, schemaVersion: -1 };
      const result = await service.create(input);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("VALIDATION_ERROR");
      }
    });
  });

  describe("get", () => {
    beforeEach(async () => {
      await service.create({
        id: "resp-001",
        formId: "form-001",
        guildId: "guild-001",
        schemaVersion: 1,
        data: { name: "Test" },
      });
    });

    it("retrieves an existing response", async () => {
      const result = await service.get("guild-001", "form-001", "resp-001");

      expect(result.ok).toBe(true);
      if (result.ok && result.value) {
        expect(result.value.id).toBe("resp-001");
        expect(result.value.data).toEqual({ name: "Test" });
      }
    });

    it("returns null for non-existent response", async () => {
      const result = await service.get("guild-001", "form-001", "non-existent");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeNull();
      }
    });
  });

  describe("updateStatus", () => {
    beforeEach(async () => {
      await service.create({
        id: "resp-001",
        formId: "form-001",
        guildId: "guild-001",
        schemaVersion: 1,
        data: { name: "Test" },
      });
    });

    it("updates status to accepted", async () => {
      const result = await service.updateStatus({
        guildId: "guild-001",
        formId: "form-001",
        responseId: "resp-001",
        status: "accepted",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.status).toBe("accepted");
      }
    });

    it("updates status to rejected with reviewer info", async () => {
      const result = await service.updateStatus({
        guildId: "guild-001",
        formId: "form-001",
        responseId: "resp-001",
        status: "rejected",
        reviewerId: "admin-001",
        reviewNotes: "Does not meet requirements",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.status).toBe("rejected");
        expect(result.value.reviewerId).toBe("admin-001");
        expect(result.value.reviewNotes).toBe("Does not meet requirements");
      }
    });

    it("updates the updatedAt timestamp", async () => {
      const getBefore = await service.get("guild-001", "form-001", "resp-001");
      const beforeTime = getBefore.ok && getBefore.value?.updatedAt;

      // Small delay to ensure time difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      const result = await service.updateStatus({
        guildId: "guild-001",
        formId: "form-001",
        responseId: "resp-001",
        status: "accepted",
      });

      expect(result.ok).toBe(true);
      if (result.ok && beforeTime) {
        expect(result.value.updatedAt.getTime()).toBeGreaterThanOrEqual(
          beforeTime.getTime(),
        );
      }
    });

    it("returns error for non-existent response", async () => {
      const result = await service.updateStatus({
        guildId: "guild-001",
        formId: "form-001",
        responseId: "non-existent",
        status: "accepted",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("NOT_FOUND");
      }
    });
  });

  describe("delete", () => {
    beforeEach(async () => {
      await service.create({
        id: "resp-001",
        formId: "form-001",
        guildId: "guild-001",
        schemaVersion: 1,
        data: { name: "Test" },
      });
    });

    it("deletes an existing response", async () => {
      const deleteResult = await service.delete(
        "guild-001",
        "form-001",
        "resp-001",
      );
      expect(deleteResult.ok).toBe(true);

      const getResult = await service.get("guild-001", "form-001", "resp-001");
      expect(getResult.ok).toBe(true);
      if (getResult.ok) {
        expect(getResult.value).toBeNull();
      }
    });

    it("succeeds for non-existent response", async () => {
      const result = await service.delete(
        "guild-001",
        "form-001",
        "non-existent",
      );
      expect(result.ok).toBe(true);
    });
  });

  describe("exists", () => {
    beforeEach(async () => {
      await service.create({
        id: "resp-001",
        formId: "form-001",
        guildId: "guild-001",
        schemaVersion: 1,
        data: { name: "Test" },
      });
    });

    it("returns true for existing response", async () => {
      const result = await service.exists("guild-001", "form-001", "resp-001");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(true);
      }
    });

    it("returns false for non-existent response", async () => {
      const result = await service.exists(
        "guild-001",
        "form-001",
        "non-existent",
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(false);
      }
    });
  });

  describe("list", () => {
    beforeEach(async () => {
      // Create multiple responses with different statuses
      await service.create({
        id: "resp-001",
        formId: "form-001",
        guildId: "guild-001",
        schemaVersion: 1,
        data: { name: "Response 1" },
      });
      await service.create({
        id: "resp-002",
        formId: "form-001",
        guildId: "guild-001",
        schemaVersion: 1,
        data: { name: "Response 2" },
      });
      await service.create({
        id: "resp-003",
        formId: "form-001",
        guildId: "guild-001",
        schemaVersion: 1,
        data: { name: "Response 3" },
      });

      // Update statuses
      await service.updateStatus({
        guildId: "guild-001",
        formId: "form-001",
        responseId: "resp-002",
        status: "accepted",
      });
      await service.updateStatus({
        guildId: "guild-001",
        formId: "form-001",
        responseId: "resp-003",
        status: "rejected",
      });
    });

    it("lists all responses for a form", async () => {
      const result = await service.list("guild-001", "form-001");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.items).toHaveLength(3);
      }
    });

    it("filters by status", async () => {
      const result = await service.list("guild-001", "form-001", {
        status: "pending",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.items).toHaveLength(1);
        expect(result.value.items[0].id).toBe("resp-001");
      }
    });

    it("respects limit", async () => {
      const result = await service.list("guild-001", "form-001", { limit: 2 });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.items).toHaveLength(2);
        expect(result.value.hasMore).toBe(true);
      }
    });

    it("returns empty array for form with no responses", async () => {
      const result = await service.list("guild-001", "empty-form");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.items).toHaveLength(0);
        expect(result.value.hasMore).toBe(false);
      }
    });
  });

  describe("count", () => {
    beforeEach(async () => {
      await service.create({
        id: "resp-001",
        formId: "form-001",
        guildId: "guild-001",
        schemaVersion: 1,
        data: { name: "Response 1" },
      });
      await service.create({
        id: "resp-002",
        formId: "form-001",
        guildId: "guild-001",
        schemaVersion: 1,
        data: { name: "Response 2" },
      });

      await service.updateStatus({
        guildId: "guild-001",
        formId: "form-001",
        responseId: "resp-002",
        status: "accepted",
      });
    });

    it("counts all responses", async () => {
      const result = await service.count("guild-001", "form-001");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(2);
      }
    });

    it("counts responses by status", async () => {
      const pendingCount = await service.count(
        "guild-001",
        "form-001",
        "pending",
      );
      const acceptedCount = await service.count(
        "guild-001",
        "form-001",
        "accepted",
      );

      expect(pendingCount.ok && pendingCount.value).toBe(1);
      expect(acceptedCount.ok && acceptedCount.value).toBe(1);
    });

    it("returns 0 for form with no responses", async () => {
      const result = await service.count("guild-001", "empty-form");

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
      const service = new ResponseStorageService(client, {
        pathPrefix: "prod",
      });

      await service.create({
        id: "resp-001",
        formId: "form-001",
        guildId: "guild-001",
        schemaVersion: 1,
        data: { name: "Test" },
      });

      // Verify the key includes the prefix
      const listResult = await client.listAll("prod/");
      expect(listResult.ok).toBe(true);
      if (listResult.ok) {
        expect(listResult.value.length).toBe(1);
        expect(listResult.value[0].key).toContain("prod/");
      }
    });
  });
});
