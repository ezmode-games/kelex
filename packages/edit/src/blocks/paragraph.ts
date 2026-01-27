import type { BlockDefinition } from "@rafters/ui/components/editor";
import { z } from "zod/v4";

export const ParagraphPropsSchema = z.object({
  text: z.string().describe("Paragraph text"),
});

export type ParagraphProps = z.infer<typeof ParagraphPropsSchema>;

export const paragraphDefinition: BlockDefinition = {
  type: "paragraph",
  label: "Paragraph",
  description: "Text paragraph",
  category: "text",
  keywords: ["text", "body", "content"],
};

export const defaultParagraphProps: ParagraphProps = {
  text: "",
};
