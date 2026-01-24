/**
 * @phantom-zone/core
 *
 * Form runtime components including:
 * - Input registry (PZ-001)
 * - Validation rule registry (PZ-001b)
 * - Layout engine (PZ-003)
 * - Error display (PZ-004)
 * - State persistence (PZ-005)
 * - Accessibility (PZ-006)
 * - Submission handler (PZ-007)
 */

export const VERSION = "0.0.1";

// Input Registry (PZ-001)
export {
  // Registry factory and utilities
  createDefaultInputRegistry,
  createInputRegistry,
  getInputRegistry,
  resetGlobalRegistry,
  // Default input definitions
  checkboxDefinition,
  datePickerDefinition,
  defaultInputDefinitions,
  fileUploadDefinition,
  multiSelectDefinition,
  numberInputDefinition,
  selectDefinition,
  textAreaDefinition,
  textInputDefinition,
} from "./registry";

// Validation Rule Registry (PZ-001b)
export {
  // Registry factory and utilities
  createValidationRuleRegistry,
  createDefaultValidationRuleRegistry,
  getValidationRuleRegistry,
  resetGlobalRuleRegistry,
  applyValidationRules,
  // Default rule definitions - Constraint rules
  defaultValidationRuleDefinitions,
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
} from "./registry";

export type {
  // Core types
  AcceptedFile,
  BaseInputDefinition,
  BaseInputProps,
  InputProps,
  InputRegistry,
  InputTypeId,
  InputValue,
  SelectOption,
  TypedInputDefinition,
  ValidationRuleId,
  // Input-specific prop types
  CheckboxProps,
  DatePickerProps,
  FileUploadProps,
  MultiSelectProps,
  NumberInputProps,
  SelectProps,
  TextAreaProps,
  TextInputProps,
  // Validation rule types
  AppliedRule,
  RuleConfigProps,
  RuleConfigComponentRef,
  ValidationRuleCategory,
  ValidationRuleDefinition,
  ValidationRuleRegistry,
  ZodSchemaTransformer,
} from "./registry";
