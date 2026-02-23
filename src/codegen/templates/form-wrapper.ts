import type { FieldDescriptor, FormDescriptor } from "../../introspection";
import type { ComponentConfig, ComponentType } from "../../mapping";
import { generateFieldJSX } from "./field-components";

export interface FormTemplateInput {
  form: FormDescriptor;
  fieldConfigs: Map<string, ComponentConfig>;
  uiImportPath: string;
}

/**
 * Generates the complete form component file content.
 */
export function generateFormFile(input: FormTemplateInput): string {
  const { form, fieldConfigs, uiImportPath } = input;

  const imports = generateImports(form, fieldConfigs, uiImportPath);
  const typeName = inferTypeName(form.schemaExportName);
  const propsInterface = generatePropsInterface(form.name, typeName);
  const defaultValues = generateDefaultValues(form.fields, fieldConfigs);
  const fieldJSX = generateAllFieldsJSX(form.fields, fieldConfigs);

  return `'use client';

${imports}

${propsInterface}

export function ${form.name}({ defaultValues: initialValues, onSubmit }: ${form.name}Props) {
  const form = useForm({
    defaultValues: initialValues ?? {
${defaultValues}
    },
    validators: {
      onSubmit: ${form.schemaExportName},
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="flex flex-col gap-4"
    >
${fieldJSX}

      <Button type="submit">Submit</Button>
    </form>
  );
}
`;
}

function generateImports(
  form: FormDescriptor,
  fieldConfigs: Map<string, ComponentConfig>,
  uiImportPath: string,
): string {
  const lines: string[] = [];

  // TanStack Form import
  lines.push("import { useForm } from '@tanstack/react-form';");

  // UI component imports
  const usedComponents = getUsedComponents(fieldConfigs);
  const uiImports = buildUIImports(usedComponents);
  lines.push(`import {\n${uiImports}\n} from '${uiImportPath}';`);

  // Schema import
  const typeName = inferTypeName(form.schemaExportName);
  lines.push(
    `import { ${form.schemaExportName}, type ${typeName} } from '${form.schemaImportPath}';`,
  );

  return lines.join("\n");
}

/**
 * Recursively collects all component types used across all field configs.
 */
function getUsedComponents(
  fieldConfigs: Map<string, ComponentConfig>,
): Set<ComponentType> {
  const components = new Set<ComponentType>();

  for (const config of fieldConfigs.values()) {
    collectComponents(config, components);
  }

  return components;
}

function collectComponents(
  config: ComponentConfig,
  components: Set<ComponentType>,
): void {
  components.add(config.component);

  // Recurse into child configs for composite types
  const props = config.componentProps;

  if (props.childConfigs instanceof Map) {
    for (const child of (
      props.childConfigs as Map<string, ComponentConfig>
    ).values()) {
      collectComponents(child, components);
    }
  }

  if (props.elementConfig && typeof props.elementConfig === "object") {
    collectComponents(props.elementConfig as ComponentConfig, components);
  }

  if (Array.isArray(props.variantConfigs)) {
    for (const variant of props.variantConfigs as {
      configs: Map<string, ComponentConfig>;
    }[]) {
      for (const vConfig of variant.configs.values()) {
        collectComponents(vConfig, components);
      }
    }
  }
}

function buildUIImports(usedComponents: Set<ComponentType>): string {
  const imports: string[] = [];

  // Always include Field wrapper and Button (submit)
  imports.push("  Button,");
  imports.push("  Field,");

  // Add used components (skip composite pseudo-types that don't map to imports)
  const compositeTypes = new Set(["Fieldset", "FieldArray", "UnionSwitch"]);
  for (const component of usedComponents) {
    if (!compositeTypes.has(component)) {
      imports.push(`  ${component},`);
    }
  }

  // Include Label if RadioGroup is used
  if (usedComponents.has("RadioGroup")) {
    imports.push("  Label,");
  }

  // Include Select if UnionSwitch is used (union discriminator uses Select)
  if (usedComponents.has("UnionSwitch") && !usedComponents.has("Select")) {
    imports.push("  Select,");
  }

  // Include Input if FieldArray is used (simple arrays use Input)
  if (usedComponents.has("FieldArray") && !usedComponents.has("Input")) {
    imports.push("  Input,");
  }

  // Include Card components if any composite types are used
  const hasComposite = [...usedComponents].some((c) => compositeTypes.has(c));
  if (hasComposite) {
    imports.push("  Card,");
    imports.push("  CardContent,");
    imports.push("  CardHeader,");
    imports.push("  CardTitle,");
  }

  // Sort all imports alphabetically for consistent output
  return imports.sort().join("\n");
}

/**
 * Infers TypeScript type name from schema export name.
 * userSchema -> User
 * profileSchema -> Profile
 */
function inferTypeName(schemaExportName: string): string {
  const stripped = schemaExportName.replace(/Schema$/i, "");

  if (stripped.trim().length === 0) {
    return "Schema";
  }

  return stripped.replace(/^./, (s) => s.toUpperCase());
}

function generatePropsInterface(formName: string, typeName: string): string {
  return `interface ${formName}Props {
  defaultValues?: Partial<${typeName}>;
  onSubmit: (data: ${typeName}) => void | Promise<void>;
}`;
}

function generateDefaultValues(
  fields: FieldDescriptor[],
  fieldConfigs: Map<string, ComponentConfig>,
  indentLevel = 3,
): string {
  const lines: string[] = [];
  const pad = " ".repeat(indentLevel * 2);

  for (const field of fields) {
    const config = fieldConfigs.get(field.name);
    const defaultValue = getDefaultValueForField(field, config, indentLevel);
    lines.push(`${pad}${field.name}: ${defaultValue},`);
  }

  return lines.join("\n");
}

function getDefaultValueForField(
  field: FieldDescriptor,
  config: ComponentConfig | undefined,
  indentLevel: number,
): string {
  switch (field.type) {
    case "string":
      return '""';
    case "number": {
      const min = config?.componentProps.min;
      return typeof min === "number" ? String(min) : "0";
    }
    case "boolean":
      return "false";
    case "date":
      return "undefined";
    case "enum": {
      if (field.metadata.kind === "enum" && field.metadata.values.length > 0) {
        return JSON.stringify(field.metadata.values[0]);
      }
      return '""';
    }
    case "object": {
      if (field.metadata.kind === "object") {
        const childConfigs = config?.componentProps.childConfigs as
          | Map<string, ComponentConfig>
          | undefined;
        if (childConfigs && field.metadata.fields.length > 0) {
          const innerPad = " ".repeat((indentLevel + 1) * 2);
          const closePad = " ".repeat(indentLevel * 2);
          const childLines: string[] = [];
          for (const child of field.metadata.fields) {
            const childConfig = childConfigs.get(child.name);
            const val = getDefaultValueForField(
              child,
              childConfig,
              indentLevel + 1,
            );
            childLines.push(`${innerPad}${child.name}: ${val},`);
          }
          return `{\n${childLines.join("\n")}\n${closePad}}`;
        }
      }
      return "{}";
    }
    case "array":
      return "[]";
    case "union":
      return "{}";
    case "tuple": {
      if (field.metadata.kind === "tuple") {
        const elements = field.metadata.elements.map((elem) =>
          getDefaultValueForField(elem, undefined, indentLevel),
        );
        return `[${elements.join(", ")}]`;
      }
      return "[]";
    }
    case "record":
      return "{}";
    default:
      return "undefined";
  }
}

function generateAllFieldsJSX(
  fields: FieldDescriptor[],
  fieldConfigs: Map<string, ComponentConfig>,
): string {
  const fieldJSXs: string[] = [];

  for (const field of fields) {
    const config = fieldConfigs.get(field.name);
    if (config) {
      const jsx = generateFieldJSX(field, config);
      // Indent each line by 6 spaces for proper form structure
      const indented = jsx
        .split("\n")
        .map((line) => `      ${line}`)
        .join("\n");
      fieldJSXs.push(indented);
    }
  }

  return fieldJSXs.join("\n\n");
}

export { inferTypeName };
