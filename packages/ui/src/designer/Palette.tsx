/**
 * Input & Rule Palette (PZ-101)
 *
 * A sidebar component with draggable base inputs, validation rules, and presets
 * for the form designer canvas.
 */

import {
  type ReactNode,
  useState,
  useCallback,
  useMemo,
  createContext,
  useContext,
} from "react";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import type {
  InputTypeId,
  ValidationRuleId,
  BaseInputDefinition,
  ValidationRuleDefinition,
  ValidationRuleCategory,
} from "@phantom-zone/core";
import {
  getInputRegistry,
  getValidationRuleRegistry,
} from "@phantom-zone/core";

import { generateUUIDv7 } from "./types";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/**
 * Categories for organizing inputs in the palette.
 */
export type InputCategory = "text" | "number" | "choice" | "date" | "file";

/**
 * Categories for organizing rules in the palette.
 * Maps validation rule categories to palette-specific categories.
 */
export type RuleCategory = "constraints" | "format" | "options" | "gaming";

/**
 * Data for a draggable palette item.
 */
export interface PaletteItemData {
  /** Unique ID for this drag instance */
  id: string;
  /** Type of palette item */
  type: "input" | "rule" | "preset";
  /** The specific input type, rule ID, or preset ID */
  itemId: string;
  /** Display name */
  name: string;
  /** Icon identifier */
  icon: string;
  /** Description text */
  description?: string;
}

/**
 * Pre-composed field configuration combining input with rules.
 */
export interface PresetDefinition {
  /** Unique preset identifier */
  id: string;
  /** Display name */
  name: string;
  /** Icon identifier */
  icon: string;
  /** Description */
  description: string;
  /** The input type to create */
  inputType: InputTypeId;
  /** Pre-configured validation rules */
  rules: Array<{
    ruleId: ValidationRuleId;
    config: Record<string, unknown>;
  }>;
  /** Default field configuration */
  defaultConfig?: Record<string, unknown>;
}

/**
 * Event emitted when an item is dropped on the canvas.
 */
export interface PaletteDropEvent {
  /** The palette item that was dropped */
  item: PaletteItemData;
  /** Drop target information (if any) */
  target?: {
    id: string;
    type: string;
  };
}

// -----------------------------------------------------------------------------
// Default Presets
// -----------------------------------------------------------------------------

/**
 * Default preset configurations for common field patterns.
 */
export const defaultPresets: PresetDefinition[] = [
  {
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
  },
  {
    id: "character-name",
    name: "Character Name",
    icon: "user",
    description: "Name with length constraints",
    inputType: "text",
    rules: [
      { ruleId: "required", config: {} },
      { ruleId: "minLength", config: { length: 2 } },
      { ruleId: "maxLength", config: { length: 30 } },
    ],
    defaultConfig: {
      placeholder: "Enter character name",
    },
  },
  {
    id: "age-field",
    name: "Age Field",
    icon: "hash",
    description: "Positive integer for age",
    inputType: "number",
    rules: [
      { ruleId: "required", config: {} },
      { ruleId: "integer", config: {} },
      { ruleId: "positive", config: {} },
      { ruleId: "max", config: { value: 150 } },
    ],
  },
  {
    id: "url-field",
    name: "URL Field",
    icon: "link",
    description: "Text input with URL validation",
    inputType: "text",
    rules: [{ ruleId: "url", config: {} }],
    defaultConfig: {
      placeholder: "https://example.com",
    },
  },
  {
    id: "image-upload",
    name: "Image Upload",
    icon: "image",
    description: "File upload for images only",
    inputType: "file",
    rules: [
      { ruleId: "fileType", config: { types: ["image/*"] } },
      { ruleId: "fileSize", config: { maxBytes: 5 * 1024 * 1024 } },
    ],
    defaultConfig: {
      multiple: false,
    },
  },
  {
    id: "multi-choice",
    name: "Multi Choice",
    icon: "list-checks",
    description: "Multi-select with min/max items",
    inputType: "multiselect",
    rules: [
      { ruleId: "minItems", config: { min: 1 } },
      { ruleId: "maxItems", config: { max: 5 } },
    ],
    defaultConfig: {
      options: [],
      searchable: true,
    },
  },
];

// -----------------------------------------------------------------------------
// Context
// -----------------------------------------------------------------------------

interface PaletteContextValue {
  /** Currently selected input type ID (for rule compatibility) */
  selectedInputType: InputTypeId | null;
  /** Set the selected input type */
  setSelectedInputType: (inputType: InputTypeId | null) => void;
  /** Check if a rule is compatible with the selected input */
  isRuleCompatible: (ruleId: ValidationRuleId) => boolean;
  /** Currently dragging item */
  draggingItem: PaletteItemData | null;
  /** Expanded section IDs */
  expandedSections: Set<string>;
  /** Toggle section expansion */
  toggleSection: (sectionId: string) => void;
}

const PaletteContext = createContext<PaletteContextValue | null>(null);

/**
 * Hook to access the Palette context.
 * Must be used within a Palette component.
 */
export function usePalette(): PaletteContextValue {
  const context = useContext(PaletteContext);
  if (!context) {
    throw new Error("usePalette must be used within a Palette component");
  }
  return context;
}

// -----------------------------------------------------------------------------
// Utility Functions
// -----------------------------------------------------------------------------

/**
 * Maps input type categories to palette categories.
 */
function getInputCategoryLabel(category: BaseInputDefinition["category"]): InputCategory {
  switch (category) {
    case "text":
      return "text";
    case "choice":
      return "choice";
    case "date":
      return "date";
    case "file":
      return "file";
    case "other":
    default:
      return "text";
  }
}

/**
 * Maps validation rule categories to palette rule categories.
 */
function getRuleCategoryLabel(category: ValidationRuleCategory): RuleCategory {
  switch (category) {
    case "constraint":
      return "constraints";
    case "format":
      return "format";
    case "range":
      return "options";
    default:
      return "constraints";
  }
}

/**
 * Groups inputs by category.
 */
function groupInputsByCategory(
  inputs: BaseInputDefinition[]
): Record<InputCategory, BaseInputDefinition[]> {
  const groups: Record<InputCategory, BaseInputDefinition[]> = {
    text: [],
    number: [],
    choice: [],
    date: [],
    file: [],
  };

  for (const input of inputs) {
    const category = getInputCategoryLabel(input.category);
    // Special case: number input goes to number category
    if (input.id === "number") {
      groups.number.push(input);
    } else {
      groups[category].push(input);
    }
  }

  return groups;
}

/**
 * Groups rules by category.
 */
function groupRulesByCategory(
  rules: ValidationRuleDefinition[]
): Record<RuleCategory, ValidationRuleDefinition[]> {
  const groups: Record<RuleCategory, ValidationRuleDefinition[]> = {
    constraints: [],
    format: [],
    options: [],
    gaming: [],
  };

  for (const rule of rules) {
    const category = getRuleCategoryLabel(rule.category);
    groups[category].push(rule);
  }

  return groups;
}

// -----------------------------------------------------------------------------
// Draggable Palette Item
// -----------------------------------------------------------------------------

interface DraggablePaletteItemProps {
  item: PaletteItemData;
  disabled?: boolean;
  children: ReactNode;
}

function DraggablePaletteItem({
  item,
  disabled = false,
  children,
}: DraggablePaletteItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: item.id,
    data: item,
    disabled,
  });

  // Spread attributes first, then override aria-disabled to ensure our value is used
  const { "aria-disabled": _ariaDisabled, ...restAttributes } = attributes;

  return (
    <div
      ref={setNodeRef}
      data-testid={`palette-item-${item.itemId}`}
      data-dragging={isDragging}
      data-disabled={disabled}
      {...restAttributes}
      {...listeners}
      aria-disabled={disabled}
      style={{
        opacity: isDragging ? 0.5 : disabled ? 0.4 : 1,
        cursor: disabled ? "not-allowed" : isDragging ? "grabbing" : "grab",
      }}
    >
      {children}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Input Item
// -----------------------------------------------------------------------------

interface InputItemProps {
  definition: BaseInputDefinition;
}

function InputItem({ definition }: InputItemProps) {
  const itemData: PaletteItemData = useMemo(
    () => ({
      id: `palette-input-${definition.id}-${generateUUIDv7()}`,
      type: "input",
      itemId: definition.id,
      name: definition.name,
      icon: definition.icon,
      description: definition.description,
    }),
    [definition]
  );

  return (
    <DraggablePaletteItem item={itemData}>
      <div data-testid="input-item-content">
        <span data-testid="input-item-icon" aria-hidden="true">
          {definition.icon}
        </span>
        <div data-testid="input-item-text">
          <span data-testid="input-item-name">{definition.name}</span>
          {definition.description && (
            <span data-testid="input-item-description">{definition.description}</span>
          )}
        </div>
      </div>
    </DraggablePaletteItem>
  );
}

// -----------------------------------------------------------------------------
// Rule Item
// -----------------------------------------------------------------------------

interface RuleItemProps {
  definition: ValidationRuleDefinition;
}

function RuleItem({ definition }: RuleItemProps) {
  const { isRuleCompatible, selectedInputType } = usePalette();
  const isCompatible = isRuleCompatible(definition.id);
  const showCompatibilityIndicator = selectedInputType !== null;

  const itemData: PaletteItemData = useMemo(
    () => ({
      id: `palette-rule-${definition.id}-${generateUUIDv7()}`,
      type: "rule",
      itemId: definition.id,
      name: definition.name,
      icon: definition.icon,
      description: definition.description,
    }),
    [definition]
  );

  return (
    <DraggablePaletteItem item={itemData} disabled={showCompatibilityIndicator && !isCompatible}>
      <div
        data-testid="rule-item-content"
        data-compatible={showCompatibilityIndicator ? isCompatible : undefined}
      >
        <span data-testid="rule-item-icon" aria-hidden="true">
          {definition.icon}
        </span>
        <div data-testid="rule-item-text">
          <span data-testid="rule-item-name">{definition.name}</span>
          {definition.description && (
            <span data-testid="rule-item-description">{definition.description}</span>
          )}
        </div>
        {showCompatibilityIndicator && (
          <span
            data-testid="rule-compatibility-indicator"
            aria-label={isCompatible ? "Compatible with selected input" : "Incompatible with selected input"}
          >
            {isCompatible ? "+" : "-"}
          </span>
        )}
      </div>
    </DraggablePaletteItem>
  );
}

// -----------------------------------------------------------------------------
// Preset Item
// -----------------------------------------------------------------------------

interface PresetItemProps {
  preset: PresetDefinition;
}

function PresetItem({ preset }: PresetItemProps) {
  const itemData: PaletteItemData = useMemo(
    () => ({
      id: `palette-preset-${preset.id}-${generateUUIDv7()}`,
      type: "preset",
      itemId: preset.id,
      name: preset.name,
      icon: preset.icon,
      description: preset.description,
    }),
    [preset]
  );

  return (
    <DraggablePaletteItem item={itemData}>
      <div data-testid="preset-item-content">
        <span data-testid="preset-item-icon" aria-hidden="true">
          {preset.icon}
        </span>
        <div data-testid="preset-item-text">
          <span data-testid="preset-item-name">{preset.name}</span>
          {preset.description && (
            <span data-testid="preset-item-description">{preset.description}</span>
          )}
        </div>
      </div>
    </DraggablePaletteItem>
  );
}

// -----------------------------------------------------------------------------
// Collapsible Section
// -----------------------------------------------------------------------------

interface CollapsibleSectionProps {
  id: string;
  title: string;
  children: ReactNode;
  defaultExpanded?: boolean;
}

function CollapsibleSection({
  id,
  title,
  children,
}: CollapsibleSectionProps) {
  const { expandedSections, toggleSection } = usePalette();
  const isExpanded = expandedSections.has(id);

  return (
    <div data-testid={`palette-section-${id}`} role="region" aria-labelledby={`section-header-${id}`}>
      <button
        type="button"
        id={`section-header-${id}`}
        data-testid={`section-toggle-${id}`}
        onClick={() => toggleSection(id)}
        aria-expanded={isExpanded}
        aria-controls={`section-content-${id}`}
      >
        <span data-testid="section-title">{title}</span>
        <span data-testid="section-chevron" aria-hidden="true">
          {isExpanded ? "v" : ">"}
        </span>
      </button>
      {isExpanded && (
        <div
          id={`section-content-${id}`}
          data-testid={`section-content-${id}`}
          role="list"
          aria-label={`${title} items`}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Drag Preview
// -----------------------------------------------------------------------------

interface DragPreviewProps {
  item: PaletteItemData;
}

function DragPreview({ item }: DragPreviewProps) {
  return (
    <div data-testid="drag-preview" data-item-type={item.type}>
      <span data-testid="drag-preview-icon" aria-hidden="true">
        {item.icon}
      </span>
      <div data-testid="drag-preview-content">
        <span data-testid="drag-preview-type">
          {item.type === "input" ? "New Field" : item.type === "rule" ? "Add Rule" : "Preset"}
        </span>
        <span data-testid="drag-preview-name">{item.name}</span>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Palette Component
// -----------------------------------------------------------------------------

export interface PaletteProps {
  /** Currently selected input type for rule compatibility display */
  selectedInputType?: InputTypeId | null;
  /** Callback when selected input type changes (for external control) */
  onSelectedInputTypeChange?: (inputType: InputTypeId | null) => void;
  /** Callback when a palette item is dropped */
  onDrop?: (event: PaletteDropEvent) => void;
  /** Custom presets to use instead of defaults */
  presets?: PresetDefinition[];
  /** Which sections to show (defaults to all) */
  showSections?: {
    inputs?: boolean;
    rules?: boolean;
    presets?: boolean;
  };
  /** Initially expanded sections */
  defaultExpandedSections?: string[];
  /** Additional class name */
  className?: string;
  /** Children to render (e.g., custom header) */
  children?: ReactNode;
}

/**
 * Palette is a sidebar component providing draggable inputs, rules, and presets
 * for the form designer canvas.
 */
export function Palette({
  selectedInputType: controlledSelectedInputType,
  onSelectedInputTypeChange,
  onDrop,
  presets = defaultPresets,
  showSections = { inputs: true, rules: true, presets: true },
  defaultExpandedSections = ["inputs", "rules", "presets"],
  className,
  children,
}: PaletteProps) {
  // State
  const [internalSelectedInputType, setInternalSelectedInputType] = useState<InputTypeId | null>(null);
  const [draggingItem, setDraggingItem] = useState<PaletteItemData | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    () => new Set(defaultExpandedSections)
  );

  // Use controlled or internal state
  const selectedInputType = controlledSelectedInputType ?? internalSelectedInputType;
  const setSelectedInputType = useCallback(
    (inputType: InputTypeId | null) => {
      setInternalSelectedInputType(inputType);
      onSelectedInputTypeChange?.(inputType);
    },
    [onSelectedInputTypeChange]
  );

  // Get registries
  const inputRegistry = getInputRegistry();
  const ruleRegistry = getValidationRuleRegistry();

  // Group inputs and rules
  const groupedInputs = useMemo(
    () => groupInputsByCategory(inputRegistry.getAll()),
    [inputRegistry]
  );

  const groupedRules = useMemo(
    () => groupRulesByCategory(ruleRegistry.getAll()),
    [ruleRegistry]
  );

  // Check rule compatibility
  const isRuleCompatible = useCallback(
    (ruleId: ValidationRuleId): boolean => {
      if (!selectedInputType) return true;
      const ruleDef = ruleRegistry.get(ruleId);
      return ruleDef?.compatibleInputs.includes(selectedInputType) ?? false;
    },
    [selectedInputType, ruleRegistry]
  );

  // Toggle section expansion
  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  // Drag handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const item = event.active.data.current as PaletteItemData | undefined;
    if (item) {
      setDraggingItem(item);
    }
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const item = event.active.data.current as PaletteItemData | undefined;
      if (item && event.over) {
        onDrop?.({
          item,
          target: {
            id: String(event.over.id),
            type: String(event.over.data.current?.type ?? "unknown"),
          },
        });
      }
      setDraggingItem(null);
    },
    [onDrop]
  );

  const handleDragCancel = useCallback(() => {
    setDraggingItem(null);
  }, []);

  // Context value
  const contextValue = useMemo<PaletteContextValue>(
    () => ({
      selectedInputType,
      setSelectedInputType,
      isRuleCompatible,
      draggingItem,
      expandedSections,
      toggleSection,
    }),
    [selectedInputType, setSelectedInputType, isRuleCompatible, draggingItem, expandedSections, toggleSection]
  );

  // Input category labels
  const inputCategoryLabels: Record<InputCategory, string> = {
    text: "Text",
    number: "Number",
    choice: "Choice",
    date: "Date",
    file: "File",
  };

  // Rule category labels
  const ruleCategoryLabels: Record<RuleCategory, string> = {
    constraints: "Constraints",
    format: "Format",
    options: "Options",
    gaming: "Gaming",
  };

  return (
    <PaletteContext.Provider value={contextValue}>
      <DndContext
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <aside
          data-testid="palette"
          className={className}
          role="complementary"
          aria-label="Form element palette"
        >
          {children && (
            <div data-testid="palette-header">{children}</div>
          )}

          <nav data-testid="palette-content" aria-label="Palette sections">
            {/* Inputs Section */}
            {showSections.inputs && (
              <CollapsibleSection id="inputs" title="Inputs">
                {(Object.entries(groupedInputs) as [InputCategory, BaseInputDefinition[]][]).map(
                  ([category, inputs]) =>
                    inputs.length > 0 && (
                      <CollapsibleSection
                        key={category}
                        id={`inputs-${category}`}
                        title={inputCategoryLabels[category]}
                      >
                        {inputs.map((input) => (
                          <InputItem key={input.id} definition={input} />
                        ))}
                      </CollapsibleSection>
                    )
                )}
              </CollapsibleSection>
            )}

            {/* Rules Section */}
            {showSections.rules && (
              <CollapsibleSection id="rules" title="Rules">
                {(Object.entries(groupedRules) as [RuleCategory, ValidationRuleDefinition[]][]).map(
                  ([category, rules]) =>
                    rules.length > 0 && (
                      <CollapsibleSection
                        key={category}
                        id={`rules-${category}`}
                        title={ruleCategoryLabels[category]}
                      >
                        {rules.map((rule) => (
                          <RuleItem key={rule.id} definition={rule} />
                        ))}
                      </CollapsibleSection>
                    )
                )}
              </CollapsibleSection>
            )}

            {/* Presets Section */}
            {showSections.presets && presets.length > 0 && (
              <CollapsibleSection id="presets" title="Presets">
                {presets.map((preset) => (
                  <PresetItem key={preset.id} preset={preset} />
                ))}
              </CollapsibleSection>
            )}
          </nav>
        </aside>

        {/* Drag Overlay */}
        <DragOverlay>
          {draggingItem && <DragPreview item={draggingItem} />}
        </DragOverlay>
      </DndContext>
    </PaletteContext.Provider>
  );
}

// Export sub-components for flexibility
Palette.CollapsibleSection = CollapsibleSection;
Palette.InputItem = InputItem;
Palette.RuleItem = RuleItem;
Palette.PresetItem = PresetItem;
Palette.DragPreview = DragPreview;
