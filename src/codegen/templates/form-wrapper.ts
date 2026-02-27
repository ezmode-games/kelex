import type {
  FieldDescriptor,
  FormDescriptor,
  FormStep,
} from "../../introspection";
import type { ComponentConfig, ComponentType } from "../../mapping";
import { generateFieldJSX } from "./field-components";

export interface FormTemplateInput {
  form: FormDescriptor;
  fieldConfigs: Map<string, ComponentConfig>;
  uiImportPath: string;
}

/**
 * Generates the complete form component file content.
 * When `form.steps` is defined, delegates to wizard form generation.
 */
export function generateFormFile(input: FormTemplateInput): string {
  const { form } = input;

  if (form.steps && form.steps.length > 0) {
    return generateWizardFormFile(input);
  }

  return generateSingleStepFormFile(input);
}

/**
 * Generates a single-step form component (original behavior).
 */
function generateSingleStepFormFile(input: FormTemplateInput): string {
  const { form, fieldConfigs, uiImportPath } = input;

  const imports = generateImports(form, fieldConfigs, uiImportPath, false);
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

/**
 * Generates a multi-step wizard form component.
 * Renders a step progress indicator, per-step field groups with Card containers,
 * and Next/Back/Submit navigation with per-step validation.
 */
function generateWizardFormFile(input: FormTemplateInput): string {
  const { form, fieldConfigs, uiImportPath } = input;
  const steps = form.steps as FormStep[];

  const imports = generateImports(form, fieldConfigs, uiImportPath, true);
  const typeName = inferTypeName(form.schemaExportName);
  const propsInterface = generatePropsInterface(form.name, typeName);
  const defaultValues = generateDefaultValues(form.fields, fieldConfigs);
  const stepsConst = generateStepsConstant(steps);
  const stepContentBlocks = generateStepContentBlocks(
    steps,
    form.fields,
    fieldConfigs,
  );

  return `'use client';

${imports}

${propsInterface}

${stepsConst}

export function ${form.name}({ defaultValues: initialValues, onSubmit }: ${form.name}Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const isLastStep = currentStep === STEPS.length - 1;

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

  async function handleNext() {
    const stepFields = STEPS[currentStep].fields;
    let hasErrors = false;
    for (const fieldName of stepFields) {
      await form.validateField(fieldName, 'change');
      if (form.getFieldMeta(fieldName)?.errors?.length) {
        hasErrors = true;
      }
    }
    if (!hasErrors) {
      setCurrentStep((s) => s + 1);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="flex flex-col gap-4"
    >
      {/* Step indicator */}
      <div className="flex items-center gap-2" role="tablist" aria-label="Form steps">
        {STEPS.map((step, i) => (
          <div key={step.id} className="flex items-center gap-2" role="tab" aria-selected={i === currentStep}>
            <div className={\`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium \${i === currentStep ? "bg-gray-900 text-white dark:bg-gray-50 dark:text-gray-900" : i < currentStep ? "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200" : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"}\`}>
              {i + 1}
            </div>
            <span className={\`text-sm \${i === currentStep ? "font-medium" : "text-gray-500"}\`}>{step.label}</span>
            {i < STEPS.length - 1 && <div className="h-px w-8 bg-gray-200 dark:bg-gray-700" />}
          </div>
        ))}
      </div>

      {/* Step content */}
      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep].label}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
${stepContentBlocks}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        {currentStep > 0 && (
          <Button type="button" variant="outline" onClick={() => setCurrentStep((s) => s - 1)}>Back</Button>
        )}
        {currentStep === 0 && <div />}
        {isLastStep ? (
          <Button type="submit">Submit</Button>
        ) : (
          <Button type="button" onClick={handleNext}>Next</Button>
        )}
      </div>
    </form>
  );
}
`;
}

function generateImports(
  form: FormDescriptor,
  fieldConfigs: Map<string, ComponentConfig>,
  uiImportPath: string,
  wizard: boolean,
): string {
  const lines: string[] = [];

  // React import (only for wizard mode)
  if (wizard) {
    lines.push("import { useState } from 'react';");
  }

  // TanStack Form import
  lines.push("import { useForm } from '@tanstack/react-form';");

  // UI component imports
  const usedComponents = getUsedComponents(fieldConfigs);
  const uiImports = buildUIImports(usedComponents, wizard);
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

function buildUIImports(
  usedComponents: Set<ComponentType>,
  wizard = false,
): string {
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

  // Include Card components if wizard mode or any composite types are used
  const hasComposite = [...usedComponents].some((c) => compositeTypes.has(c));
  if (hasComposite || wizard) {
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

/**
 * Generates the STEPS constant array from FormStep definitions.
 */
function generateStepsConstant(steps: FormStep[]): string {
  const entries = steps.map((step) => {
    const fieldsStr = step.fields.map((f) => `"${f}"`).join(", ");
    const descPart = step.description
      ? `, description: "${step.description}"`
      : "";
    return `  { id: "${step.id}", label: "${step.label}"${descPart}, fields: [${fieldsStr}] },`;
  });

  return `const STEPS = [\n${entries.join("\n")}\n];`;
}

/**
 * Generates conditional step content blocks for the wizard form.
 * Each step renders only its fields, wrapped in a conditional check on currentStep.
 */
function generateStepContentBlocks(
  steps: FormStep[],
  fields: FieldDescriptor[],
  fieldConfigs: Map<string, ComponentConfig>,
): string {
  const fieldMap = new Map<string, FieldDescriptor>();
  for (const field of fields) {
    fieldMap.set(field.name, field);
  }

  const blocks: string[] = [];

  for (let stepIndex = 0; stepIndex < steps.length; stepIndex++) {
    const step = steps[stepIndex];
    const fieldJSXs: string[] = [];

    for (const fieldName of step.fields) {
      const field = fieldMap.get(fieldName);
      const config = fieldConfigs.get(fieldName);
      if (field && config) {
        const jsx = generateFieldJSX(field, config);
        // Indent for placement inside CardContent > fragment
        const indented = jsx
          .split("\n")
          .map((line) => `            ${line}`)
          .join("\n");
        fieldJSXs.push(indented);
      }
    }

    const fieldsContent = fieldJSXs.join("\n\n");
    blocks.push(
      `          {currentStep === ${stepIndex} && (<>\n${fieldsContent}\n          </>)}`,
    );
  }

  return blocks.join("\n");
}

export { inferTypeName };
