import type { BlockDefinition } from "@rafters/ui/components/editor";
import { z } from "zod/v4";

export const DividerPropsSchema = z.object({
  style: z
    .enum(["solid", "dashed", "dotted"])
    .optional()
    .describe("Line style"),
});

export type DividerProps = z.infer<typeof DividerPropsSchema>;

export const dividerDefinition: BlockDefinition = {
  type: "divider",
  label: "Divider",
  description: "Horizontal separator line",
  category: "text",
  keywords: ["hr", "separator", "line", "break"],
};

export const defaultDividerProps: DividerProps = {
  style: "solid",
};
