# Suggested Commands

## Development

```bash
# Install dependencies
pnpm install

# Build the project
pnpm build

# Watch mode development
pnpm dev

# Type checking
pnpm typecheck
```

## Testing

```bash
# Run unit tests (excludes .spec.ts files)
pnpm test

# Run unit tests only
pnpm test:unit

# Run integration/spec tests only
pnpm test:spec

# Run all tests
pnpm test:all

# Watch mode
pnpm test:watch

# With coverage
pnpm test:coverage
```

## Linting & Formatting

```bash
# Check for lint errors
pnpm lint

# Fix lint errors and format
pnpm lint:fix

# Format only
pnpm format
```

## Pre-commit Checks

```bash
# Quick preflight (lint + typecheck + unit tests)
pnpm preflight

# Full flightcheck (lint + typecheck + all tests)
pnpm flightcheck
```

## CLI Usage

```bash
# Run the CLI locally (after build)
node dist/cli.js generate ./path/to/schema.ts -s schemaName

# Or via pnpx
pnpx kelex generate ./path/to/schema.ts -s schemaName
```

## Releases

```bash
# Create changeset
pnpm changeset

# Version packages
pnpm version

# Build and publish
pnpm release
```
