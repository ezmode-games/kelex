# Codebase Architecture

# Codebase Architecture

## Key Architectural Decision

Phantom-zone is built ON rafters. Rafters provides the design system, UI primitives,
editor components, and hooks. Phantom-zone provides form-specific business logic,
code generation, and storage.

- **Input side:** phantom-zone's editor and designer use rafters components
- **Output side:** codegen generates forms that import from `@/components/ui` (shadcn/rafters API compatible)
- **Rafters components are NOT reimplemented** — phantom-zone is a thin orchestration layer

## Package Dependencies

```
@rafters/ui (external - sister project)
    ├── components/editor: BlockCanvas, BlockWrapper, BlockSidebar, PropertyEditor,
    │                      EditorToolbar, CommandPaletteUI, InlineToolbar
    ├── components/media: Image, Embed
    ├── hooks: useBlockSelection, useHistory, useDragDrop, useClipboard, useCommandPalette
    └── primitives: selection, history, drag-drop, clipboard, command-palette, etc.

@phantom-zone/codegen (CLI + API for code generation)
    └── Uses Zod 4 for schema introspection

@phantom-zone/core (runtime components)
    └── Peer deps: React, Zod 4
    ├── registry/     - Input and validation rule registries
    ├── layout/       - Form layout engine (conditional visibility)
    ├── validation/   - Error display and messages
    ├── accessibility/ - WCAG compliance (focus, keyboard, contrast, aria)
    ├── persistence/  - Form state persistence
    ├── hooks/        - Form submission handler
    └── composer/     - Rule composition engine

@phantom-zone/ui (form designer components)
    └── Depends on: @phantom-zone/core

@phantom-zone/edit (thin layer on rafters - TO BE REBUILT)
    └── Depends on: @rafters/ui, @phantom-zone/core, @phantom-zone/storage
    ├── blocks/        - Block type definitions + renderers (wrapping rafters components)
    ├── editor/        - Composed PageEditor wiring rafters components together
    ├── persistence/   - Auto-save + versioning via @phantom-zone/storage
    ├── serialization/ - MDX import/export
    └── pages/         - Multi-page management

@phantom-zone/storage (Cloudflare services)
    └── R2 storage client
    └── Schema, response, content, asset services
```

## Rafters Block Model

The block model comes from rafters:
```typescript
interface Block {
  id: string;
  type: string;
  props: Record<string, unknown>;
  children?: Block[];
}

interface BlockDefinition {
  type: string;
  label: string;
  description?: string;
  icon?: string;
  category: string;
  keywords?: string[];
}

interface BlockRegistry {
  blocks: BlockDefinition[];
  categories: { id: string; label: string; order?: number }[];
}
```

Phantom-zone provides block renderers via `BlockCanvas.renderBlock` and
Zod schemas per block type for `PropertyEditor`.

## Key Modules

### packages/codegen
- `cli.ts` - Command line interface
- `introspection/` - Analyzes Zod schemas (types, checks, unwrapping)
- `mapping/` - Maps Zod types to UI components
- `codegen/` - Generates React form code
  - `templates/` - Code templates for form wrapper and fields

### packages/core
- `registry/inputs.ts` - Input component registry
- `registry/rules.ts` - Validation rule registry
- `layout/engine.ts` - Computes form layout with conditional visibility
- `validation/errors.ts` - Validation error utilities
- `accessibility/` - Focus management, keyboard nav, contrast checks
- `persistence/storage.ts` - Form draft persistence
- `hooks/useFormSubmit.ts` - Form submission hook

### packages/ui
- Form designer canvas
- Input & rule palettes
- Field property editor
- Conditional logic builder
- Schema export/import
- Live preview

## Design Patterns

1. **Registry Pattern:** Input and validation rule registries allow extensibility
2. **Visitor/Introspection:** Schema introspection walks Zod schema tree
3. **Composition:** Rafters provides primitives, PZ composes them
4. **Thin Wrapper:** Block renderers wrap rafters components with PZ-specific schemas

## Testing Strategy

- Unit tests alongside source: `test/` mirrors `src/`
- Test runner: Vitest
- Lock file prevents parallel test execution (shared resources)
- Component testing: Vitest + @testing-library/react + happy-dom (NOT playwright-ct)
- Avoid playwright-ct — causes memory blowup and thermal shutdown