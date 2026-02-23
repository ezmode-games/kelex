# Code Style & Conventions

## TypeScript Configuration

- **Strict mode:** enabled
- **Target:** ES2022
- **Module:** ESNext with bundler resolution
- **Declaration files:** generated

## Biome Rules (Enforced)

- `noUnusedImports`: error
- `noUnusedVariables`: error
- `noUnusedFunctionParameters`: error
- `noUnusedPrivateClassMembers`: error
- `noExplicitAny`: error (use `unknown` and narrow)
- `useConst`: error
- `useImportType`: error (use `import type` for type-only imports)
- `useExportType`: error (use `export type` for type-only exports)

## Formatting

- **Indent:** 2 spaces
- **Files:** include `src/**`, `test/**`, `*.ts`, `*.json`

## Naming Conventions

- **Files:** kebab-case (e.g., `default-map.ts`, `field-components.ts`)
- **Types/Interfaces:** PascalCase (e.g., `FieldDescriptor`, `GenerateOptions`)
- **Functions:** camelCase (e.g., `introspect`, `resolveField`)
- **Constants:** camelCase or SCREAMING_SNAKE_CASE for true constants

## Type Patterns

- Prefer explicit type annotations on exports
- Use union types for constrained strings
- Use generics for reusable utilities
- Use `Record<string, unknown>` for flexible config objects

## Export Patterns

- Use barrel exports via `index.ts` files
- Separate type exports from value exports
- Public API defined in `src/index.ts`

## Testing Patterns

- Test files mirror source structure: `src/foo/bar.ts` → `test/foo/bar.test.ts`
- Integration tests use `.spec.ts` extension
- Use `describe` blocks to group related tests
- Descriptive test names
- Mock data via `zocker` library

## Documentation

- JSDoc comments for public exports
- README.md for project overview and usage
