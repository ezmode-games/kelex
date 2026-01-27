import type { Block } from "@rafters/ui/components/editor";
import { z } from "zod/v4";

/**
 * Zod schema for a serialized block.
 * Validates the shape when deserializing from storage.
 */
export const SerializedBlockSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  props: z.record(z.string(), z.unknown()),
  children: z
    .array(
      z.object({
        id: z.string().min(1),
        type: z.string().min(1),
        props: z.record(z.string(), z.unknown()),
      }),
    )
    .optional(),
});

/**
 * Zod schema for a serialized block array (a full page).
 */
export const SerializedBlocksSchema = z.array(SerializedBlockSchema);

/**
 * Serialize a block array to a JSON string for storage.
 */
export function serializeBlocks(blocks: Block[]): string {
  return JSON.stringify(blocks);
}

/**
 * Deserialize a JSON string back to a validated block array.
 * Returns a result object with either the parsed blocks or an error.
 */
export function deserializeBlocks(
  json: string,
): { ok: true; blocks: Block[] } | { ok: false; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, error: "Invalid JSON" };
  }

  const result = SerializedBlocksSchema.safeParse(parsed);
  if (!result.success) {
    return {
      ok: false,
      error: `Invalid block data: ${result.error.message}`,
    };
  }

  return { ok: true, blocks: result.data as Block[] };
}
