/**
 * Input Registry
 *
 * Provides a registry of base input types for the form builder.
 * Each input type defines its component, compatible validation rules,
 * and default props.
 */

// Types
export type {
  AcceptedFile,
  BaseInputDefinition,
  BaseInputProps,
  CheckboxProps,
  DatePickerProps,
  FileUploadProps,
  InputProps,
  InputRegistry,
  InputTypeId,
  InputValue,
  MultiSelectProps,
  NumberInputProps,
  SelectOption,
  SelectProps,
  TextAreaProps,
  TextInputProps,
  TypedInputDefinition,
  ValidationRuleId,
  // Validation rule types
  RuleConfigProps,
  RuleConfigComponentRef,
  ValidationRuleCategory,
  ValidationRuleDefinition,
  ValidationRuleRegistry,
  ZodSchemaTransformer,
} from "./types";

// Registry factory and utilities
export {
  createDefaultInputRegistry,
  createInputRegistry,
  getInputRegistry,
  resetGlobalRegistry,
} from "./inputs";

// Default input definitions (for customization/extension)
export {
  checkboxDefinition,
  datePickerDefinition,
  defaultInputDefinitions,
  fileUploadDefinition,
  multiSelectDefinition,
  numberInputDefinition,
  selectDefinition,
  textAreaDefinition,
  textInputDefinition,
} from "./inputs";

/**
 * Validation Rule Registry
 *
 * Provides a registry of validation rules for form fields.
 * Each rule defines how to transform a Zod schema with the validation.
 */

// Validation rule registry factory and utilities
export {
  createValidationRuleRegistry,
  createDefaultValidationRuleRegistry,
  getValidationRuleRegistry,
  resetGlobalRuleRegistry,
  applyValidationRules,
} from "./rules";

// Re-export AppliedRule type
export type { AppliedRule } from "./rules";

// Default validation rule definitions (for customization/extension)
export {
  defaultValidationRuleDefinitions,
  // Constraint rules
  requiredRuleDefinition,
  minItemsRuleDefinition,
  maxItemsRuleDefinition,
  positiveRuleDefinition,
  negativeRuleDefinition,
  fileSizeRuleDefinition,
  fileTypeRuleDefinition,
  // Format rules
  patternRuleDefinition,
  emailRuleDefinition,
  urlRuleDefinition,
  uuidRuleDefinition,
  integerRuleDefinition,
  // Range rules
  minLengthRuleDefinition,
  maxLengthRuleDefinition,
  minRuleDefinition,
  maxRuleDefinition,
  stepRuleDefinition,
  minDateRuleDefinition,
  maxDateRuleDefinition,
} from "./rules";
