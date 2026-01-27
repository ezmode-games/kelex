import type { BlockDefinition } from "@rafters/ui/components/editor";
import { z } from "zod/v4";

export const HeadingPropsSchema = z.object({
  text: z.string().describe("Heading text"),
  level: z.enum(["h1", "h2", "h3", "h4"]).describe("Heading level"),
});

export type HeadingProps = z.infer<typeof HeadingPropsSchema>;

export const headingDefinition: BlockDefinition = {
  type: "heading",
  label: "Heading",
  description: "Section heading (H1-H4)",
  category: "text",
  keywords: ["title", "header", "h1", "h2", "h3", "h4"],
};

export const defaultHeadingProps: HeadingProps = {
  text: "Heading",
  level: "h2",
};
