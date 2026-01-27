import type {
  BlockDefinition,
  BlockRegistry,
} from "@rafters/ui/components/editor";
import type { ZodObject, ZodRawShape } from "zod";
import {
  DividerPropsSchema,
  defaultDividerProps,
  defaultEmbedProps,
  defaultFormProps,
  defaultHeadingProps,
  defaultImageProps,
  defaultListProps,
  defaultParagraphProps,
  dividerDefinition,
  EmbedPropsSchema,
  embedDefinition,
  FormPropsSchema,
  formDefinition,
  HeadingPropsSchema,
  headingDefinition,
  ImagePropsSchema,
  imageDefinition,
  ListPropsSchema,
  listDefinition,
  ParagraphPropsSchema,
  paragraphDefinition,
} from "../blocks";

/**
 * Configuration for a single block type: definition, schema, and defaults.
 */
export interface BlockConfig {
  definition: BlockDefinition;
  schema: ZodObject<ZodRawShape>;
  defaults: Record<string, unknown>;
}

/**
 * Single source of truth for all PZ block types.
 * Registry, schemas, and defaults are all derived from this array.
 */
export const blockConfigs: BlockConfig[] = [
  {
    definition: headingDefinition,
    schema: HeadingPropsSchema,
    defaults: defaultHeadingProps,
  },
  {
    definition: paragraphDefinition,
    schema: ParagraphPropsSchema,
    defaults: defaultParagraphProps,
  },
  {
    definition: listDefinition,
    schema: ListPropsSchema,
    defaults: defaultListProps,
  },
  {
    definition: imageDefinition,
    schema: ImagePropsSchema,
    defaults: defaultImageProps,
  },
  {
    definition: embedDefinition,
    schema: EmbedPropsSchema,
    defaults: defaultEmbedProps,
  },
  {
    definition: dividerDefinition,
    schema: DividerPropsSchema,
    defaults: defaultDividerProps,
  },
  {
    definition: formDefinition,
    schema: FormPropsSchema,
    defaults: defaultFormProps,
  },
];

/**
 * Default block registry with all PZ block types.
 */
export const defaultRegistry: BlockRegistry = {
  blocks: blockConfigs.map((c) => c.definition),
  categories: [
    { id: "text", label: "Text", order: 1 },
    { id: "media", label: "Media", order: 2 },
    { id: "interactive", label: "Interactive", order: 3 },
  ],
};

/**
 * Mapping from block type to its Zod property schema.
 * Used by PropertyEditor to generate the editing form.
 */
export const blockSchemas: Record<
  string,
  ZodObject<ZodRawShape>
> = Object.fromEntries(
  blockConfigs.map((c) => [c.definition.type, c.schema]),
) as Record<string, ZodObject<ZodRawShape>>;

/**
 * Default property values for each block type.
 * Used when creating new blocks.
 */
export const blockDefaults: Record<
  string,
  Record<string, unknown>
> = Object.fromEntries(
  blockConfigs.map((c) => [c.definition.type, c.defaults]),
) as Record<string, Record<string, unknown>>;
