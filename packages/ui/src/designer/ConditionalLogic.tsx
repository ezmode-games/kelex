/**
 * Conditional Logic Builder (PZ-103)
 *
 * A UI component for creating conditional field visibility rules.
 * Features:
 * - "Show this field when..." dropdown
 * - Select trigger field from other fields in form
 * - Select condition (equals, notEquals, contains, isEmpty, etc.)
 * - Value input based on trigger field type
 * - Multiple conditions with AND/OR operators
 * - Visual indicator on conditional fields
 */

import {
  type ReactNode,
  useState,
  useCallback,
  useMemo,
  createContext,
  useContext,
} from "react";
import type {
  ComparisonOperator,
  VisibilityCondition,
  LogicalOperator,
  ConditionGroup,
  VisibilityRules,
} from "@phantom-zone/core";

import type { CanvasField } from "./types";
import { generateUUIDv7 } from "./types";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/**
 * Represents a single condition in the UI (with unique ID for React keys).
 */
export interface UICondition {
  id: string;
  fieldId: string;
  operator: ComparisonOperator;
  value: string | number | boolean | null;
}

/**
 * Represents a condition group in the UI (with unique ID for React keys).
 */
export interface UIConditionGroup {
  id: string;
  operator: LogicalOperator;
  conditions: Array<UICondition | UIConditionGroup>;
}

/**
 * Event emitted when visibility rules change.
 */
export interface VisibilityRulesChangeEvent {
  fieldId: string;
  rules: VisibilityRules | null;
}

/**
 * Event emitted when a condition is added.
 */
export interface ConditionAddEvent {
  fieldId: string;
  condition: UICondition;
  parentGroupId?: string;
}

/**
 * Event emitted when a condition is removed.
 */
export interface ConditionRemoveEvent {
  fieldId: string;
  conditionId: string;
}

/**
 * Event emitted when a condition is updated.
 */
export interface ConditionUpdateEvent {
  fieldId: string;
  conditionId: string;
  updates: Partial<Omit<UICondition, "id">>;
}

/**
 * Event emitted when a group operator changes.
 */
export interface GroupOperatorChangeEvent {
  fieldId: string;
  groupId: string;
  operator: LogicalOperator;
}

/**
 * Maps comparison operators to human-readable labels.
 */
export const OPERATOR_LABELS: Record<ComparisonOperator, string> = {
  equals: "equals",
  notEquals: "does not equal",
  contains: "contains",
  notContains: "does not contain",
  greaterThan: "is greater than",
  lessThan: "is less than",
  greaterThanOrEquals: "is at least",
  lessThanOrEquals: "is at most",
  isEmpty: "is empty",
  isNotEmpty: "is not empty",
  matches: "matches pattern",
};

/**
 * Operators that don't require a value input.
 */
export const VALUE_FREE_OPERATORS: ComparisonOperator[] = ["isEmpty", "isNotEmpty"];

/**
 * Get operators compatible with a field type.
 */
export function getCompatibleOperators(fieldType: string): ComparisonOperator[] {
  switch (fieldType) {
    case "number":
      return [
        "equals",
        "notEquals",
        "greaterThan",
        "lessThan",
        "greaterThanOrEquals",
        "lessThanOrEquals",
        "isEmpty",
        "isNotEmpty",
      ];
    case "checkbox":
      return ["equals", "notEquals"];
    case "select":
    case "multiselect":
      return [
        "equals",
        "notEquals",
        "contains",
        "notContains",
        "isEmpty",
        "isNotEmpty",
      ];
    case "date":
      return [
        "equals",
        "notEquals",
        "greaterThan",
        "lessThan",
        "greaterThanOrEquals",
        "lessThanOrEquals",
        "isEmpty",
        "isNotEmpty",
      ];
    case "text":
    case "textarea":
    default:
      return [
        "equals",
        "notEquals",
        "contains",
        "notContains",
        "isEmpty",
        "isNotEmpty",
        "matches",
      ];
  }
}

// -----------------------------------------------------------------------------
// Context
// -----------------------------------------------------------------------------

interface ConditionalLogicContextValue {
  /** The field being configured */
  field: CanvasField | null;
  /** All available fields that can be used as triggers (excludes current field) */
  availableFields: CanvasField[];
  /** Current UI condition group */
  conditionGroup: UIConditionGroup | null;
  /** Add a new condition */
  addCondition: (parentGroupId?: string) => void;
  /** Remove a condition */
  removeCondition: (conditionId: string) => void;
  /** Update a condition */
  updateCondition: (conditionId: string, updates: Partial<Omit<UICondition, "id">>) => void;
  /** Change group operator */
  setGroupOperator: (groupId: string, operator: LogicalOperator) => void;
  /** Add a nested condition group */
  addNestedGroup: (parentGroupId: string) => void;
  /** Clear all conditions */
  clearConditions: () => void;
  /** Get a field by ID */
  getFieldById: (fieldId: string) => CanvasField | undefined;
}

const ConditionalLogicContext = createContext<ConditionalLogicContextValue | null>(null);

/**
 * Hook to access the ConditionalLogic context.
 * Must be used within a ConditionalLogic component.
 */
export function useConditionalLogic(): ConditionalLogicContextValue {
  const context = useContext(ConditionalLogicContext);
  if (!context) {
    throw new Error("useConditionalLogic must be used within a ConditionalLogic component");
  }
  return context;
}

// -----------------------------------------------------------------------------
// Conversion Utilities
// -----------------------------------------------------------------------------

/**
 * Convert UI condition to visibility condition.
 */
export function uiConditionToVisibility(condition: UICondition): VisibilityCondition {
  const result: VisibilityCondition = {
    fieldId: condition.fieldId,
    operator: condition.operator,
  };

  // Only include value if operator requires it
  if (!VALUE_FREE_OPERATORS.includes(condition.operator)) {
    result.value = condition.value;
  }

  return result;
}

/**
 * Convert UI condition group to visibility rules.
 */
export function uiGroupToVisibilityRules(group: UIConditionGroup): VisibilityRules {
  // Single condition - return as single VisibilityCondition
  if (group.conditions.length === 1) {
    const first = group.conditions[0];
    if (first && !isUIConditionGroup(first)) {
      return uiConditionToVisibility(first);
    }
  }

  // Multiple conditions - return as ConditionGroup
  const conditions: Array<VisibilityCondition | ConditionGroup> = group.conditions.map((c) => {
    if (isUIConditionGroup(c)) {
      return uiGroupToVisibilityRules(c) as ConditionGroup;
    }
    return uiConditionToVisibility(c);
  });

  return {
    operator: group.operator,
    conditions,
  };
}

/**
 * Convert visibility rules to UI condition group.
 */
export function visibilityRulesToUIGroup(rules: VisibilityRules): UIConditionGroup {
  if (isConditionGroup(rules)) {
    return {
      id: generateUUIDv7(),
      operator: rules.operator,
      conditions: rules.conditions.map((c) => {
        if (isConditionGroup(c)) {
          return visibilityRulesToUIGroup(c);
        }
        return {
          id: generateUUIDv7(),
          fieldId: c.fieldId,
          operator: c.operator,
          value: c.value ?? null,
        };
      }),
    };
  }

  // Single condition - wrap in a group
  return {
    id: generateUUIDv7(),
    operator: "and",
    conditions: [
      {
        id: generateUUIDv7(),
        fieldId: rules.fieldId,
        operator: rules.operator,
        value: rules.value ?? null,
      },
    ],
  };
}

/**
 * Type guard for ConditionGroup.
 */
function isConditionGroup(rule: VisibilityRules): rule is ConditionGroup {
  return "operator" in rule && "conditions" in rule;
}

/**
 * Type guard for UIConditionGroup.
 */
function isUIConditionGroup(item: UICondition | UIConditionGroup): item is UIConditionGroup {
  return "conditions" in item;
}

/**
 * Create an empty condition with defaults.
 */
export function createEmptyCondition(defaultFieldId?: string): UICondition {
  return {
    id: generateUUIDv7(),
    fieldId: defaultFieldId ?? "",
    operator: "equals",
    value: null,
  };
}

/**
 * Create an empty condition group.
 */
export function createEmptyConditionGroup(): UIConditionGroup {
  return {
    id: generateUUIDv7(),
    operator: "and",
    conditions: [],
  };
}

// -----------------------------------------------------------------------------
// ConditionRow Component
// -----------------------------------------------------------------------------

export interface ConditionRowProps {
  /** The condition to render */
  condition: UICondition;
  /** Index for display (e.g., "and" separator) */
  index: number;
  /** Parent group operator (for display) */
  groupOperator: LogicalOperator;
  /** Whether to show the operator label before this row */
  showOperatorLabel: boolean;
  /** Available trigger fields */
  availableFields: CanvasField[];
  /** Callback when condition changes */
  onChange: (conditionId: string, updates: Partial<Omit<UICondition, "id">>) => void;
  /** Callback when condition is removed */
  onRemove: (conditionId: string) => void;
  /** Custom field option renderer */
  renderFieldOption?: (field: CanvasField) => ReactNode;
  /** Custom value input renderer */
  renderValueInput?: (
    condition: UICondition,
    triggerField: CanvasField | undefined,
    onChange: (value: string | number | boolean | null) => void
  ) => ReactNode;
}

/**
 * Renders a single condition row with field selector, operator selector, and value input.
 */
export function ConditionRow({
  condition,
  index,
  groupOperator,
  showOperatorLabel,
  availableFields,
  onChange,
  onRemove,
  renderFieldOption,
  renderValueInput,
}: ConditionRowProps) {
  const triggerField = availableFields.find((f) => f.id === condition.fieldId);
  const compatibleOperators = triggerField
    ? getCompatibleOperators(triggerField.inputType)
    : getCompatibleOperators("text");
  const showValueInput = !VALUE_FREE_OPERATORS.includes(condition.operator);

  const handleFieldChange = useCallback(
    (fieldId: string) => {
      const newField = availableFields.find((f) => f.id === fieldId);
      const newOperators = newField
        ? getCompatibleOperators(newField.inputType)
        : getCompatibleOperators("text");

      // Reset operator if current one is not compatible
      const newOperator = newOperators.includes(condition.operator)
        ? condition.operator
        : newOperators[0] ?? "equals";

      onChange(condition.id, {
        fieldId,
        operator: newOperator,
        value: null, // Reset value when field changes
      });
    },
    [availableFields, condition.id, condition.operator, onChange]
  );

  const handleOperatorChange = useCallback(
    (operator: ComparisonOperator) => {
      const updates: Partial<Omit<UICondition, "id">> = { operator };

      // Clear value if operator doesn't need it
      if (VALUE_FREE_OPERATORS.includes(operator)) {
        updates.value = null;
      }

      onChange(condition.id, updates);
    },
    [condition.id, onChange]
  );

  const handleValueChange = useCallback(
    (value: string | number | boolean | null) => {
      onChange(condition.id, { value });
    },
    [condition.id, onChange]
  );

  return (
    <div
      data-testid={`condition-row-${condition.id}`}
      data-index={index}
      role="group"
      aria-label={`Condition ${index + 1}`}
    >
      {/* Operator label (AND/OR) */}
      {showOperatorLabel && (
        <span
          data-testid={`condition-operator-label-${condition.id}`}
          aria-hidden="true"
        >
          {groupOperator.toUpperCase()}
        </span>
      )}

      {/* Field Selector */}
      <div data-testid={`condition-field-wrapper-${condition.id}`}>
        <label
          htmlFor={`condition-field-${condition.id}`}
          data-testid={`condition-field-label-${condition.id}`}
        >
          When
        </label>
        <select
          id={`condition-field-${condition.id}`}
          data-testid={`condition-field-select-${condition.id}`}
          value={condition.fieldId}
          onChange={(e) => handleFieldChange(e.target.value)}
          aria-label="Select trigger field"
        >
          <option value="">Select a field...</option>
          {availableFields.map((field) => (
            <option key={field.id} value={field.id}>
              {renderFieldOption ? renderFieldOption(field) : field.label}
            </option>
          ))}
        </select>
      </div>

      {/* Operator Selector */}
      <div data-testid={`condition-operator-wrapper-${condition.id}`}>
        <label
          htmlFor={`condition-operator-${condition.id}`}
          data-testid={`condition-operator-label-input-${condition.id}`}
        >
          Condition
        </label>
        <select
          id={`condition-operator-${condition.id}`}
          data-testid={`condition-operator-select-${condition.id}`}
          value={condition.operator}
          onChange={(e) => handleOperatorChange(e.target.value as ComparisonOperator)}
          aria-label="Select condition type"
          disabled={!condition.fieldId}
        >
          {compatibleOperators.map((op) => (
            <option key={op} value={op}>
              {OPERATOR_LABELS[op]}
            </option>
          ))}
        </select>
      </div>

      {/* Value Input */}
      {showValueInput && (
        <div data-testid={`condition-value-wrapper-${condition.id}`}>
          <label
            htmlFor={`condition-value-${condition.id}`}
            data-testid={`condition-value-label-${condition.id}`}
          >
            Value
          </label>
          {renderValueInput ? (
            renderValueInput(condition, triggerField, handleValueChange)
          ) : (
            <DefaultValueInput
              condition={condition}
              triggerField={triggerField}
              onChange={handleValueChange}
            />
          )}
        </div>
      )}

      {/* Remove Button */}
      <button
        type="button"
        data-testid={`condition-remove-${condition.id}`}
        onClick={() => onRemove(condition.id)}
        aria-label="Remove this condition"
      >
        <RemoveIcon />
      </button>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Default Value Input
// -----------------------------------------------------------------------------

interface DefaultValueInputProps {
  condition: UICondition;
  triggerField: CanvasField | undefined;
  onChange: (value: string | number | boolean | null) => void;
}

function DefaultValueInput({
  condition,
  triggerField,
  onChange,
}: DefaultValueInputProps) {
  const inputId = `condition-value-${condition.id}`;

  // Checkbox field - show boolean select
  if (triggerField?.inputType === "checkbox") {
    return (
      <select
        id={inputId}
        data-testid={`condition-value-input-${condition.id}`}
        value={condition.value === true ? "true" : "false"}
        onChange={(e) => onChange(e.target.value === "true")}
        aria-label="Value to compare"
      >
        <option value="true">Checked</option>
        <option value="false">Unchecked</option>
      </select>
    );
  }

  // Select field - show options dropdown
  if (triggerField?.inputType === "select" && triggerField.options) {
    return (
      <select
        id={inputId}
        data-testid={`condition-value-input-${condition.id}`}
        value={condition.value?.toString() ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        aria-label="Value to compare"
      >
        <option value="">Select a value...</option>
        {triggerField.options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  // Number field - show number input
  if (triggerField?.inputType === "number") {
    return (
      <input
        id={inputId}
        type="number"
        data-testid={`condition-value-input-${condition.id}`}
        value={condition.value?.toString() ?? ""}
        onChange={(e) => {
          const val = e.target.value;
          onChange(val === "" ? null : Number(val));
        }}
        aria-label="Value to compare"
        placeholder="Enter a number"
      />
    );
  }

  // Date field - show date input
  if (triggerField?.inputType === "date") {
    return (
      <input
        id={inputId}
        type="date"
        data-testid={`condition-value-input-${condition.id}`}
        value={condition.value?.toString() ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        aria-label="Value to compare"
      />
    );
  }

  // Default - text input
  return (
    <input
      id={inputId}
      type="text"
      data-testid={`condition-value-input-${condition.id}`}
      value={condition.value?.toString() ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      aria-label="Value to compare"
      placeholder="Enter a value"
    />
  );
}

// -----------------------------------------------------------------------------
// ConditionGroupComponent
// -----------------------------------------------------------------------------

export interface ConditionGroupComponentProps {
  /** The condition group to render */
  group: UIConditionGroup;
  /** Depth level for nested groups */
  depth: number;
  /** Available trigger fields */
  availableFields: CanvasField[];
  /** Callback when a condition changes */
  onConditionChange: (conditionId: string, updates: Partial<Omit<UICondition, "id">>) => void;
  /** Callback when a condition is removed */
  onConditionRemove: (conditionId: string) => void;
  /** Callback when group operator changes */
  onOperatorChange: (groupId: string, operator: LogicalOperator) => void;
  /** Callback to add a condition */
  onAddCondition: (parentGroupId: string) => void;
  /** Callback to add a nested group */
  onAddNestedGroup: (parentGroupId: string) => void;
  /** Custom field option renderer */
  renderFieldOption?: (field: CanvasField) => ReactNode;
  /** Custom value input renderer */
  renderValueInput?: (
    condition: UICondition,
    triggerField: CanvasField | undefined,
    onChange: (value: string | number | boolean | null) => void
  ) => ReactNode;
}

/**
 * Renders a condition group with AND/OR toggle and nested conditions.
 */
export function ConditionGroupComponent({
  group,
  depth,
  availableFields,
  onConditionChange,
  onConditionRemove,
  onOperatorChange,
  onAddCondition,
  onAddNestedGroup,
  renderFieldOption,
  renderValueInput,
}: ConditionGroupComponentProps) {
  const handleOperatorToggle = useCallback(() => {
    const newOperator: LogicalOperator = group.operator === "and" ? "or" : "and";
    onOperatorChange(group.id, newOperator);
  }, [group.id, group.operator, onOperatorChange]);

  return (
    <div
      data-testid={`condition-group-${group.id}`}
      data-depth={depth}
      role="group"
      aria-label={`Condition group with ${group.operator.toUpperCase()} logic`}
    >
      {/* Group Header with Operator Toggle */}
      {group.conditions.length > 1 && (
        <div data-testid={`group-header-${group.id}`}>
          <span data-testid={`group-logic-label-${group.id}`}>
            Match
          </span>
          <button
            type="button"
            data-testid={`group-operator-toggle-${group.id}`}
            onClick={handleOperatorToggle}
            aria-pressed={group.operator === "and"}
            aria-label={`Toggle between AND and OR logic. Currently: ${group.operator.toUpperCase()}`}
          >
            {group.operator === "and" ? "ALL" : "ANY"}
          </button>
          <span data-testid={`group-conditions-label-${group.id}`}>
            of these conditions
          </span>
        </div>
      )}

      {/* Conditions List */}
      <div data-testid={`group-conditions-${group.id}`} role="list">
        {group.conditions.map((item, index) => {
          if (isUIConditionGroup(item)) {
            return (
              <ConditionGroupComponent
                key={item.id}
                group={item}
                depth={depth + 1}
                availableFields={availableFields}
                onConditionChange={onConditionChange}
                onConditionRemove={onConditionRemove}
                onOperatorChange={onOperatorChange}
                onAddCondition={onAddCondition}
                onAddNestedGroup={onAddNestedGroup}
                renderFieldOption={renderFieldOption}
                renderValueInput={renderValueInput}
              />
            );
          }

          return (
            <ConditionRow
              key={item.id}
              condition={item}
              index={index}
              groupOperator={group.operator}
              showOperatorLabel={index > 0}
              availableFields={availableFields}
              onChange={onConditionChange}
              onRemove={onConditionRemove}
              renderFieldOption={renderFieldOption}
              renderValueInput={renderValueInput}
            />
          );
        })}
      </div>

      {/* Add Condition Button */}
      <div data-testid={`group-actions-${group.id}`}>
        <button
          type="button"
          data-testid={`add-condition-${group.id}`}
          onClick={() => onAddCondition(group.id)}
          aria-label="Add another condition"
        >
          <PlusIcon />
          Add Condition
        </button>

        {/* Add Nested Group (only for root level, max depth of 1) */}
        {depth === 0 && (
          <button
            type="button"
            data-testid={`add-nested-group-${group.id}`}
            onClick={() => onAddNestedGroup(group.id)}
            aria-label="Add nested condition group"
          >
            <PlusIcon />
            Add Group
          </button>
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// VisibilityIndicator Component
// -----------------------------------------------------------------------------

export interface VisibilityIndicatorProps {
  /** Whether the field has visibility conditions */
  hasConditions: boolean;
  /** Number of conditions applied */
  conditionCount: number;
  /** Callback when clicked */
  onClick?: () => void;
  /** Additional class name */
  className?: string;
}

/**
 * Visual indicator shown on fields that have conditional visibility rules.
 */
export function VisibilityIndicator({
  hasConditions,
  conditionCount,
  onClick,
  className,
}: VisibilityIndicatorProps) {
  if (!hasConditions) {
    return null;
  }

  return (
    <button
      type="button"
      data-testid="visibility-indicator"
      data-has-conditions={hasConditions}
      data-condition-count={conditionCount}
      onClick={onClick}
      className={className}
      aria-label={`This field has ${conditionCount} visibility condition${conditionCount !== 1 ? "s" : ""}. Click to edit.`}
    >
      <ConditionalIcon />
      <span data-testid="condition-count">{conditionCount}</span>
    </button>
  );
}

// -----------------------------------------------------------------------------
// Empty State
// -----------------------------------------------------------------------------

function EmptyState() {
  return (
    <div
      data-testid="conditional-logic-empty"
      role="status"
      aria-label="No field selected"
    >
      <div data-testid="empty-icon">
        <ConditionalIcon />
      </div>
      <h3 data-testid="empty-title">No Field Selected</h3>
      <p data-testid="empty-description">
        Select a field on the canvas to configure its visibility conditions.
      </p>
    </div>
  );
}

// -----------------------------------------------------------------------------
// No Conditions State
// -----------------------------------------------------------------------------

interface NoConditionsStateProps {
  onAddCondition: () => void;
}

function NoConditionsState({ onAddCondition }: NoConditionsStateProps) {
  return (
    <div
      data-testid="no-conditions-state"
      role="status"
      aria-label="No visibility conditions"
    >
      <p data-testid="no-conditions-description">
        This field is always visible. Add conditions to show or hide it based on other field values.
      </p>
      <button
        type="button"
        data-testid="add-first-condition-button"
        onClick={onAddCondition}
        aria-label="Add first visibility condition"
      >
        <PlusIcon />
        Show this field when...
      </button>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Icons
// -----------------------------------------------------------------------------

function RemoveIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M8 2v12M2 8h12" />
    </svg>
  );
}

function ConditionalIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      {/* Branch/fork icon representing conditional logic */}
      <path d="M4 2v4M4 10v4M4 6c4 0 4 4 8 4M4 10c4 0 4-4 8-4" />
      <circle cx="12" cy="6" r="2" />
      <circle cx="12" cy="10" r="2" />
    </svg>
  );
}

// -----------------------------------------------------------------------------
// ConditionalLogic Component
// -----------------------------------------------------------------------------

export interface ConditionalLogicProps {
  /** The field to configure visibility for (null if no field selected) */
  field: CanvasField | null;
  /** All fields in the form (for selecting trigger fields) */
  allFields: CanvasField[];
  /** Current visibility rules for the field */
  visibilityRules?: VisibilityRules | null;
  /** Callback when visibility rules change */
  onRulesChange?: (event: VisibilityRulesChangeEvent) => void;
  /** Custom field option renderer for dropdowns */
  renderFieldOption?: (field: CanvasField) => ReactNode;
  /** Custom value input renderer */
  renderValueInput?: (
    condition: UICondition,
    triggerField: CanvasField | undefined,
    onChange: (value: string | number | boolean | null) => void
  ) => ReactNode;
  /** Additional class name */
  className?: string;
  /** Children to render (e.g., custom header) */
  children?: ReactNode;
}

/**
 * ConditionalLogic is a panel for configuring field visibility conditions.
 *
 * Features:
 * - "Show this field when..." interface
 * - Trigger field selector (other fields in the form)
 * - Condition type selector (equals, notEquals, contains, isEmpty, etc.)
 * - Value input appropriate for the trigger field type
 * - Multiple conditions with AND/OR logic
 */
export function ConditionalLogic({
  field,
  allFields,
  visibilityRules,
  onRulesChange,
  renderFieldOption,
  renderValueInput,
  className,
  children,
}: ConditionalLogicProps) {
  // State for the condition group
  const [conditionGroup, setConditionGroup] = useState<UIConditionGroup | null>(() => {
    if (visibilityRules) {
      return visibilityRulesToUIGroup(visibilityRules);
    }
    return null;
  });

  // Available fields (exclude current field)
  const availableFields = useMemo(() => {
    if (!field) return [];
    return allFields.filter((f) => f.id !== field.id);
  }, [allFields, field]);

  // Notify parent when conditions change
  const notifyChange = useCallback(
    (newGroup: UIConditionGroup | null) => {
      if (!field) return;

      let rules: VisibilityRules | null = null;
      if (newGroup && newGroup.conditions.length > 0) {
        rules = uiGroupToVisibilityRules(newGroup);
      }

      onRulesChange?.({
        fieldId: field.id,
        rules,
      });
    },
    [field, onRulesChange]
  );

  // Add a condition
  const addCondition = useCallback(
    (parentGroupId?: string) => {
      const newCondition = createEmptyCondition(availableFields[0]?.id);

      setConditionGroup((prev) => {
        if (!prev) {
          // Create new root group with the condition
          const newGroup: UIConditionGroup = {
            id: generateUUIDv7(),
            operator: "and",
            conditions: [newCondition],
          };
          notifyChange(newGroup);
          return newGroup;
        }

        // Add to existing group
        const newGroup = addConditionToGroup(prev, newCondition, parentGroupId);
        notifyChange(newGroup);
        return newGroup;
      });
    },
    [availableFields, notifyChange]
  );

  // Remove a condition
  const removeCondition = useCallback(
    (conditionId: string) => {
      setConditionGroup((prev) => {
        if (!prev) return null;

        const newGroup = removeConditionFromGroup(prev, conditionId);
        if (newGroup.conditions.length === 0) {
          notifyChange(null);
          return null;
        }
        notifyChange(newGroup);
        return newGroup;
      });
    },
    [notifyChange]
  );

  // Update a condition
  const updateCondition = useCallback(
    (conditionId: string, updates: Partial<Omit<UICondition, "id">>) => {
      setConditionGroup((prev) => {
        if (!prev) return null;

        const newGroup = updateConditionInGroup(prev, conditionId, updates);
        notifyChange(newGroup);
        return newGroup;
      });
    },
    [notifyChange]
  );

  // Change group operator
  const setGroupOperator = useCallback(
    (groupId: string, operator: LogicalOperator) => {
      setConditionGroup((prev) => {
        if (!prev) return null;

        const newGroup = updateGroupOperator(prev, groupId, operator);
        notifyChange(newGroup);
        return newGroup;
      });
    },
    [notifyChange]
  );

  // Add nested group
  const addNestedGroup = useCallback(
    (parentGroupId: string) => {
      const newGroup = createEmptyConditionGroup();
      newGroup.conditions = [createEmptyCondition(availableFields[0]?.id)];

      setConditionGroup((prev) => {
        if (!prev) return null;

        const updated = addNestedGroupToParent(prev, parentGroupId, newGroup);
        notifyChange(updated);
        return updated;
      });
    },
    [availableFields, notifyChange]
  );

  // Clear all conditions
  const clearConditions = useCallback(() => {
    setConditionGroup(null);
    notifyChange(null);
  }, [notifyChange]);

  // Get field by ID
  const getFieldById = useCallback(
    (fieldId: string) => {
      return allFields.find((f) => f.id === fieldId);
    },
    [allFields]
  );

  // Context value
  const contextValue = useMemo<ConditionalLogicContextValue>(
    () => ({
      field,
      availableFields,
      conditionGroup,
      addCondition,
      removeCondition,
      updateCondition,
      setGroupOperator,
      addNestedGroup,
      clearConditions,
      getFieldById,
    }),
    [
      field,
      availableFields,
      conditionGroup,
      addCondition,
      removeCondition,
      updateCondition,
      setGroupOperator,
      addNestedGroup,
      clearConditions,
      getFieldById,
    ]
  );

  // Sync state when prop changes
  useMemo(() => {
    if (visibilityRules) {
      setConditionGroup(visibilityRulesToUIGroup(visibilityRules));
    } else {
      setConditionGroup(null);
    }
  }, [visibilityRules]);

  const hasConditions = conditionGroup !== null && conditionGroup.conditions.length > 0;

  return (
    <ConditionalLogicContext.Provider value={contextValue}>
      <aside
        data-testid="conditional-logic"
        className={className}
        role="complementary"
        aria-label="Conditional visibility editor"
      >
        {children && (
          <div data-testid="conditional-logic-header">{children}</div>
        )}

        {!field ? (
          <EmptyState />
        ) : (
          <div data-testid="conditional-logic-content">
            {/* Field indicator */}
            <div data-testid="field-indicator">
              <span data-testid="field-indicator-label">Configuring:</span>
              <span data-testid="field-indicator-value">{field.label}</span>
            </div>

            {!hasConditions ? (
              <NoConditionsState onAddCondition={() => addCondition()} />
            ) : (
              <>
                {/* Conditions header */}
                <div data-testid="conditions-header">
                  <h3 data-testid="conditions-title">Show this field when:</h3>
                  <button
                    type="button"
                    data-testid="clear-conditions-button"
                    onClick={clearConditions}
                    aria-label="Remove all conditions"
                  >
                    Clear All
                  </button>
                </div>

                {/* Condition Group */}
                {conditionGroup && (
                  <ConditionGroupComponent
                    group={conditionGroup}
                    depth={0}
                    availableFields={availableFields}
                    onConditionChange={updateCondition}
                    onConditionRemove={removeCondition}
                    onOperatorChange={setGroupOperator}
                    onAddCondition={addCondition}
                    onAddNestedGroup={addNestedGroup}
                    renderFieldOption={renderFieldOption}
                    renderValueInput={renderValueInput}
                  />
                )}
              </>
            )}
          </div>
        )}
      </aside>
    </ConditionalLogicContext.Provider>
  );
}

// -----------------------------------------------------------------------------
// Helper Functions for Immutable Updates
// -----------------------------------------------------------------------------

function addConditionToGroup(
  group: UIConditionGroup,
  condition: UICondition,
  targetGroupId?: string
): UIConditionGroup {
  if (!targetGroupId || group.id === targetGroupId) {
    return {
      ...group,
      conditions: [...group.conditions, condition],
    };
  }

  return {
    ...group,
    conditions: group.conditions.map((c) => {
      if (isUIConditionGroup(c)) {
        return addConditionToGroup(c, condition, targetGroupId);
      }
      return c;
    }),
  };
}

function removeConditionFromGroup(
  group: UIConditionGroup,
  conditionId: string
): UIConditionGroup {
  return {
    ...group,
    conditions: group.conditions
      .filter((c) => {
        if (!isUIConditionGroup(c)) {
          return c.id !== conditionId;
        }
        return true;
      })
      .map((c) => {
        if (isUIConditionGroup(c)) {
          const updated = removeConditionFromGroup(c, conditionId);
          // Remove empty nested groups
          if (updated.conditions.length === 0) {
            return null;
          }
          return updated;
        }
        return c;
      })
      .filter((c): c is UICondition | UIConditionGroup => c !== null),
  };
}

function updateConditionInGroup(
  group: UIConditionGroup,
  conditionId: string,
  updates: Partial<Omit<UICondition, "id">>
): UIConditionGroup {
  return {
    ...group,
    conditions: group.conditions.map((c) => {
      if (isUIConditionGroup(c)) {
        return updateConditionInGroup(c, conditionId, updates);
      }
      if (c.id === conditionId) {
        return { ...c, ...updates };
      }
      return c;
    }),
  };
}

function updateGroupOperator(
  group: UIConditionGroup,
  groupId: string,
  operator: LogicalOperator
): UIConditionGroup {
  if (group.id === groupId) {
    return { ...group, operator };
  }

  return {
    ...group,
    conditions: group.conditions.map((c) => {
      if (isUIConditionGroup(c)) {
        return updateGroupOperator(c, groupId, operator);
      }
      return c;
    }),
  };
}

function addNestedGroupToParent(
  parent: UIConditionGroup,
  parentGroupId: string,
  newGroup: UIConditionGroup
): UIConditionGroup {
  if (parent.id === parentGroupId) {
    return {
      ...parent,
      conditions: [...parent.conditions, newGroup],
    };
  }

  return {
    ...parent,
    conditions: parent.conditions.map((c) => {
      if (isUIConditionGroup(c)) {
        return addNestedGroupToParent(c, parentGroupId, newGroup);
      }
      return c;
    }),
  };
}

// Export sub-components for flexibility
ConditionalLogic.EmptyState = EmptyState;
ConditionalLogic.NoConditionsState = NoConditionsState;
ConditionalLogic.ConditionRow = ConditionRow;
ConditionalLogic.ConditionGroupComponent = ConditionGroupComponent;
ConditionalLogic.VisibilityIndicator = VisibilityIndicator;
ConditionalLogic.RemoveIcon = RemoveIcon;
ConditionalLogic.PlusIcon = PlusIcon;
ConditionalLogic.ConditionalIcon = ConditionalIcon;
