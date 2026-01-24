/**
 * ConditionalLogic Tests (PZ-103)
 *
 * Note: These tests are limited since we use node environment.
 * Full component testing would require jsdom environment and @testing-library/react.
 * These tests verify types, exports, and basic functionality.
 */

import { describe, expect, it } from "vitest";
import {
  ConditionalLogic,
  useConditionalLogic,
  ConditionRow,
  ConditionGroupComponent,
  VisibilityIndicator,
  getCompatibleOperators,
  uiConditionToVisibility,
  uiGroupToVisibilityRules,
  visibilityRulesToUIGroup,
  createEmptyCondition,
  createEmptyConditionGroup,
  OPERATOR_LABELS,
  VALUE_FREE_OPERATORS,
  createField,
  generateUUIDv7,
} from "../../src/designer";
import type {
  ConditionalLogicProps,
  UICondition,
  UIConditionGroup,
  VisibilityRulesChangeEvent,
  ConditionAddEvent,
  ConditionRemoveEvent,
  ConditionUpdateEvent,
  GroupOperatorChangeEvent,
  ConditionRowProps,
  ConditionGroupComponentProps,
  VisibilityIndicatorProps,
  CanvasField,
} from "../../src/designer";
import type {
  VisibilityCondition,
  ConditionGroup,
  VisibilityRules,
  ComparisonOperator,
  LogicalOperator,
} from "@phantom-zone/core";

describe("ConditionalLogic", () => {
  describe("exports", () => {
    it("ConditionalLogic is exported as a function", () => {
      expect(typeof ConditionalLogic).toBe("function");
    });

    it("useConditionalLogic is exported as a function", () => {
      expect(typeof useConditionalLogic).toBe("function");
    });

    it("ConditionRow is exported as a function", () => {
      expect(typeof ConditionRow).toBe("function");
    });

    it("ConditionGroupComponent is exported as a function", () => {
      expect(typeof ConditionGroupComponent).toBe("function");
    });

    it("VisibilityIndicator is exported as a function", () => {
      expect(typeof VisibilityIndicator).toBe("function");
    });

    it("getCompatibleOperators is exported as a function", () => {
      expect(typeof getCompatibleOperators).toBe("function");
    });

    it("uiConditionToVisibility is exported as a function", () => {
      expect(typeof uiConditionToVisibility).toBe("function");
    });

    it("uiGroupToVisibilityRules is exported as a function", () => {
      expect(typeof uiGroupToVisibilityRules).toBe("function");
    });

    it("visibilityRulesToUIGroup is exported as a function", () => {
      expect(typeof visibilityRulesToUIGroup).toBe("function");
    });

    it("createEmptyCondition is exported as a function", () => {
      expect(typeof createEmptyCondition).toBe("function");
    });

    it("createEmptyConditionGroup is exported as a function", () => {
      expect(typeof createEmptyConditionGroup).toBe("function");
    });

    it("OPERATOR_LABELS is exported", () => {
      expect(OPERATOR_LABELS).toBeDefined();
      expect(typeof OPERATOR_LABELS).toBe("object");
    });

    it("VALUE_FREE_OPERATORS is exported", () => {
      expect(VALUE_FREE_OPERATORS).toBeDefined();
      expect(Array.isArray(VALUE_FREE_OPERATORS)).toBe(true);
    });
  });

  describe("ConditionalLogic component", () => {
    it("is a valid React component function", () => {
      expect(ConditionalLogic.length).toBeGreaterThanOrEqual(0);
    });

    it("has sub-components attached", () => {
      expect(ConditionalLogic.EmptyState).toBeDefined();
      expect(ConditionalLogic.NoConditionsState).toBeDefined();
      expect(ConditionalLogic.ConditionRow).toBeDefined();
      expect(ConditionalLogic.ConditionGroupComponent).toBeDefined();
      expect(ConditionalLogic.VisibilityIndicator).toBeDefined();
      expect(ConditionalLogic.RemoveIcon).toBeDefined();
      expect(ConditionalLogic.PlusIcon).toBeDefined();
      expect(ConditionalLogic.ConditionalIcon).toBeDefined();
    });
  });

  describe("useConditionalLogic hook", () => {
    it("is exported as a function", () => {
      // Note: We cannot test the actual hook behavior in node environment
      // since React hooks require a React component context.
      expect(typeof useConditionalLogic).toBe("function");
    });
  });
});

describe("OPERATOR_LABELS", () => {
  it("has labels for all comparison operators", () => {
    const operators: ComparisonOperator[] = [
      "equals",
      "notEquals",
      "contains",
      "notContains",
      "greaterThan",
      "lessThan",
      "greaterThanOrEquals",
      "lessThanOrEquals",
      "isEmpty",
      "isNotEmpty",
      "matches",
    ];

    for (const op of operators) {
      expect(OPERATOR_LABELS[op]).toBeDefined();
      expect(typeof OPERATOR_LABELS[op]).toBe("string");
      expect(OPERATOR_LABELS[op].length).toBeGreaterThan(0);
    }
  });

  it("has human-readable labels", () => {
    expect(OPERATOR_LABELS.equals).toBe("equals");
    expect(OPERATOR_LABELS.notEquals).toBe("does not equal");
    expect(OPERATOR_LABELS.contains).toBe("contains");
    expect(OPERATOR_LABELS.isEmpty).toBe("is empty");
    expect(OPERATOR_LABELS.isNotEmpty).toBe("is not empty");
    expect(OPERATOR_LABELS.greaterThan).toBe("is greater than");
    expect(OPERATOR_LABELS.lessThan).toBe("is less than");
    expect(OPERATOR_LABELS.matches).toBe("matches pattern");
  });
});

describe("VALUE_FREE_OPERATORS", () => {
  it("contains isEmpty and isNotEmpty", () => {
    expect(VALUE_FREE_OPERATORS).toContain("isEmpty");
    expect(VALUE_FREE_OPERATORS).toContain("isNotEmpty");
  });

  it("does not contain operators that require values", () => {
    expect(VALUE_FREE_OPERATORS).not.toContain("equals");
    expect(VALUE_FREE_OPERATORS).not.toContain("notEquals");
    expect(VALUE_FREE_OPERATORS).not.toContain("contains");
    expect(VALUE_FREE_OPERATORS).not.toContain("greaterThan");
  });
});

describe("getCompatibleOperators", () => {
  it("returns operators for text fields", () => {
    const operators = getCompatibleOperators("text");

    expect(operators).toContain("equals");
    expect(operators).toContain("notEquals");
    expect(operators).toContain("contains");
    expect(operators).toContain("notContains");
    expect(operators).toContain("isEmpty");
    expect(operators).toContain("isNotEmpty");
    expect(operators).toContain("matches");

    // Should not include numeric operators
    expect(operators).not.toContain("greaterThan");
    expect(operators).not.toContain("lessThan");
  });

  it("returns operators for textarea fields", () => {
    const operators = getCompatibleOperators("textarea");

    expect(operators).toContain("equals");
    expect(operators).toContain("contains");
    expect(operators).toContain("matches");
  });

  it("returns operators for number fields", () => {
    const operators = getCompatibleOperators("number");

    expect(operators).toContain("equals");
    expect(operators).toContain("notEquals");
    expect(operators).toContain("greaterThan");
    expect(operators).toContain("lessThan");
    expect(operators).toContain("greaterThanOrEquals");
    expect(operators).toContain("lessThanOrEquals");
    expect(operators).toContain("isEmpty");
    expect(operators).toContain("isNotEmpty");

    // Should not include string operators
    expect(operators).not.toContain("contains");
    expect(operators).not.toContain("matches");
  });

  it("returns operators for checkbox fields", () => {
    const operators = getCompatibleOperators("checkbox");

    expect(operators).toContain("equals");
    expect(operators).toContain("notEquals");

    // Checkbox only needs equals/notEquals for true/false
    expect(operators).toHaveLength(2);
  });

  it("returns operators for select fields", () => {
    const operators = getCompatibleOperators("select");

    expect(operators).toContain("equals");
    expect(operators).toContain("notEquals");
    expect(operators).toContain("contains");
    expect(operators).toContain("notContains");
    expect(operators).toContain("isEmpty");
    expect(operators).toContain("isNotEmpty");
  });

  it("returns operators for multiselect fields", () => {
    const operators = getCompatibleOperators("multiselect");

    expect(operators).toContain("contains");
    expect(operators).toContain("notContains");
    expect(operators).toContain("isEmpty");
    expect(operators).toContain("isNotEmpty");
  });

  it("returns operators for date fields", () => {
    const operators = getCompatibleOperators("date");

    expect(operators).toContain("equals");
    expect(operators).toContain("notEquals");
    expect(operators).toContain("greaterThan");
    expect(operators).toContain("lessThan");
    expect(operators).toContain("greaterThanOrEquals");
    expect(operators).toContain("lessThanOrEquals");
    expect(operators).toContain("isEmpty");
    expect(operators).toContain("isNotEmpty");
  });

  it("returns default operators for unknown field types", () => {
    const operators = getCompatibleOperators("custom-type");

    // Should default to text-like operators
    expect(operators).toContain("equals");
    expect(operators).toContain("contains");
    expect(operators).toContain("isEmpty");
  });
});

describe("createEmptyCondition", () => {
  it("creates a condition with unique ID", () => {
    const condition1 = createEmptyCondition();
    const condition2 = createEmptyCondition();

    expect(condition1.id).toBeTruthy();
    expect(condition2.id).toBeTruthy();
    expect(condition1.id).not.toBe(condition2.id);
  });

  it("creates a condition with default values", () => {
    const condition = createEmptyCondition();

    expect(condition.fieldId).toBe("");
    expect(condition.operator).toBe("equals");
    expect(condition.value).toBeNull();
  });

  it("accepts optional default field ID", () => {
    const condition = createEmptyCondition("field-123");

    expect(condition.fieldId).toBe("field-123");
    expect(condition.operator).toBe("equals");
  });
});

describe("createEmptyConditionGroup", () => {
  it("creates a group with unique ID", () => {
    const group1 = createEmptyConditionGroup();
    const group2 = createEmptyConditionGroup();

    expect(group1.id).toBeTruthy();
    expect(group2.id).toBeTruthy();
    expect(group1.id).not.toBe(group2.id);
  });

  it("creates a group with AND operator by default", () => {
    const group = createEmptyConditionGroup();

    expect(group.operator).toBe("and");
  });

  it("creates a group with empty conditions array", () => {
    const group = createEmptyConditionGroup();

    expect(group.conditions).toEqual([]);
  });
});

describe("uiConditionToVisibility", () => {
  it("converts a basic UI condition to VisibilityCondition", () => {
    const uiCondition: UICondition = {
      id: "ui-123",
      fieldId: "field-456",
      operator: "equals",
      value: "test",
    };

    const result = uiConditionToVisibility(uiCondition);

    expect(result.fieldId).toBe("field-456");
    expect(result.operator).toBe("equals");
    expect(result.value).toBe("test");
  });

  it("excludes value for isEmpty operator", () => {
    const uiCondition: UICondition = {
      id: "ui-123",
      fieldId: "field-456",
      operator: "isEmpty",
      value: "ignored",
    };

    const result = uiConditionToVisibility(uiCondition);

    expect(result.fieldId).toBe("field-456");
    expect(result.operator).toBe("isEmpty");
    expect(result.value).toBeUndefined();
  });

  it("excludes value for isNotEmpty operator", () => {
    const uiCondition: UICondition = {
      id: "ui-123",
      fieldId: "field-456",
      operator: "isNotEmpty",
      value: "ignored",
    };

    const result = uiConditionToVisibility(uiCondition);

    expect(result.value).toBeUndefined();
  });

  it("handles number values", () => {
    const uiCondition: UICondition = {
      id: "ui-123",
      fieldId: "field-456",
      operator: "greaterThan",
      value: 42,
    };

    const result = uiConditionToVisibility(uiCondition);

    expect(result.value).toBe(42);
  });

  it("handles boolean values", () => {
    const uiCondition: UICondition = {
      id: "ui-123",
      fieldId: "field-456",
      operator: "equals",
      value: true,
    };

    const result = uiConditionToVisibility(uiCondition);

    expect(result.value).toBe(true);
  });

  it("handles null values", () => {
    const uiCondition: UICondition = {
      id: "ui-123",
      fieldId: "field-456",
      operator: "equals",
      value: null,
    };

    const result = uiConditionToVisibility(uiCondition);

    expect(result.value).toBeNull();
  });
});

describe("uiGroupToVisibilityRules", () => {
  it("converts single condition to VisibilityCondition", () => {
    const uiGroup: UIConditionGroup = {
      id: "group-1",
      operator: "and",
      conditions: [
        {
          id: "cond-1",
          fieldId: "experience",
          operator: "equals",
          value: "Hardcore",
        },
      ],
    };

    const result = uiGroupToVisibilityRules(uiGroup);

    // Single condition should be returned as VisibilityCondition, not ConditionGroup
    expect("conditions" in result).toBe(false);
    expect((result as VisibilityCondition).fieldId).toBe("experience");
    expect((result as VisibilityCondition).operator).toBe("equals");
    expect((result as VisibilityCondition).value).toBe("Hardcore");
  });

  it("converts multiple conditions to ConditionGroup", () => {
    const uiGroup: UIConditionGroup = {
      id: "group-1",
      operator: "and",
      conditions: [
        {
          id: "cond-1",
          fieldId: "experience",
          operator: "equals",
          value: "Hardcore",
        },
        {
          id: "cond-2",
          fieldId: "level",
          operator: "greaterThan",
          value: 60,
        },
      ],
    };

    const result = uiGroupToVisibilityRules(uiGroup) as ConditionGroup;

    expect("conditions" in result).toBe(true);
    expect(result.operator).toBe("and");
    expect(result.conditions).toHaveLength(2);
    expect((result.conditions[0] as VisibilityCondition).fieldId).toBe("experience");
    expect((result.conditions[1] as VisibilityCondition).fieldId).toBe("level");
  });

  it("converts OR group correctly", () => {
    const uiGroup: UIConditionGroup = {
      id: "group-1",
      operator: "or",
      conditions: [
        {
          id: "cond-1",
          fieldId: "role",
          operator: "equals",
          value: "admin",
        },
        {
          id: "cond-2",
          fieldId: "role",
          operator: "equals",
          value: "moderator",
        },
      ],
    };

    const result = uiGroupToVisibilityRules(uiGroup) as ConditionGroup;

    expect(result.operator).toBe("or");
    expect(result.conditions).toHaveLength(2);
  });

  it("handles nested groups", () => {
    const uiGroup: UIConditionGroup = {
      id: "group-1",
      operator: "and",
      conditions: [
        {
          id: "cond-1",
          fieldId: "experience",
          operator: "equals",
          value: "Hardcore",
        },
        {
          id: "nested-group",
          operator: "or",
          conditions: [
            {
              id: "cond-2",
              fieldId: "class",
              operator: "equals",
              value: "Warrior",
            },
            {
              id: "cond-3",
              fieldId: "class",
              operator: "equals",
              value: "Paladin",
            },
          ],
        },
      ],
    };

    const result = uiGroupToVisibilityRules(uiGroup) as ConditionGroup;

    expect(result.operator).toBe("and");
    expect(result.conditions).toHaveLength(2);

    const nestedGroup = result.conditions[1] as ConditionGroup;
    expect("conditions" in nestedGroup).toBe(true);
    expect(nestedGroup.operator).toBe("or");
    expect(nestedGroup.conditions).toHaveLength(2);
  });
});

describe("visibilityRulesToUIGroup", () => {
  it("converts single VisibilityCondition to UIConditionGroup", () => {
    const visibility: VisibilityCondition = {
      fieldId: "experience",
      operator: "equals",
      value: "Hardcore",
    };

    const result = visibilityRulesToUIGroup(visibility);

    expect(result.id).toBeTruthy();
    expect(result.operator).toBe("and"); // Default operator for single condition
    expect(result.conditions).toHaveLength(1);

    const condition = result.conditions[0] as UICondition;
    expect(condition.id).toBeTruthy();
    expect(condition.fieldId).toBe("experience");
    expect(condition.operator).toBe("equals");
    expect(condition.value).toBe("Hardcore");
  });

  it("converts ConditionGroup to UIConditionGroup", () => {
    const visibility: ConditionGroup = {
      operator: "or",
      conditions: [
        { fieldId: "role", operator: "equals", value: "admin" },
        { fieldId: "role", operator: "equals", value: "moderator" },
      ],
    };

    const result = visibilityRulesToUIGroup(visibility);

    expect(result.operator).toBe("or");
    expect(result.conditions).toHaveLength(2);

    const cond1 = result.conditions[0] as UICondition;
    const cond2 = result.conditions[1] as UICondition;

    expect(cond1.fieldId).toBe("role");
    expect(cond1.value).toBe("admin");
    expect(cond2.fieldId).toBe("role");
    expect(cond2.value).toBe("moderator");
  });

  it("generates unique IDs for all items", () => {
    const visibility: ConditionGroup = {
      operator: "and",
      conditions: [
        { fieldId: "a", operator: "equals", value: "1" },
        { fieldId: "b", operator: "equals", value: "2" },
        { fieldId: "c", operator: "equals", value: "3" },
      ],
    };

    const result = visibilityRulesToUIGroup(visibility);

    const ids = new Set<string>();
    ids.add(result.id);
    for (const cond of result.conditions) {
      ids.add((cond as UICondition).id);
    }

    // All IDs should be unique
    expect(ids.size).toBe(4); // 1 group + 3 conditions
  });

  it("handles nested ConditionGroups", () => {
    const visibility: ConditionGroup = {
      operator: "and",
      conditions: [
        { fieldId: "experience", operator: "equals", value: "Hardcore" },
        {
          operator: "or",
          conditions: [
            { fieldId: "class", operator: "equals", value: "Warrior" },
            { fieldId: "class", operator: "equals", value: "Paladin" },
          ],
        },
      ],
    };

    const result = visibilityRulesToUIGroup(visibility);

    expect(result.operator).toBe("and");
    expect(result.conditions).toHaveLength(2);

    const nestedGroup = result.conditions[1] as UIConditionGroup;
    expect("conditions" in nestedGroup).toBe(true);
    expect(nestedGroup.operator).toBe("or");
    expect(nestedGroup.conditions).toHaveLength(2);
  });

  it("handles null/undefined values", () => {
    const visibility: VisibilityCondition = {
      fieldId: "field",
      operator: "isEmpty",
      // value is undefined
    };

    const result = visibilityRulesToUIGroup(visibility);
    const condition = result.conditions[0] as UICondition;

    expect(condition.value).toBeNull(); // Should be converted to null
  });
});

describe("Round-trip conversion", () => {
  it("preserves single condition through round-trip", () => {
    const original: UIConditionGroup = {
      id: generateUUIDv7(),
      operator: "and",
      conditions: [
        {
          id: generateUUIDv7(),
          fieldId: "experience",
          operator: "equals",
          value: "Hardcore",
        },
      ],
    };

    const visibility = uiGroupToVisibilityRules(original);
    const result = visibilityRulesToUIGroup(visibility);

    // IDs will be different, but structure should match
    expect(result.conditions).toHaveLength(1);
    const condition = result.conditions[0] as UICondition;
    expect(condition.fieldId).toBe("experience");
    expect(condition.operator).toBe("equals");
    expect(condition.value).toBe("Hardcore");
  });

  it("preserves multiple conditions through round-trip", () => {
    const original: UIConditionGroup = {
      id: generateUUIDv7(),
      operator: "or",
      conditions: [
        {
          id: generateUUIDv7(),
          fieldId: "role",
          operator: "equals",
          value: "admin",
        },
        {
          id: generateUUIDv7(),
          fieldId: "level",
          operator: "greaterThan",
          value: 50,
        },
      ],
    };

    const visibility = uiGroupToVisibilityRules(original);
    const result = visibilityRulesToUIGroup(visibility as VisibilityRules);

    expect(result.operator).toBe("or");
    expect(result.conditions).toHaveLength(2);

    const cond1 = result.conditions[0] as UICondition;
    const cond2 = result.conditions[1] as UICondition;

    expect(cond1.value).toBe("admin");
    expect(cond2.value).toBe(50);
  });

  it("preserves nested groups through round-trip", () => {
    const original: UIConditionGroup = {
      id: generateUUIDv7(),
      operator: "and",
      conditions: [
        {
          id: generateUUIDv7(),
          fieldId: "experience",
          operator: "equals",
          value: "Hardcore",
        },
        {
          id: generateUUIDv7(),
          operator: "or",
          conditions: [
            {
              id: generateUUIDv7(),
              fieldId: "class",
              operator: "equals",
              value: "Warrior",
            },
            {
              id: generateUUIDv7(),
              fieldId: "class",
              operator: "equals",
              value: "Paladin",
            },
          ],
        },
      ],
    };

    const visibility = uiGroupToVisibilityRules(original);
    const result = visibilityRulesToUIGroup(visibility as VisibilityRules);

    expect(result.operator).toBe("and");
    expect(result.conditions).toHaveLength(2);

    const nested = result.conditions[1] as UIConditionGroup;
    expect("conditions" in nested).toBe(true);
    expect(nested.operator).toBe("or");
    expect(nested.conditions).toHaveLength(2);
  });
});

describe("ConditionalLogicProps Type Tests", () => {
  it("ConditionalLogicProps interface is correct", () => {
    const field = createField("text", "Test Field");
    const allFields = [field, createField("select", "Experience Level")];

    const props: ConditionalLogicProps = {
      field,
      allFields,
      visibilityRules: null,
      onRulesChange: (event: VisibilityRulesChangeEvent) => {
        void event;
      },
      renderFieldOption: (f: CanvasField) => f.label,
      renderValueInput: (condition, triggerField, onChange) => {
        void condition;
        void triggerField;
        void onChange;
        return null;
      },
      className: "test-class",
      children: null,
    };

    expect(props.field).toBeDefined();
    expect(props.allFields).toHaveLength(2);
    expect(typeof props.onRulesChange).toBe("function");
    expect(typeof props.renderFieldOption).toBe("function");
    expect(typeof props.renderValueInput).toBe("function");
    expect(props.className).toBe("test-class");
  });

  it("ConditionalLogicProps supports null field", () => {
    const props: ConditionalLogicProps = {
      field: null,
      allFields: [],
    };

    expect(props.field).toBeNull();
  });

  it("ConditionalLogicProps supports visibility rules", () => {
    const field = createField("number", "Mythic+ Score");
    const visibilityRules: VisibilityCondition = {
      fieldId: "experience",
      operator: "equals",
      value: "Hardcore",
    };

    const props: ConditionalLogicProps = {
      field,
      allFields: [field],
      visibilityRules,
    };

    expect(props.visibilityRules).toBeDefined();
    expect((props.visibilityRules as VisibilityCondition).fieldId).toBe("experience");
  });
});

describe("UICondition Type Tests", () => {
  it("UICondition has correct structure", () => {
    const condition: UICondition = {
      id: generateUUIDv7(),
      fieldId: "field-123",
      operator: "equals",
      value: "test",
    };

    expect(condition.id).toBeTruthy();
    expect(condition.fieldId).toBe("field-123");
    expect(condition.operator).toBe("equals");
    expect(condition.value).toBe("test");
  });

  it("UICondition supports all value types", () => {
    const stringCondition: UICondition = {
      id: generateUUIDv7(),
      fieldId: "f1",
      operator: "equals",
      value: "string",
    };

    const numberCondition: UICondition = {
      id: generateUUIDv7(),
      fieldId: "f2",
      operator: "greaterThan",
      value: 42,
    };

    const booleanCondition: UICondition = {
      id: generateUUIDv7(),
      fieldId: "f3",
      operator: "equals",
      value: true,
    };

    const nullCondition: UICondition = {
      id: generateUUIDv7(),
      fieldId: "f4",
      operator: "isEmpty",
      value: null,
    };

    expect(stringCondition.value).toBe("string");
    expect(numberCondition.value).toBe(42);
    expect(booleanCondition.value).toBe(true);
    expect(nullCondition.value).toBeNull();
  });
});

describe("UIConditionGroup Type Tests", () => {
  it("UIConditionGroup has correct structure", () => {
    const group: UIConditionGroup = {
      id: generateUUIDv7(),
      operator: "and",
      conditions: [],
    };

    expect(group.id).toBeTruthy();
    expect(group.operator).toBe("and");
    expect(group.conditions).toEqual([]);
  });

  it("UIConditionGroup supports OR operator", () => {
    const group: UIConditionGroup = {
      id: generateUUIDv7(),
      operator: "or",
      conditions: [],
    };

    expect(group.operator).toBe("or");
  });

  it("UIConditionGroup supports nested conditions", () => {
    const nestedGroup: UIConditionGroup = {
      id: generateUUIDv7(),
      operator: "or",
      conditions: [
        {
          id: generateUUIDv7(),
          fieldId: "class",
          operator: "equals",
          value: "Warrior",
        },
      ],
    };

    const group: UIConditionGroup = {
      id: generateUUIDv7(),
      operator: "and",
      conditions: [
        {
          id: generateUUIDv7(),
          fieldId: "experience",
          operator: "equals",
          value: "Hardcore",
        },
        nestedGroup,
      ],
    };

    expect(group.conditions).toHaveLength(2);
    expect("conditions" in group.conditions[1]!).toBe(true);
  });
});

describe("Event Type Tests", () => {
  it("VisibilityRulesChangeEvent has correct structure", () => {
    const event: VisibilityRulesChangeEvent = {
      fieldId: "field-123",
      rules: {
        fieldId: "trigger",
        operator: "equals",
        value: "test",
      },
    };

    expect(event.fieldId).toBe("field-123");
    expect(event.rules).toBeDefined();
  });

  it("VisibilityRulesChangeEvent supports null rules", () => {
    const event: VisibilityRulesChangeEvent = {
      fieldId: "field-123",
      rules: null,
    };

    expect(event.rules).toBeNull();
  });

  it("ConditionAddEvent has correct structure", () => {
    const event: ConditionAddEvent = {
      fieldId: "field-123",
      condition: {
        id: generateUUIDv7(),
        fieldId: "trigger",
        operator: "equals",
        value: "test",
      },
      parentGroupId: "group-456",
    };

    expect(event.fieldId).toBe("field-123");
    expect(event.condition.fieldId).toBe("trigger");
    expect(event.parentGroupId).toBe("group-456");
  });

  it("ConditionRemoveEvent has correct structure", () => {
    const event: ConditionRemoveEvent = {
      fieldId: "field-123",
      conditionId: "cond-456",
    };

    expect(event.fieldId).toBe("field-123");
    expect(event.conditionId).toBe("cond-456");
  });

  it("ConditionUpdateEvent has correct structure", () => {
    const event: ConditionUpdateEvent = {
      fieldId: "field-123",
      conditionId: "cond-456",
      updates: {
        operator: "notEquals",
        value: "new-value",
      },
    };

    expect(event.fieldId).toBe("field-123");
    expect(event.conditionId).toBe("cond-456");
    expect(event.updates.operator).toBe("notEquals");
    expect(event.updates.value).toBe("new-value");
  });

  it("GroupOperatorChangeEvent has correct structure", () => {
    const event: GroupOperatorChangeEvent = {
      fieldId: "field-123",
      groupId: "group-456",
      operator: "or",
    };

    expect(event.fieldId).toBe("field-123");
    expect(event.groupId).toBe("group-456");
    expect(event.operator).toBe("or");
  });
});

describe("ConditionRowProps Type Tests", () => {
  it("ConditionRowProps has correct structure", () => {
    const condition: UICondition = {
      id: generateUUIDv7(),
      fieldId: "trigger",
      operator: "equals",
      value: "test",
    };

    const props: ConditionRowProps = {
      condition,
      index: 0,
      groupOperator: "and",
      showOperatorLabel: false,
      availableFields: [],
      onChange: (conditionId, updates) => {
        void conditionId;
        void updates;
      },
      onRemove: (conditionId) => {
        void conditionId;
      },
    };

    expect(props.condition).toBeDefined();
    expect(props.index).toBe(0);
    expect(props.groupOperator).toBe("and");
    expect(typeof props.onChange).toBe("function");
    expect(typeof props.onRemove).toBe("function");
  });
});

describe("ConditionGroupComponentProps Type Tests", () => {
  it("ConditionGroupComponentProps has correct structure", () => {
    const group: UIConditionGroup = {
      id: generateUUIDv7(),
      operator: "and",
      conditions: [],
    };

    const props: ConditionGroupComponentProps = {
      group,
      depth: 0,
      availableFields: [],
      onConditionChange: (conditionId, updates) => {
        void conditionId;
        void updates;
      },
      onConditionRemove: (conditionId) => {
        void conditionId;
      },
      onOperatorChange: (groupId, operator) => {
        void groupId;
        void operator;
      },
      onAddCondition: (parentGroupId) => {
        void parentGroupId;
      },
      onAddNestedGroup: (parentGroupId) => {
        void parentGroupId;
      },
    };

    expect(props.group).toBeDefined();
    expect(props.depth).toBe(0);
    expect(typeof props.onConditionChange).toBe("function");
    expect(typeof props.onConditionRemove).toBe("function");
    expect(typeof props.onOperatorChange).toBe("function");
    expect(typeof props.onAddCondition).toBe("function");
    expect(typeof props.onAddNestedGroup).toBe("function");
  });
});

describe("VisibilityIndicatorProps Type Tests", () => {
  it("VisibilityIndicatorProps has correct structure", () => {
    const props: VisibilityIndicatorProps = {
      hasConditions: true,
      conditionCount: 3,
      onClick: () => {},
      className: "indicator-class",
    };

    expect(props.hasConditions).toBe(true);
    expect(props.conditionCount).toBe(3);
    expect(typeof props.onClick).toBe("function");
    expect(props.className).toBe("indicator-class");
  });

  it("VisibilityIndicatorProps supports no conditions", () => {
    const props: VisibilityIndicatorProps = {
      hasConditions: false,
      conditionCount: 0,
    };

    expect(props.hasConditions).toBe(false);
    expect(props.conditionCount).toBe(0);
  });
});

describe("Integration with CanvasField", () => {
  it("works with a basic field", () => {
    const field = createField("text", "Name");

    expect(field.id).toBeTruthy();
    expect(field.inputType).toBe("text");
    expect(field.label).toBe("Name");
  });

  it("works with a select field with options", () => {
    const field = createField("select", "Experience Level", {
      options: [
        { value: "casual", label: "Casual" },
        { value: "normal", label: "Normal" },
        { value: "hardcore", label: "Hardcore" },
      ],
    });

    expect(field.inputType).toBe("select");
    expect(field.options).toHaveLength(3);
    expect(field.options?.[2]?.value).toBe("hardcore");
  });

  it("can create conditional visibility scenario", () => {
    // Example: Show "Mythic+ Score" when "Experience Level" = "Hardcore"
    const experienceField = createField("select", "Experience Level", {
      options: [
        { value: "casual", label: "Casual" },
        { value: "normal", label: "Normal" },
        { value: "hardcore", label: "Hardcore" },
      ],
    });

    const mythicScoreField = createField("number", "Mythic+ Score");

    // Create visibility condition
    const visibilityRules: VisibilityCondition = {
      fieldId: experienceField.id,
      operator: "equals",
      value: "hardcore",
    };

    // Convert to UI representation
    const uiGroup = visibilityRulesToUIGroup(visibilityRules);

    expect(uiGroup.conditions).toHaveLength(1);
    const condition = uiGroup.conditions[0] as UICondition;
    expect(condition.fieldId).toBe(experienceField.id);
    expect(condition.operator).toBe("equals");
    expect(condition.value).toBe("hardcore");

    // Convert back to visibility rules
    const converted = uiGroupToVisibilityRules(uiGroup);

    expect((converted as VisibilityCondition).fieldId).toBe(experienceField.id);
    expect((converted as VisibilityCondition).value).toBe("hardcore");
  });

  it("can create complex conditional visibility scenario", () => {
    // Example: Show "Raid Schedule" when:
    // - Experience Level = "Hardcore" AND
    // - (Guild Role = "Raid Leader" OR Guild Role = "Officer")

    const experienceField = createField("select", "Experience Level");
    const guildRoleField = createField("select", "Guild Role");

    // Create UI condition group
    const uiGroup: UIConditionGroup = {
      id: generateUUIDv7(),
      operator: "and",
      conditions: [
        {
          id: generateUUIDv7(),
          fieldId: experienceField.id,
          operator: "equals",
          value: "Hardcore",
        },
        {
          id: generateUUIDv7(),
          operator: "or",
          conditions: [
            {
              id: generateUUIDv7(),
              fieldId: guildRoleField.id,
              operator: "equals",
              value: "Raid Leader",
            },
            {
              id: generateUUIDv7(),
              fieldId: guildRoleField.id,
              operator: "equals",
              value: "Officer",
            },
          ],
        },
      ],
    };

    // Convert to visibility rules
    const visibilityRules = uiGroupToVisibilityRules(uiGroup);

    // Verify structure
    const group = visibilityRules as ConditionGroup;
    expect(group.operator).toBe("and");
    expect(group.conditions).toHaveLength(2);

    const nestedGroup = group.conditions[1] as ConditionGroup;
    expect(nestedGroup.operator).toBe("or");
    expect(nestedGroup.conditions).toHaveLength(2);
  });
});

describe("Edge Cases", () => {
  it("handles empty field ID", () => {
    const condition = createEmptyCondition("");
    expect(condition.fieldId).toBe("");
  });

  it("handles condition with all operator types", () => {
    const operators: ComparisonOperator[] = [
      "equals",
      "notEquals",
      "contains",
      "notContains",
      "greaterThan",
      "lessThan",
      "greaterThanOrEquals",
      "lessThanOrEquals",
      "isEmpty",
      "isNotEmpty",
      "matches",
    ];

    for (const op of operators) {
      const condition: UICondition = {
        id: generateUUIDv7(),
        fieldId: "field",
        operator: op,
        value: "test",
      };

      const visibility = uiConditionToVisibility(condition);
      expect(visibility.operator).toBe(op);
    }
  });

  it("handles deeply nested groups", () => {
    // Create a 3-level deep structure with multiple conditions to avoid flattening
    const uiGroup: UIConditionGroup = {
      id: generateUUIDv7(),
      operator: "and",
      conditions: [
        {
          id: generateUUIDv7(),
          fieldId: "top-level",
          operator: "equals",
          value: "top",
        },
        {
          id: generateUUIDv7(),
          operator: "or",
          conditions: [
            {
              id: generateUUIDv7(),
              fieldId: "mid-level",
              operator: "equals",
              value: "mid",
            },
            {
              id: generateUUIDv7(),
              operator: "and",
              conditions: [
                {
                  id: generateUUIDv7(),
                  fieldId: "deep",
                  operator: "equals",
                  value: "value",
                },
                {
                  id: generateUUIDv7(),
                  fieldId: "deep2",
                  operator: "notEquals",
                  value: "other",
                },
              ],
            },
          ],
        },
      ],
    };

    const visibility = uiGroupToVisibilityRules(uiGroup);
    const result = visibilityRulesToUIGroup(visibility);

    // Verify structure
    expect(result.operator).toBe("and");
    expect(result.conditions).toHaveLength(2);

    // Navigate to the deepest condition
    const topCondition = result.conditions[0] as UICondition;
    expect(topCondition.fieldId).toBe("top-level");

    const level1 = result.conditions[1] as UIConditionGroup;
    expect(level1.operator).toBe("or");
    expect(level1.conditions).toHaveLength(2);

    const level2 = level1.conditions[1] as UIConditionGroup;
    expect(level2.operator).toBe("and");
    expect(level2.conditions).toHaveLength(2);

    const deepCondition = level2.conditions[0] as UICondition;
    expect(deepCondition.fieldId).toBe("deep");
    expect(deepCondition.value).toBe("value");
  });

  it("generates unique IDs for many conditions", () => {
    const ids = new Set<string>();

    for (let i = 0; i < 100; i++) {
      const condition = createEmptyCondition();
      ids.add(condition.id);
    }

    expect(ids.size).toBe(100);
  });

  it("handles special characters in values", () => {
    const condition: UICondition = {
      id: generateUUIDv7(),
      fieldId: "field",
      operator: "equals",
      value: "test <script>alert('xss')</script>",
    };

    const visibility = uiConditionToVisibility(condition);
    expect(visibility.value).toBe("test <script>alert('xss')</script>");
  });

  it("handles unicode characters in values", () => {
    const condition: UICondition = {
      id: generateUUIDv7(),
      fieldId: "field",
      operator: "contains",
      value: "Hier sollten wir Umlaute haben",
    };

    const visibility = uiConditionToVisibility(condition);
    expect(visibility.value).toBe("Hier sollten wir Umlaute haben");
  });
});
