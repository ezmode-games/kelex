import { describe, expect, it } from "vitest";
import {
  BaseBlockPropsSchema,
  BlockSchema,
  ClipboardContentSchema,
  DocumentMetaSchema,
  DocumentOperationSchema,
  DocumentSchema,
  SelectionStateSchema,
  UUIDv7Schema,
  createDocumentError,
  err,
  ok,
} from "../../src/model/types";
import { uuidv7 } from "uuidv7";

describe("Result type utilities", () => {
  describe("ok", () => {
    it("creates a success result with value", () => {
      const result = ok("test value");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe("test value");
      }
    });

    it("works with complex types", () => {
      const result = ok({ id: "123", name: "Test" });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual({ id: "123", name: "Test" });
      }
    });
  });

  describe("err", () => {
    it("creates an error result", () => {
      const error = createDocumentError("BLOCK_NOT_FOUND", "Block not found");
      const result = err(error);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("BLOCK_NOT_FOUND");
        expect(result.error.message).toBe("Block not found");
      }
    });

    it("includes cause when provided", () => {
      const cause = new Error("Original error");
      const error = createDocumentError("VALIDATION_ERROR", "Validation failed", cause);
      expect(error.cause).toBe(cause);
    });
  });
});

describe("UUIDv7Schema", () => {
  it("accepts valid UUIDv7", () => {
    const id = uuidv7();
    const result = UUIDv7Schema.safeParse(id);
    expect(result.success).toBe(true);
  });

  it("rejects UUIDv4", () => {
    // UUIDv4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    const uuidv4 = "550e8400-e29b-41d4-a716-446655440000";
    const result = UUIDv7Schema.safeParse(uuidv4);
    expect(result.success).toBe(false);
  });

  it("rejects invalid format", () => {
    const result = UUIDv7Schema.safeParse("not-a-uuid");
    expect(result.success).toBe(false);
  });

  it("rejects empty string", () => {
    const result = UUIDv7Schema.safeParse("");
    expect(result.success).toBe(false);
  });
});

describe("BaseBlockPropsSchema", () => {
  it("accepts empty object", () => {
    const result = BaseBlockPropsSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts className", () => {
    const result = BaseBlockPropsSchema.safeParse({ className: "my-class" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.className).toBe("my-class");
    }
  });

  it("accepts style with string values", () => {
    const result = BaseBlockPropsSchema.safeParse({
      style: { color: "red", background: "blue" },
    });
    expect(result.success).toBe(true);
  });

  it("accepts style with number values", () => {
    const result = BaseBlockPropsSchema.safeParse({
      style: { width: 100, height: 200 },
    });
    expect(result.success).toBe(true);
  });

  it("accepts dataAttributes", () => {
    const result = BaseBlockPropsSchema.safeParse({
      dataAttributes: { testid: "block-1", custom: "value" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid style values", () => {
    const result = BaseBlockPropsSchema.safeParse({
      style: { invalid: { nested: "object" } },
    });
    expect(result.success).toBe(false);
  });
});

describe("BlockSchema", () => {
  it("accepts valid block", () => {
    const block = {
      id: uuidv7(),
      type: "paragraph",
      props: { content: "Hello world" },
    };
    const result = BlockSchema.safeParse(block);
    expect(result.success).toBe(true);
  });

  it("accepts block with children", () => {
    const block = {
      id: uuidv7(),
      type: "section",
      props: {},
      children: [
        {
          id: uuidv7(),
          type: "paragraph",
          props: { content: "Nested content" },
        },
      ],
    };
    const result = BlockSchema.safeParse(block);
    expect(result.success).toBe(true);
  });

  it("accepts deeply nested blocks", () => {
    const block = {
      id: uuidv7(),
      type: "section",
      props: {},
      children: [
        {
          id: uuidv7(),
          type: "section",
          props: {},
          children: [
            {
              id: uuidv7(),
              type: "paragraph",
              props: { content: "Deep" },
            },
          ],
        },
      ],
    };
    const result = BlockSchema.safeParse(block);
    expect(result.success).toBe(true);
  });

  it("rejects block without id", () => {
    const block = {
      type: "paragraph",
      props: {},
    };
    const result = BlockSchema.safeParse(block);
    expect(result.success).toBe(false);
  });

  it("rejects block with empty type", () => {
    const block = {
      id: uuidv7(),
      type: "",
      props: {},
    };
    const result = BlockSchema.safeParse(block);
    expect(result.success).toBe(false);
  });
});

describe("DocumentMetaSchema", () => {
  it("accepts minimal metadata", () => {
    const meta = {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 0,
    };
    const result = DocumentMetaSchema.safeParse(meta);
    expect(result.success).toBe(true);
  });

  it("accepts full metadata", () => {
    const meta = {
      title: "My Document",
      description: "A test document",
      authorId: "user-123",
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 5,
      custom: { key: "value" },
    };
    const result = DocumentMetaSchema.safeParse(meta);
    expect(result.success).toBe(true);
  });

  it("coerces date strings", () => {
    const meta = {
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-02T00:00:00Z",
      version: 0,
    };
    const result = DocumentMetaSchema.safeParse(meta);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.createdAt).toBeInstanceOf(Date);
    }
  });

  it("rejects negative version", () => {
    const meta = {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: -1,
    };
    const result = DocumentMetaSchema.safeParse(meta);
    expect(result.success).toBe(false);
  });
});

describe("DocumentSchema", () => {
  it("accepts valid document", () => {
    const doc = {
      id: uuidv7(),
      blocks: [
        {
          id: uuidv7(),
          type: "paragraph",
          props: { content: "Hello" },
        },
      ],
      meta: {
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 0,
      },
    };
    const result = DocumentSchema.safeParse(doc);
    expect(result.success).toBe(true);
  });

  it("accepts empty blocks array", () => {
    const doc = {
      id: uuidv7(),
      blocks: [],
      meta: {
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 0,
      },
    };
    const result = DocumentSchema.safeParse(doc);
    expect(result.success).toBe(true);
  });

  it("rejects document without id", () => {
    const doc = {
      blocks: [],
      meta: {
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 0,
      },
    };
    const result = DocumentSchema.safeParse(doc);
    expect(result.success).toBe(false);
  });
});

describe("SelectionStateSchema", () => {
  it("accepts null blockId", () => {
    const result = SelectionStateSchema.safeParse({ blockId: null });
    expect(result.success).toBe(true);
  });

  it("accepts blockId with positions", () => {
    const result = SelectionStateSchema.safeParse({
      blockId: "block-123",
      anchor: 0,
      focus: 10,
    });
    expect(result.success).toBe(true);
  });
});

describe("ClipboardContentSchema", () => {
  it("accepts blocks type", () => {
    const content = {
      type: "blocks",
      blocks: [
        {
          id: uuidv7(),
          type: "paragraph",
          props: { content: "Copied" },
        },
      ],
    };
    const result = ClipboardContentSchema.safeParse(content);
    expect(result.success).toBe(true);
  });

  it("accepts text type", () => {
    const content = {
      type: "text",
      text: "Copied text",
    };
    const result = ClipboardContentSchema.safeParse(content);
    expect(result.success).toBe(true);
  });

  it("rejects invalid type", () => {
    const content = {
      type: "invalid",
    };
    const result = ClipboardContentSchema.safeParse(content);
    expect(result.success).toBe(false);
  });
});

describe("DocumentOperationSchema", () => {
  it("validates INSERT_BLOCK operation", () => {
    const op = {
      type: "INSERT_BLOCK",
      block: {
        id: uuidv7(),
        type: "paragraph",
        props: {},
      },
      index: 0,
    };
    const result = DocumentOperationSchema.safeParse(op);
    expect(result.success).toBe(true);
  });

  it("validates DELETE_BLOCK operation", () => {
    const op = {
      type: "DELETE_BLOCK",
      blockId: "block-123",
    };
    const result = DocumentOperationSchema.safeParse(op);
    expect(result.success).toBe(true);
  });

  it("validates MOVE_BLOCK operation", () => {
    const op = {
      type: "MOVE_BLOCK",
      blockId: "block-123",
      newIndex: 2,
    };
    const result = DocumentOperationSchema.safeParse(op);
    expect(result.success).toBe(true);
  });

  it("validates UPDATE_BLOCK_PROPS operation", () => {
    const op = {
      type: "UPDATE_BLOCK_PROPS",
      blockId: "block-123",
      props: { content: "Updated" },
    };
    const result = DocumentOperationSchema.safeParse(op);
    expect(result.success).toBe(true);
  });

  it("validates SET_BLOCK_CHILDREN operation", () => {
    const op = {
      type: "SET_BLOCK_CHILDREN",
      blockId: "block-123",
      children: [],
    };
    const result = DocumentOperationSchema.safeParse(op);
    expect(result.success).toBe(true);
  });

  it("validates UPDATE_META operation", () => {
    const op = {
      type: "UPDATE_META",
      meta: { title: "New Title" },
    };
    const result = DocumentOperationSchema.safeParse(op);
    expect(result.success).toBe(true);
  });

  it("rejects invalid operation type", () => {
    const op = {
      type: "INVALID_OP",
      data: {},
    };
    const result = DocumentOperationSchema.safeParse(op);
    expect(result.success).toBe(false);
  });
});
