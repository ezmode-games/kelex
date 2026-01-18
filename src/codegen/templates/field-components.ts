import type { FieldDescriptor } from "../../introspection";
import type { ComponentConfig } from "../../mapping";

/**
 * Generates the JSX string for a field within form.Field render prop.
 */
export function generateFieldJSX(
  field: FieldDescriptor,
  config: ComponentConfig,
): string {
  const { component, componentProps, fieldProps } = config;

  const fieldPropsStr = buildFieldProps(fieldProps);
  const componentJSX = buildComponentJSX(field.name, component, componentProps);

  return `<form.Field
  name="${field.name}"
  children={(field) => (
    <Field
${fieldPropsStr}
      error={field.state.meta.errors?.[0]}
    >
${componentJSX}
    </Field>
  )}
/>`;
}

function buildFieldProps(fieldProps: ComponentConfig["fieldProps"]): string {
  const lines: string[] = [];

  lines.push(`      label="${fieldProps.label}"`);

  if (fieldProps.description) {
    lines.push(`      description="${fieldProps.description}"`);
  }

  if (fieldProps.required) {
    lines.push("      required");
  }

  return lines.join("\n");
}

function buildComponentJSX(
  fieldName: string,
  component: ComponentConfig["component"],
  props: Record<string, unknown>,
): string {
  switch (component) {
    case "Input":
      return buildInputJSX(props);
    case "Textarea":
      return buildTextareaJSX(props);
    case "Checkbox":
      return buildCheckboxJSX();
    case "Select":
      return buildSelectJSX(props);
    case "RadioGroup":
      return buildRadioGroupJSX(fieldName, props);
    case "Slider":
      return buildSliderJSX(props);
    case "DatePicker":
      return buildDatePickerJSX();
  }
}

function buildInputJSX(props: Record<string, unknown>): string {
  const propsStr = buildPropsString(props, [
    "type",
    "min",
    "max",
    "step",
    "minLength",
    "maxLength",
    "pattern",
  ]);
  return `      <Input
${propsStr}
        value={field.state.value ?? ""}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
      />`;
}

function buildTextareaJSX(props: Record<string, unknown>): string {
  const propsStr = buildPropsString(props, ["maxLength"]);
  return `      <Textarea
${propsStr}
        value={field.state.value ?? ""}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
      />`;
}

function buildCheckboxJSX(): string {
  return `      <Checkbox
        checked={field.state.value ?? false}
        onCheckedChange={(checked) => field.handleChange(checked)}
      />`;
}

function buildSelectJSX(props: Record<string, unknown>): string {
  const options = (props.options as string[]) ?? [];
  const optionItems = options
    .map(
      (opt) =>
        `          <Select.Item value="${opt}">${formatOptionLabel(opt)}</Select.Item>`,
    )
    .join("\n");

  return `      <Select value={field.state.value} onValueChange={field.handleChange}>
        <Select.Trigger>
          <Select.Value placeholder="Select..." />
        </Select.Trigger>
        <Select.Content>
${optionItems}
        </Select.Content>
      </Select>`;
}

function buildRadioGroupJSX(
  fieldName: string,
  props: Record<string, unknown>,
): string {
  const options = (props.options as string[]) ?? [];
  const radioItems = options
    .map((opt) => {
      const id = `${fieldName}-${opt}`;
      return `        <div className="flex items-center gap-2">
          <RadioGroup.Item value="${opt}" id="${id}" />
          <Label htmlFor="${id}">${formatOptionLabel(opt)}</Label>
        </div>`;
    })
    .join("\n");

  return `      <RadioGroup value={field.state.value} onValueChange={field.handleChange}>
${radioItems}
      </RadioGroup>`;
}

function buildSliderJSX(props: Record<string, unknown>): string {
  const min = props.min ?? 0;
  const max = props.max ?? 100;
  const step = props.step ?? 1;

  return `      <Slider
        value={[field.state.value ?? ${min}]}
        onValueChange={([v]) => field.handleChange(v)}
        min={${min}}
        max={${max}}
        step={${step}}
      />`;
}

function buildDatePickerJSX(): string {
  return `      <DatePicker
        value={field.state.value}
        onValueChange={field.handleChange}
      />`;
}

function buildPropsString(
  props: Record<string, unknown>,
  keys: string[],
): string {
  const lines: string[] = [];

  for (const key of keys) {
    const value = props[key];
    if (value !== undefined) {
      if (typeof value === "string") {
        lines.push(`        ${key}="${value}"`);
      } else {
        lines.push(`        ${key}={${JSON.stringify(value)}}`);
      }
    }
  }

  return lines.join("\n");
}

function formatOptionLabel(value: string): string {
  // Convert camelCase/snake_case to Title Case
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/^./, (s) => s.toUpperCase());
}
