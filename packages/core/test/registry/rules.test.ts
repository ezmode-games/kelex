/**
 * Tests for the Validation Rule Registry
 */

import { z } from "zod";
import { describe, expect, it, beforeEach } from "vitest";
import {
  createValidationRuleRegistry,
  createDefaultValidationRuleRegistry,
  getValidationRuleRegistry,
  resetGlobalRuleRegistry,
  applyValidationRules,
  requiredRuleDefinition,
  minLengthRuleDefinition,
  maxLengthRuleDefinition,
  minRuleDefinition,
  maxRuleDefinition,
  emailRuleDefinition,
  patternRuleDefinition,
  defaultValidationRuleDefinitions,
  minItemsRuleDefinition,
  maxItemsRuleDefinition,
  positiveRuleDefinition,
  negativeRuleDefinition,
  fileSizeRuleDefinition,
  fileTypeRuleDefinition,
  urlRuleDefinition,
  uuidRuleDefinition,
  integerRuleDefinition,
  stepRuleDefinition,
  minDateRuleDefinition,
  maxDateRuleDefinition,
} from "../../src/registry";
import type { ValidationRuleDefinition } from "../../src/registry";

describe("ValidationRuleRegistry", () => {
  beforeEach(() => {
    resetGlobalRuleRegistry();
  });

  describe("createValidationRuleRegistry", () => {
    it("creates an empty registry", () => {
      const registry = createValidationRuleRegistry();
      expect(registry.getAll()).toHaveLength(0);
    });

    it("allows registering a rule", () => {
      const registry = createValidationRuleRegistry();
      registry.register(requiredRuleDefinition);
      expect(registry.has("required")).toBe(true);
      expect(registry.get("required")).toEqual(requiredRuleDefinition);
    });

    it("throws when registering duplicate rule", () => {
      const registry = createValidationRuleRegistry();
      registry.register(requiredRuleDefinition);
      expect(() => registry.register(requiredRuleDefinition)).toThrow(
        'Validation rule "required" is already registered'
      );
    });

    it("allows unregistering a rule", () => {
      const registry = createValidationRuleRegistry();
      registry.register(requiredRuleDefinition);
      expect(registry.unregister("required")).toBe(true);
      expect(registry.has("required")).toBe(false);
    });

    it("returns false when unregistering non-existent rule", () => {
      const registry = createValidationRuleRegistry();
      expect(registry.unregister("nonexistent" as any)).toBe(false);
    });

    it("clears all rules", () => {
      const registry = createValidationRuleRegistry();
      registry.register(requiredRuleDefinition);
      registry.register(minLengthRuleDefinition);
      registry.clear();
      expect(registry.getAll()).toHaveLength(0);
    });
  });

  describe("createDefaultValidationRuleRegistry", () => {
    it("creates registry with all default rules", () => {
      const registry = createDefaultValidationRuleRegistry();
      expect(registry.getAll().length).toBe(defaultValidationRuleDefinitions.length);
    });

    it("includes all expected rules", () => {
      const registry = createDefaultValidationRuleRegistry();
      expect(registry.has("required")).toBe(true);
      expect(registry.has("min")).toBe(true);
      expect(registry.has("max")).toBe(true);
      expect(registry.has("minLength")).toBe(true);
      expect(registry.has("maxLength")).toBe(true);
      expect(registry.has("email")).toBe(true);
      expect(registry.has("pattern")).toBe(true);
    });
  });

  describe("getValidationRuleRegistry (global)", () => {
    it("returns same instance on multiple calls", () => {
      const registry1 = getValidationRuleRegistry();
      const registry2 = getValidationRuleRegistry();
      expect(registry1).toBe(registry2);
    });

    it("includes default rules", () => {
      const registry = getValidationRuleRegistry();
      expect(registry.has("required")).toBe(true);
    });

    it("can be reset", () => {
      const registry1 = getValidationRuleRegistry();
      registry1.clear();
      expect(registry1.getAll()).toHaveLength(0);

      resetGlobalRuleRegistry();
      const registry2 = getValidationRuleRegistry();
      expect(registry2.getAll().length).toBe(defaultValidationRuleDefinitions.length);
      expect(registry1).not.toBe(registry2);
    });
  });

  describe("getByCategory", () => {
    it("returns constraint rules", () => {
      const registry = createDefaultValidationRuleRegistry();
      const constraintRules = registry.getByCategory("constraint");
      expect(constraintRules.every((r) => r.category === "constraint")).toBe(true);
      expect(constraintRules.length).toBeGreaterThan(0);
    });

    it("returns format rules", () => {
      const registry = createDefaultValidationRuleRegistry();
      const formatRules = registry.getByCategory("format");
      expect(formatRules.every((r) => r.category === "format")).toBe(true);
      expect(formatRules.length).toBeGreaterThan(0);
    });

    it("returns range rules", () => {
      const registry = createDefaultValidationRuleRegistry();
      const rangeRules = registry.getByCategory("range");
      expect(rangeRules.every((r) => r.category === "range")).toBe(true);
      expect(rangeRules.length).toBeGreaterThan(0);
    });
  });

  describe("getCompatibleRules", () => {
    it("returns rules compatible with text input", () => {
      const registry = createDefaultValidationRuleRegistry();
      const textRules = registry.getCompatibleRules("text");
      expect(textRules.some((r) => r.id === "required")).toBe(true);
      expect(textRules.some((r) => r.id === "minLength")).toBe(true);
      expect(textRules.some((r) => r.id === "email")).toBe(true);
    });

    it("returns rules compatible with number input", () => {
      const registry = createDefaultValidationRuleRegistry();
      const numberRules = registry.getCompatibleRules("number");
      expect(numberRules.some((r) => r.id === "required")).toBe(true);
      expect(numberRules.some((r) => r.id === "min")).toBe(true);
      expect(numberRules.some((r) => r.id === "max")).toBe(true);
      expect(numberRules.some((r) => r.id === "positive")).toBe(true);
    });

    it("returns rules compatible with multiselect", () => {
      const registry = createDefaultValidationRuleRegistry();
      const multiselectRules = registry.getCompatibleRules("multiselect");
      expect(multiselectRules.some((r) => r.id === "minItems")).toBe(true);
      expect(multiselectRules.some((r) => r.id === "maxItems")).toBe(true);
    });
  });
});

describe("Validation Rule Definitions", () => {
  describe("required rule", () => {
    it("makes string required", () => {
      const schema = z.string();
      const transformed = requiredRuleDefinition.toZod({})(schema);
      expect(transformed.safeParse("").success).toBe(false);
      expect(transformed.safeParse("hello").success).toBe(true);
    });

    it("makes array require at least one item", () => {
      const schema = z.array(z.string());
      const transformed = requiredRuleDefinition.toZod({})(schema);
      expect(transformed.safeParse([]).success).toBe(false);
      expect(transformed.safeParse(["item"]).success).toBe(true);
    });

    it("makes boolean require true", () => {
      const schema = z.boolean();
      const transformed = requiredRuleDefinition.toZod({})(schema);
      expect(transformed.safeParse(false).success).toBe(false);
      expect(transformed.safeParse(true).success).toBe(true);
    });
  });

  describe("minLength rule", () => {
    it("enforces minimum string length", () => {
      const schema = z.string();
      const transformed = minLengthRuleDefinition.toZod({ length: 3 })(schema);
      expect(transformed.safeParse("ab").success).toBe(false);
      expect(transformed.safeParse("abc").success).toBe(true);
    });
  });

  describe("maxLength rule", () => {
    it("enforces maximum string length", () => {
      const schema = z.string();
      const transformed = maxLengthRuleDefinition.toZod({ length: 5 })(schema);
      expect(transformed.safeParse("abcdef").success).toBe(false);
      expect(transformed.safeParse("abcde").success).toBe(true);
    });
  });

  describe("min rule", () => {
    it("enforces minimum number value", () => {
      const schema = z.number();
      const transformed = minRuleDefinition.toZod({ value: 10 })(schema);
      expect(transformed.safeParse(9).success).toBe(false);
      expect(transformed.safeParse(10).success).toBe(true);
    });
  });

  describe("max rule", () => {
    it("enforces maximum number value", () => {
      const schema = z.number();
      const transformed = maxRuleDefinition.toZod({ value: 100 })(schema);
      expect(transformed.safeParse(101).success).toBe(false);
      expect(transformed.safeParse(100).success).toBe(true);
    });
  });

  describe("email rule", () => {
    it("validates email format", () => {
      const schema = z.string();
      const transformed = emailRuleDefinition.toZod({})(schema);
      expect(transformed.safeParse("notanemail").success).toBe(false);
      expect(transformed.safeParse("test@example.com").success).toBe(true);
    });
  });

  describe("pattern rule", () => {
    it("validates against regex pattern", () => {
      const schema = z.string();
      const transformed = patternRuleDefinition.toZod({ pattern: "^[A-Z]+$" })(
        schema
      );
      expect(transformed.safeParse("abc").success).toBe(false);
      expect(transformed.safeParse("ABC").success).toBe(true);
    });
  });

  describe("minItems rule", () => {
    it("enforces minimum array length", () => {
      const schema = z.array(z.string());
      const transformed = minItemsRuleDefinition.toZod({ min: 2 })(schema);
      expect(transformed.safeParse(["one"]).success).toBe(false);
      expect(transformed.safeParse(["one", "two"]).success).toBe(true);
    });
  });

  describe("maxItems rule", () => {
    it("enforces maximum array length", () => {
      const schema = z.array(z.string());
      const transformed = maxItemsRuleDefinition.toZod({ max: 3 })(schema);
      expect(transformed.safeParse(["a", "b", "c", "d"]).success).toBe(false);
      expect(transformed.safeParse(["a", "b", "c"]).success).toBe(true);
    });
  });

  describe("positive rule", () => {
    it("requires positive number", () => {
      const schema = z.number();
      const transformed = positiveRuleDefinition.toZod({})(schema);
      expect(transformed.safeParse(0).success).toBe(false);
      expect(transformed.safeParse(-1).success).toBe(false);
      expect(transformed.safeParse(1).success).toBe(true);
    });
  });

  describe("negative rule", () => {
    it("requires negative number", () => {
      const schema = z.number();
      const transformed = negativeRuleDefinition.toZod({})(schema);
      expect(transformed.safeParse(0).success).toBe(false);
      expect(transformed.safeParse(1).success).toBe(false);
      expect(transformed.safeParse(-1).success).toBe(true);
    });
  });

  describe("integer rule", () => {
    it("requires integer value", () => {
      const schema = z.number();
      const transformed = integerRuleDefinition.toZod({})(schema);
      expect(transformed.safeParse(1.5).success).toBe(false);
      expect(transformed.safeParse(42).success).toBe(true);
    });
  });

  describe("url rule", () => {
    it("validates URL format", () => {
      const schema = z.string();
      const transformed = urlRuleDefinition.toZod({})(schema);
      expect(transformed.safeParse("not a url").success).toBe(false);
      expect(transformed.safeParse("https://example.com").success).toBe(true);
    });
  });

  describe("uuid rule", () => {
    it("validates UUID format", () => {
      const schema = z.string();
      const transformed = uuidRuleDefinition.toZod({})(schema);
      expect(transformed.safeParse("not-a-uuid").success).toBe(false);
      expect(
        transformed.safeParse("550e8400-e29b-41d4-a716-446655440000").success
      ).toBe(true);
    });
  });
});

describe("applyValidationRules", () => {
  beforeEach(() => {
    resetGlobalRuleRegistry();
  });

  it("applies multiple rules in order", () => {
    const schema = z.string();
    const result = applyValidationRules(schema, [
      { ruleId: "required", config: {} },
      { ruleId: "minLength", config: { length: 3 } },
      { ruleId: "maxLength", config: { length: 10 } },
    ]);

    expect(result.safeParse("").success).toBe(false);
    expect(result.safeParse("ab").success).toBe(false);
    expect(result.safeParse("abc").success).toBe(true);
    expect(result.safeParse("abcdefghijk").success).toBe(false);
    expect(result.safeParse("abcdefghij").success).toBe(true);
  });

  it("skips unknown rules", () => {
    const schema = z.string();
    const result = applyValidationRules(schema, [
      { ruleId: "required", config: {} },
      { ruleId: "unknownRule" as any, config: {} },
    ]);

    // Should still apply the required rule
    expect(result.safeParse("").success).toBe(false);
    expect(result.safeParse("hello").success).toBe(true);
  });

  it("uses custom registry when provided", () => {
    const customRegistry = createValidationRuleRegistry();
    customRegistry.register({
      ...requiredRuleDefinition,
      toZod: () => (schema) => {
        // Custom implementation that always passes
        return schema;
      },
    });

    const schema = z.string();
    const result = applyValidationRules(
      schema,
      [{ ruleId: "required", config: {} }],
      customRegistry
    );

    // Custom implementation should not enforce required
    expect(result.safeParse("").success).toBe(true);
  });
});
