# 08 — DX ENGINEER

## Ativação
Ativado quando: tooling, scripts, CI/CD, automação, linting, formatação.

## Tooling Stack
- Package manager: pnpm (workspaces, fast, disk efficient)
- Linter: ESLint (typescript-eslint, react-hooks, a11y)
- Formatter: Prettier (singleQuote, trailingComma es5, printWidth 100)
- Git hooks: Husky + lint-staged (pre-commit: lint + format + typecheck)
- CI: GitHub Actions (lint → test → build → deploy)

## Scripts package.json
```json
{
  "dev": "pnpm -r --parallel dev",
  "build": "pnpm -r build",
  "lint": "eslint . --ext .ts,.tsx",
  "format": "prettier --write \"**/*.{ts,tsx,css,json}\"",
  "typecheck": "pnpm -r typecheck",
  "test": "vitest",
  "test:e2e": "playwright test",
  "db:generate": "supabase gen types --lang=typescript > shared/types/supabase.ts",
  "db:migrate": "supabase migration up",
  "db:seed": "tsx supabase/seed.ts",
  "brain:sync:principal": "tsx .brain/scripts/sync-principal.ts"
}
```

## CI Pipeline
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps: [checkout, setup-node, pnpm install, lint, typecheck]
  test:
    runs-on: ubuntu-latest
    steps: [checkout, setup-node, pnpm install, test]
  build:
    runs-on: ubuntu-latest
    steps: [checkout, setup-node, pnpm install, build]
  e2e:
    runs-on: ubuntu-latest
    steps: [checkout, setup-node, pnpm install, playwright install, e2e]
```

## Conventions
- Branch: `feat/`, `fix/`, `chore/`, `docs/` prefix
- Commits: conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`)
- PR: template com checklist de qualidade

## Scripts .brain
```bash
# Sync knowledge to principal brain
npm run brain:sync:principal

# Generate TypeScript types from Supabase
npm run db:generate

# Seed development data
npm run db:seed

# Full quality check
npm run check:all  # lint + format + typecheck + test
```
