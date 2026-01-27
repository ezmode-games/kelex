import type { BlockDefinition } from "@rafters/ui/components/editor";
import { z } from "zod/v4";

export const FormPropsSchema = z.object({
  formId: z.string().describe("Form ID from the form designer"),
  title: z.string().optional().describe("Display title override"),
});

export type FormBlockProps = z.infer<typeof FormPropsSchema>;

export const formDefinition: BlockDefinition = {
  type: "form",
  label: "Form",
  description: "Embedded application form from the designer",
  category: "interactive",
  keywords: ["application", "input", "survey", "questionnaire"],
};

export const defaultFormProps: FormBlockProps = {
  formId: "",
  title: undefined,
};
