import type { BlockDefinition } from "@rafters/ui/components/editor";
import { z } from "zod/v4";

export const ListPropsSchema = z.object({
  items: z.array(z.string()).describe("List items"),
  ordered: z.boolean().describe("Use numbered list"),
});

export type ListProps = z.infer<typeof ListPropsSchema>;

export const listDefinition: BlockDefinition = {
  type: "list",
  label: "List",
  description: "Ordered or unordered list",
  category: "text",
  keywords: ["bullet", "numbered", "items", "ul", "ol"],
};

export const defaultListProps: ListProps = {
  items: ["Item 1"],
  ordered: false,
};
