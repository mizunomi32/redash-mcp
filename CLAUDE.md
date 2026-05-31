# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Does

**redash-mcp** is a read-only MCP (Model Context Protocol) server that lets AI agents interact with Redash via three tools:

| Tool | Description |
|---|---|
| `list_queries` | List and search saved queries (id, name, tags) |
| `get_query` | Fetch a full query definition including SQL body |
| `run_query` | Execute a query and return (possibly truncated) results |

It is intentionally read-only — no create, update, or delete operations on queries. Runtime config comes from environment variables (`REDASH_URL`, `REDASH_API_KEY`, `REDASH_EXTRA_HEADERS`). The server communicates over **stdio** and is designed to be registered with MCP hosts such as Claude Desktop.

## Commands

```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript → dist/
npm test             # Run all Vitest tests
npm run test:watch   # Vitest in watch mode
npm run dev          # Run directly via tsx (no build needed)
npm start            # Run compiled dist/index.js
npm run clean        # Remove dist/
```

To run a single test file:
```bash
npx vitest run tests/unit/application/RunQueryUseCase.test.ts
```

## Architecture

The project follows Clean Architecture with strict layering. Dependencies only flow inward:

```
interface/mcp  →  application/usecases  →  domain  ←  infrastructure/redash
```

**`src/domain/`** — No external dependencies. Defines:
- Entities (`Query`, `Job`, `QueryResult`)
- Repository interfaces (`IQueryRepository`, `IJobRepository`)
- `RedashError` with a typed `RedashErrorKind` enum (Auth, NotFound, Http, Network, Sql, Timeout, Config)

**`src/application/usecases/`** — Business logic only, depends on domain interfaces:
- `RunQueryUseCase` handles async job polling with exponential backoff (1s → 8s max, 60s default timeout)
- Use cases never import from `infrastructure/` or `interface/`

**`src/infrastructure/redash/`** — Implements domain interfaces against the Redash HTTP API:
- `RedashHttpClient`: native `fetch` wrapper that maps HTTP errors to `RedashError`
- `RedashQueryRepository` / `RedashJobRepository`: map Redash API types to domain entities
- `types/redashApiTypes.ts`: mirrors the Redash API response shapes

**`src/interface/mcp/`** — MCP protocol layer:
- Each tool has its own file with a Zod schema and handler (`listQueriesTool.ts`, `getQueryTool.ts`, `runQueryTool.ts`)
- `toolError.ts` formats `RedashError` and generic errors into MCP error responses
- `McpServer.ts` wires use cases to tool handlers

**`src/index.ts`** — Composition root only: loads config, instantiates infrastructure, wires use cases, starts the MCP stdio transport.

**`src/config/Config.ts`** — Validates required env vars at startup, parses `REDASH_EXTRA_HEADERS` as JSON, and prevents `Authorization` header override from extra headers.

## Code quality

### Linter — Biome

[Biome](https://biomejs.dev/) v2 is used for linting and formatting (replaces ESLint + Prettier).

```bash
npm run lint         # Check src/ and tests/ (read-only)
npm run lint:fix     # Auto-fix all safe issues
```

Configuration: [`biome.json`](./biome.json)

Key settings:
- Indent: 2 spaces
- Line width: 100 characters
- Quotes: double
- Import ordering: automatic (via `assist.actions.source.organizeImports`)
- Rules: `recommended` + `suspicious.noExplicitAny` (warn) + `style.noNonNullAssertion` (warn)

### Type checker — tsc

```bash
npm run typecheck    # tsc --noEmit (no output, type-check only)
```

TypeScript is configured in [`tsconfig.json`](./tsconfig.json) with `strict: true`.

### Pre-commit hook — Husky + lint-staged

[Husky](https://typicode.com/husky) runs two checks automatically on every `git commit`:

1. **lint-staged** — runs `biome check --write` on staged `*.ts` / `*.js` files only (fast).
2. **tsc --noEmit** — full project-wide type check.

If either step fails the commit is aborted.

Hook source: [`.husky/pre-commit`](./.husky/pre-commit)

## JSDoc conventions

Every source file in `src/` carries JSDoc comments following these rules:

- **Interfaces and types** — each field documented with an inline `/** ... */` comment describing its meaning, units, or constraints.
- **Classes** — class-level doc describes responsibility; constructor `@param` tags document injected dependencies.
- **Public methods** — `@param`, `@returns`, and `@throws` tags; describe behaviour at the boundary, not implementation details.
- **Private helpers** — brief description + `@param` / `@returns` when the signature alone is ambiguous.
- **Enums** — each member documents the semantic meaning (not just the numeric value).
- **Test files** — a single file-level `/** Unit tests for ... */` comment; individual test cases are self-documenting via `describe`/`it` labels.

Do **not** add comments that merely restate the type or the identifier name.

## Key Technical Details

- **ESM-only** (`"type": "module"` in package.json); imports require `.js` extensions even for `.ts` source files
- **TypeScript strict mode** targeting ES2022 with `NodeNext` module resolution
- **Node >=18** required (uses native `fetch`)
- Tests use **Vitest** with globals (`describe`, `it`, `expect`, `vi`) and mock repositories via `vi.fn()`
- Error details in `RedashError` must never include secrets (API keys, auth headers)

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `REDASH_URL` | Yes | Base URL of the Redash instance (trailing slash stripped automatically) |
| `REDASH_API_KEY` | Yes | Redash API key (`Authorization: Key <value>`) |
| `REDASH_EXTRA_HEADERS` | No | JSON object of additional HTTP headers; `Authorization` is silently ignored |
