import type { BlockDefinition } from "@rafters/ui/components/editor";
import { z } from "zod/v4";

export const ImagePropsSchema = z.object({
  src: z.string().describe("Image URL"),
  alt: z.string().describe("Alt text for accessibility"),
  caption: z.string().optional().describe("Caption below image"),
  alignment: z
    .enum(["left", "center", "right"])
    .optional()
    .describe("Horizontal alignment"),
});

export type ImageBlockProps = z.infer<typeof ImagePropsSchema>;

export const imageDefinition: BlockDefinition = {
  type: "image",
  label: "Image",
  description: "Image with caption and alignment",
  category: "media",
  keywords: ["photo", "picture", "img"],
};

export const defaultImageProps: ImageBlockProps = {
  src: "",
  alt: "",
  caption: undefined,
  alignment: "center",
};
