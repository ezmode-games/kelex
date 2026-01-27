import type { BlockDefinition } from "@rafters/ui/components/editor";
import { z } from "zod/v4";

export const EmbedPropsSchema = z.object({
  url: z.string().describe("Embed URL (YouTube, Vimeo, etc.)"),
  aspectRatio: z
    .enum(["16:9", "4:3", "1:1", "9:16"])
    .optional()
    .describe("Aspect ratio"),
  title: z.string().optional().describe("Title for accessibility"),
});

export type EmbedBlockProps = z.infer<typeof EmbedPropsSchema>;

export const embedDefinition: BlockDefinition = {
  type: "embed",
  label: "Embed",
  description: "YouTube, Vimeo, or Twitch video",
  category: "media",
  keywords: ["video", "youtube", "vimeo", "twitch", "iframe"],
};

export const defaultEmbedProps: EmbedBlockProps = {
  url: "",
  aspectRatio: "16:9",
  title: undefined,
};
