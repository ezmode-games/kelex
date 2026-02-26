# Kelex - Project Overview

## Purpose

Kelex is a CLI tool and library that generates type-safe React form components from Zod schemas. It reads a Zod schema and outputs a complete React form with:
- Full TypeScript types inferred from the schema
- TanStack Form for state management and validation
- Appropriate UI components (Rafters/shadcn) for each field type
- Client-side validation using the Zod schema

## Tech Stack

- **Language:** TypeScript (strict mode, ES2022 target)
- **Runtime:** Node.js
- **Package Manager:** pnpm
- **Build:** tsup
- **Testing:** Vitest
- **Linting/Formatting:** Biome
- **Validation:** Zod 4
- **Git Hooks:** Lefthook
- **CLI Framework:** Commander

## Dependencies

- `zod@^4.0.0` - Peer dependency for schema definitions
- `commander@^12.0.0` - CLI framework

## Repository

- GitHub: https://github.com/ezmode-games/kelex
- License: MIT
- Homepage: https://ezmode.games/oss/kelex

## Codebase Structure

```
src/
├── cli.ts                    # CLI entry point (Commander-based)
├── index.ts                  # Public API exports
├── introspection/            # Schema analysis
│   ├── introspect.ts         # Main introspection logic
│   ├── unwrap.ts             # Unwrap schema wrappers (optional, nullable, etc.)
│   ├── checks.ts             # Check detection (email, url, min, max, etc.)
│   └── types.ts              # Type definitions
├── mapping/                  # Field → component mapping
│   ├── resolver.ts           # Resolves fields to components
│   ├── default-map.ts        # Default mapping rules
│   └── types.ts              # Type definitions
└── codegen/                  # Code generation
    ├── generator.ts          # Main generator
    └── templates/            # Code templates
        ├── form-wrapper.ts   # Form component wrapper
        └── field-components.ts # Field JSX generation

test/                         # Mirrors src/ structure
├── introspection/
├── mapping/
├── codegen/
├── fixtures/                 # Test schemas
└── cli.spec.ts               # CLI integration tests
```

## Core Pipeline

```
Zod Schema → Introspection → Field Descriptors → Mapping → Component Config → Codegen → React Form
```

1. **Introspection** - Analyze Zod schema structure, extract field types and constraints
2. **Mapping** - Match field types to appropriate UI components
3. **Codegen** - Generate React form component code
