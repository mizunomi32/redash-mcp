# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Does

**redash-mcp** is a read-only MCP (Model Context Protocol) server that lets AI agents interact with Redash via three tools: `list_queries`, `get_query`, and `run_query`. It is intentionally read-only — no create, update, or delete operations on queries. Runtime config comes from environment variables (`REDASH_URL`, `REDASH_API_KEY`, `REDASH_EXTRA_HEADERS`).

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

## Key Technical Details

- **ESM-only** (`"type": "module"` in package.json); imports require `.js` extensions even for `.ts` source files
- **TypeScript strict mode** targeting ES2022 with `NodeNext` module resolution
- **Node >=18** required (uses native `fetch`)
- Tests use **Vitest** with globals (`describe`, `it`, `expect`, `vi`) and mock repositories via `vi.fn()`
- Error details in `RedashError` must never include secrets (API keys, auth headers)
