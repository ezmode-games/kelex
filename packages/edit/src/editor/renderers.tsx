import type { Block, BlockRenderContext } from "@rafters/ui/components/editor";
import type * as React from "react";
import type { DividerProps } from "../blocks/divider";
import type { EmbedBlockProps } from "../blocks/embed";
import type { FormBlockProps } from "../blocks/form";
import type { HeadingProps } from "../blocks/heading";
import type { ImageBlockProps } from "../blocks/image";
import type { ListProps } from "../blocks/list";
import type { ParagraphProps } from "../blocks/paragraph";

/**
 * Render a heading block.
 */
function HeadingRenderer({
  props,
}: {
  props: HeadingProps;
}): React.JSX.Element {
  const Tag = props.level as keyof React.JSX.IntrinsicElements;
  const sizeClasses: Record<string, string> = {
    h1: "text-4xl font-bold",
    h2: "text-3xl font-semibold",
    h3: "text-2xl font-semibold",
    h4: "text-xl font-medium",
  };
  return <Tag className={sizeClasses[props.level]}>{props.text}</Tag>;
}

/**
 * Render a paragraph block.
 */
function ParagraphRenderer({
  props,
}: {
  props: ParagraphProps;
}): React.JSX.Element {
  return (
    <p className="text-base leading-7">
      {props.text || (
        <span className="text-muted-foreground italic">Empty paragraph</span>
      )}
    </p>
  );
}

/**
 * Render a list block.
 */
function ListRenderer({ props }: { props: ListProps }): React.JSX.Element {
  const Tag = props.ordered ? "ol" : "ul";
  const listClass = props.ordered ? "list-decimal" : "list-disc";
  return (
    <Tag className={`${listClass} pl-6 space-y-1`}>
      {props.items.map((item, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: list items are simple strings without stable IDs
        <li key={i} className="text-base">
          {item}
        </li>
      ))}
    </Tag>
  );
}

/**
 * Render an image block.
 */
function ImageRenderer({
  props,
}: {
  props: ImageBlockProps;
}): React.JSX.Element {
  if (!props.src) {
    return (
      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center text-muted-foreground">
        No image selected
      </div>
    );
  }

  const alignClass: Record<string, string> = {
    left: "mr-auto",
    center: "mx-auto",
    right: "ml-auto",
  };

  return (
    <figure className={alignClass[props.alignment ?? "center"]}>
      <img src={props.src} alt={props.alt} className="rounded-lg max-w-full" />
      {props.caption && (
        <figcaption className="text-sm text-muted-foreground mt-2 text-center">
          {props.caption}
        </figcaption>
      )}
    </figure>
  );
}

/**
 * Render an embed block.
 */
function EmbedRenderer({
  props,
}: {
  props: EmbedBlockProps;
}): React.JSX.Element {
  if (!props.url) {
    return (
      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center text-muted-foreground">
        No embed URL provided
      </div>
    );
  }

  const aspectClasses: Record<string, string> = {
    "16:9": "aspect-video",
    "4:3": "aspect-[4/3]",
    "1:1": "aspect-square",
    "9:16": "aspect-[9/16]",
  };

  return (
    <div
      className={`${aspectClasses[props.aspectRatio ?? "16:9"]} bg-muted rounded-lg flex items-center justify-center`}
    >
      <span className="text-sm text-muted-foreground">{props.url}</span>
    </div>
  );
}

/**
 * Render a divider block.
 */
function DividerRenderer({
  props,
}: {
  props: DividerProps;
}): React.JSX.Element {
  const styleMap: Record<string, string> = {
    solid: "border-solid",
    dashed: "border-dashed",
    dotted: "border-dotted",
  };
  return (
    <hr
      className={`border-t ${styleMap[props.style ?? "solid"]} border-border my-2`}
    />
  );
}

/**
 * Render a form block (placeholder in editor).
 */
function FormRenderer({ props }: { props: FormBlockProps }): React.JSX.Element {
  return (
    <div className="border border-border rounded-lg p-6 bg-muted/50">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-medium">Form:</span>
        <span>{props.title ?? (props.formId || "No form selected")}</span>
      </div>
    </div>
  );
}

/**
 * Renderers map from block type to component.
 */
const renderers = {
  heading: HeadingRenderer,
  paragraph: ParagraphRenderer,
  list: ListRenderer,
  image: ImageRenderer,
  embed: EmbedRenderer,
  divider: DividerRenderer,
  form: FormRenderer,
} as unknown as Record<
  string,
  React.ComponentType<{ props: Record<string, unknown> }>
>;

/**
 * Render a block based on its type.
 * Falls back to a "unknown type" placeholder if no renderer found.
 */
export function renderBlockContent(
  block: Block,
  _context: BlockRenderContext,
): React.JSX.Element {
  const Renderer = renderers[block.type];
  if (!Renderer) {
    return (
      <div className="border border-destructive/50 rounded p-4 text-sm text-destructive">
        Unknown block type: {block.type}
      </div>
    );
  }
  return <Renderer props={block.props} />;
}
