# Task Completion Checklist

When completing a task in kelex, follow this checklist:

## Before Committing

1. **Run full validation:**
   ```bash
   pnpm install && pnpm build && pnpm test:all && pnpm lint && pnpm typecheck
   ```

2. **Check for unused code:**
   - No unused imports, variables, or parameters (Biome enforces this)
   - Remove commented-out code

3. **Verify exports:**
   - New public APIs exported from `src/index.ts`
   - Types exported with `export type` syntax

4. **Write tests:**
   - Unit tests for new functionality
   - Aim for >80% coverage of new code (enforced in vitest.config.ts)
   - Test edge cases and error conditions

## Git Hooks (Automatic via Lefthook)

**Pre-commit (parallel):**
- Biome lint check on staged files
- TypeScript type check

**Pre-push:**
- Full flightcheck (lint + typecheck + all tests)

## Quick Commands

```bash
# Before committing
pnpm preflight

# Before pushing
pnpm flightcheck
```

## What NOT to Do

- Don't skip git hooks (`--no-verify`)
- Don't commit with failing tests
- Don't use `any` - use `unknown` and narrow
- Don't leave unused imports or variables
