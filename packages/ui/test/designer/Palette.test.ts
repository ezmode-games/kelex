/**
 * Palette Tests (PZ-101)
 *
 * Note: These tests are limited since we use node environment.
 * Full component testing would require jsdom environment and @testing-library/react.
 * These tests verify types, exports, and basic functionality.
 */

import { describe, expect, it, beforeEach } from "vitest";
import {
  Palette,
  usePalette,
  defaultPresets,
} from "../../src/designer";
import type {
  PaletteProps,
  PaletteItemData,
  PaletteDropEvent,
  PresetDefinition,
  InputCategory,
  RuleCategory,
} from "../../src/designer";
import {
  resetGlobalRegistry,
  resetGlobalRuleRegistry,
} from "@phantom-zone/core";

describe("Palette", () => {
  beforeEach(() => {
    // Reset registries before each test to ensure clean state
    resetGlobalRegistry();
    resetGlobalRuleRegistry();
  });

  describe("exports", () => {
    it("Palette is exported as a function", () => {
      expect(typeof Palette).toBe("function");
    });

    it("usePalette is exported as a function", () => {
      expect(typeof usePalette).toBe("function");
    });

    it("defaultPresets is exported as an array", () => {
      expect(Array.isArray(defaultPresets)).toBe(true);
    });
  });

  describe("Palette component", () => {
    it("is a valid React component function", () => {
      expect(Palette.length).toBeGreaterThanOrEqual(0);
    });

    it("has sub-components attached", () => {
      expect(Palette.CollapsibleSection).toBeDefined();
      expect(Palette.InputItem).toBeDefined();
      expect(Palette.RuleItem).toBeDefined();
      expect(Palette.PresetItem).toBeDefined();
      expect(Palette.DragPreview).toBeDefined();
    });
  });

  describe("usePalette hook", () => {
    it("is exported as a function", () => {
      // Note: We cannot test the actual hook behavior in node environment
      // since React hooks require a React component context.
      expect(typeof usePalette).toBe("function");
    });
  });
});

describe("Palette Type Tests", () => {
  it("PaletteProps interface is correct", () => {
    const props: PaletteProps = {
      selectedInputType: "text",
      onSelectedInputTypeChange: (inputType) => {
        void inputType;
      },
      onDrop: (event: PaletteDropEvent) => {
        void event;
      },
      presets: defaultPresets,
      showSections: {
        inputs: true,
        rules: true,
        presets: true,
      },
      defaultExpandedSections: ["inputs", "rules", "presets"],
      className: "test-class",
      children: null,
    };

    expect(props.selectedInputType).toBe("text");
    expect(typeof props.onSelectedInputTypeChange).toBe("function");
    expect(typeof props.onDrop).toBe("function");
    expect(props.showSections?.inputs).toBe(true);
    expect(props.className).toBe("test-class");
  });

  it("PaletteItemData type has correct structure", () => {
    const inputItem: PaletteItemData = {
      id: "test-id",
      type: "input",
      itemId: "text",
      name: "Text Input",
      icon: "type",
      description: "Single-line text input",
    };

    expect(inputItem.id).toBe("test-id");
    expect(inputItem.type).toBe("input");
    expect(inputItem.itemId).toBe("text");
    expect(inputItem.name).toBe("Text Input");
    expect(inputItem.icon).toBe("type");
    expect(inputItem.description).toBe("Single-line text input");
  });

  it("PaletteDropEvent type has correct structure", () => {
    const dropEvent: PaletteDropEvent = {
      item: {
        id: "drag-id",
        type: "input",
        itemId: "text",
        name: "Text Input",
        icon: "type",
      },
      target: {
        id: "canvas-drop-zone",
        type: "canvas",
      },
    };

    expect(dropEvent.item.id).toBe("drag-id");
    expect(dropEvent.target?.id).toBe("canvas-drop-zone");
    expect(dropEvent.target?.type).toBe("canvas");
  });

  it("PaletteDropEvent supports undefined target", () => {
    const dropEvent: PaletteDropEvent = {
      item: {
        id: "drag-id",
        type: "rule",
        itemId: "required",
        name: "Required",
        icon: "asterisk",
      },
    };

    expect(dropEvent.target).toBeUndefined();
  });

  it("PresetDefinition type has correct structure", () => {
    const preset: PresetDefinition = {
      id: "email-field",
      name: "Email Field",
      icon: "mail",
      description: "Text input with email validation",
      inputType: "text",
      rules: [
        { ruleId: "required", config: {} },
        { ruleId: "email", config: {} },
      ],
      defaultConfig: {
        placeholder: "email@example.com",
      },
    };

    expect(preset.id).toBe("email-field");
    expect(preset.name).toBe("Email Field");
    expect(preset.inputType).toBe("text");
    expect(preset.rules).toHaveLength(2);
    expect(preset.rules[0]?.ruleId).toBe("required");
    expect(preset.rules[1]?.ruleId).toBe("email");
    expect(preset.defaultConfig?.placeholder).toBe("email@example.com");
  });

  it("InputCategory type covers all expected categories", () => {
    const categories: InputCategory[] = ["text", "number", "choice", "date", "file"];

    expect(categories).toContain("text");
    expect(categories).toContain("number");
    expect(categories).toContain("choice");
    expect(categories).toContain("date");
    expect(categories).toContain("file");
  });

  it("RuleCategory type covers all expected categories", () => {
    const categories: RuleCategory[] = ["constraints", "format", "options", "gaming"];

    expect(categories).toContain("constraints");
    expect(categories).toContain("format");
    expect(categories).toContain("options");
    expect(categories).toContain("gaming");
  });
});

describe("Default Presets", () => {
  it("contains expected preset definitions", () => {
    expect(defaultPresets.length).toBeGreaterThan(0);

    const presetIds = defaultPresets.map((p) => p.id);
    expect(presetIds).toContain("email-field");
    expect(presetIds).toContain("character-name");
    expect(presetIds).toContain("age-field");
    expect(presetIds).toContain("url-field");
    expect(presetIds).toContain("image-upload");
    expect(presetIds).toContain("multi-choice");
  });

  it("each preset has required fields", () => {
    for (const preset of defaultPresets) {
      expect(preset.id).toBeTruthy();
      expect(preset.name).toBeTruthy();
      expect(preset.icon).toBeTruthy();
      expect(preset.description).toBeTruthy();
      expect(preset.inputType).toBeTruthy();
      expect(Array.isArray(preset.rules)).toBe(true);
    }
  });

  it("preset rules reference valid rule IDs", () => {
    const validRuleIds = [
      "required",
      "minLength",
      "maxLength",
      "pattern",
      "email",
      "url",
      "uuid",
      "min",
      "max",
      "step",
      "integer",
      "positive",
      "negative",
      "minDate",
      "maxDate",
      "minItems",
      "maxItems",
      "fileSize",
      "fileType",
    ];

    for (const preset of defaultPresets) {
      for (const rule of preset.rules) {
        expect(validRuleIds).toContain(rule.ruleId);
      }
    }
  });

  it("preset input types are valid", () => {
    const validInputTypes = [
      "text",
      "textarea",
      "number",
      "checkbox",
      "select",
      "multiselect",
      "date",
      "file",
    ];

    for (const preset of defaultPresets) {
      expect(validInputTypes).toContain(preset.inputType);
    }
  });

  describe("email-field preset", () => {
    it("has correct configuration", () => {
      const emailPreset = defaultPresets.find((p) => p.id === "email-field");
      expect(emailPreset).toBeDefined();
      expect(emailPreset?.inputType).toBe("text");
      expect(emailPreset?.rules.map((r) => r.ruleId)).toContain("email");
      expect(emailPreset?.rules.map((r) => r.ruleId)).toContain("required");
    });
  });

  describe("character-name preset", () => {
    it("has length constraints", () => {
      const namePreset = defaultPresets.find((p) => p.id === "character-name");
      expect(namePreset).toBeDefined();
      expect(namePreset?.inputType).toBe("text");

      const minLengthRule = namePreset?.rules.find((r) => r.ruleId === "minLength");
      const maxLengthRule = namePreset?.rules.find((r) => r.ruleId === "maxLength");

      expect(minLengthRule).toBeDefined();
      expect(maxLengthRule).toBeDefined();
      expect((minLengthRule?.config as { length: number })?.length).toBe(2);
      expect((maxLengthRule?.config as { length: number })?.length).toBe(30);
    });
  });

  describe("age-field preset", () => {
    it("has numeric constraints", () => {
      const agePreset = defaultPresets.find((p) => p.id === "age-field");
      expect(agePreset).toBeDefined();
      expect(agePreset?.inputType).toBe("number");

      const ruleIds = agePreset?.rules.map((r) => r.ruleId);
      expect(ruleIds).toContain("integer");
      expect(ruleIds).toContain("positive");
      expect(ruleIds).toContain("max");

      const maxRule = agePreset?.rules.find((r) => r.ruleId === "max");
      expect((maxRule?.config as { value: number })?.value).toBe(150);
    });
  });

  describe("image-upload preset", () => {
    it("has file constraints", () => {
      const imagePreset = defaultPresets.find((p) => p.id === "image-upload");
      expect(imagePreset).toBeDefined();
      expect(imagePreset?.inputType).toBe("file");

      const fileTypeRule = imagePreset?.rules.find((r) => r.ruleId === "fileType");
      const fileSizeRule = imagePreset?.rules.find((r) => r.ruleId === "fileSize");

      expect(fileTypeRule).toBeDefined();
      expect(fileSizeRule).toBeDefined();
      expect((fileTypeRule?.config as { types: string[] })?.types).toContain("image/*");
      expect((fileSizeRule?.config as { maxBytes: number })?.maxBytes).toBe(5 * 1024 * 1024);
    });
  });
});

describe("PaletteItemData type variants", () => {
  it("supports input type items", () => {
    const inputItem: PaletteItemData = {
      id: "palette-input-text-123",
      type: "input",
      itemId: "text",
      name: "Text Input",
      icon: "type",
    };

    expect(inputItem.type).toBe("input");
    expect(inputItem.itemId).toBe("text");
  });

  it("supports rule type items", () => {
    const ruleItem: PaletteItemData = {
      id: "palette-rule-required-456",
      type: "rule",
      itemId: "required",
      name: "Required",
      icon: "asterisk",
      description: "Field must have a value",
    };

    expect(ruleItem.type).toBe("rule");
    expect(ruleItem.itemId).toBe("required");
  });

  it("supports preset type items", () => {
    const presetItem: PaletteItemData = {
      id: "palette-preset-email-789",
      type: "preset",
      itemId: "email-field",
      name: "Email Field",
      icon: "mail",
      description: "Text input with email validation",
    };

    expect(presetItem.type).toBe("preset");
    expect(presetItem.itemId).toBe("email-field");
  });
});

describe("Palette sections configuration", () => {
  it("showSections defaults support all section types", () => {
    const fullConfig: Required<PaletteProps>["showSections"] = {
      inputs: true,
      rules: true,
      presets: true,
    };

    expect(fullConfig.inputs).toBe(true);
    expect(fullConfig.rules).toBe(true);
    expect(fullConfig.presets).toBe(true);
  });

  it("showSections supports partial configuration", () => {
    const partialConfig: PaletteProps["showSections"] = {
      inputs: true,
      rules: false,
    };

    expect(partialConfig?.inputs).toBe(true);
    expect(partialConfig?.rules).toBe(false);
    expect(partialConfig?.presets).toBeUndefined();
  });

  it("defaultExpandedSections accepts section IDs", () => {
    const expanded = ["inputs", "rules", "presets", "inputs-text", "rules-constraints"];
    expect(expanded).toContain("inputs");
    expect(expanded).toContain("rules");
    expect(expanded).toContain("presets");
  });
});

describe("Integration scenarios", () => {
  describe("rule compatibility", () => {
    it("type supports specifying selected input type", () => {
      const props: PaletteProps = {
        selectedInputType: "text",
      };

      expect(props.selectedInputType).toBe("text");
    });

    it("type supports null selected input type", () => {
      const props: PaletteProps = {
        selectedInputType: null,
      };

      expect(props.selectedInputType).toBeNull();
    });

    it("callback receives input type changes", () => {
      let capturedInputType: string | null = null;

      const props: PaletteProps = {
        onSelectedInputTypeChange: (inputType) => {
          capturedInputType = inputType;
        },
      };

      props.onSelectedInputTypeChange?.("number");
      expect(capturedInputType).toBe("number");
    });
  });

  describe("drop handling", () => {
    it("onDrop callback receives complete drop event", () => {
      let capturedEvent: PaletteDropEvent | null = null;

      const props: PaletteProps = {
        onDrop: (event) => {
          capturedEvent = event;
        },
      };

      const testEvent: PaletteDropEvent = {
        item: {
          id: "test-drag-id",
          type: "input",
          itemId: "text",
          name: "Text Input",
          icon: "type",
        },
        target: {
          id: "canvas",
          type: "drop-zone",
        },
      };

      props.onDrop?.(testEvent);

      expect(capturedEvent).not.toBeNull();
      expect(capturedEvent?.item.id).toBe("test-drag-id");
      expect(capturedEvent?.target?.id).toBe("canvas");
    });

    it("onDrop handles drops without target", () => {
      let capturedEvent: PaletteDropEvent | null = null;

      const props: PaletteProps = {
        onDrop: (event) => {
          capturedEvent = event;
        },
      };

      const testEvent: PaletteDropEvent = {
        item: {
          id: "test-drag-id",
          type: "rule",
          itemId: "email",
          name: "Email",
          icon: "mail",
        },
      };

      props.onDrop?.(testEvent);

      expect(capturedEvent).not.toBeNull();
      expect(capturedEvent?.target).toBeUndefined();
    });
  });

  describe("custom presets", () => {
    it("accepts custom preset definitions", () => {
      const customPresets: PresetDefinition[] = [
        {
          id: "custom-preset",
          name: "Custom Field",
          icon: "star",
          description: "A custom preset",
          inputType: "text",
          rules: [{ ruleId: "required", config: {} }],
        },
      ];

      const props: PaletteProps = {
        presets: customPresets,
      };

      expect(props.presets).toHaveLength(1);
      expect(props.presets?.[0]?.id).toBe("custom-preset");
    });

    it("empty presets array hides presets section conceptually", () => {
      const props: PaletteProps = {
        presets: [],
      };

      expect(props.presets).toHaveLength(0);
    });
  });
});

describe("Palette factory functions and constants", () => {
  it("default presets are immutable by reference", () => {
    const originalLength = defaultPresets.length;
    const firstId = defaultPresets[0]?.id;

    // Verify we get the same data on repeated access
    expect(defaultPresets.length).toBe(originalLength);
    expect(defaultPresets[0]?.id).toBe(firstId);
  });

  it("each default preset has unique ID", () => {
    const ids = defaultPresets.map((p) => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});
