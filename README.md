# redash-mcp

Read-only MCP server for Redash. Allows AI agents (Claude etc.) to list, inspect, and execute existing Redash queries via the MCP protocol.

## Tools

| Tool | Description |
|---|---|
| `list_queries` | Search and list existing queries (id, name, tags, updated_at) |
| `get_query` | Get full query definition including SQL and parameter definitions |
| `run_query` | Execute a saved query and return results with async job polling |

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `REDASH_URL` | Yes | Base URL of your Redash instance (e.g. `https://redash.example.com`) |
| `REDASH_API_KEY` | Yes | Redash API key — use a read-only user's key |
| `REDASH_EXTRA_HEADERS` | No | JSON object of extra HTTP headers (e.g. for Cloudflare Access) |

> **Security**: The `Authorization` header is always set as `Key <REDASH_API_KEY>` and cannot be overridden via `REDASH_EXTRA_HEADERS`.

## Setup

### Claude Desktop — Docker

```json
{
  "mcpServers": {
    "redash": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "REDASH_URL",
        "-e", "REDASH_API_KEY",
        "-e", "REDASH_EXTRA_HEADERS",
        "redash-mcp:latest"
      ],
      "env": {
        "REDASH_URL": "https://redash.example.com",
        "REDASH_API_KEY": "<read-only-api-key>",
        "REDASH_EXTRA_HEADERS": "{\"CF-Access-Client-Id\":\"...\",\"CF-Access-Client-Secret\":\"...\"}"
      }
    }
  }
}
```

### Claude Desktop — Node direct

```json
{
  "mcpServers": {
    "redash": {
      "command": "node",
      "args": ["/absolute/path/to/redash-mcp/dist/index.js"],
      "env": {
        "REDASH_URL": "https://redash.example.com",
        "REDASH_API_KEY": "<read-only-api-key>"
      }
    }
  }
}
```

## Development

```bash
npm install
npm run build   # TypeScript compile
npm test        # Run Vitest tests
npm run dev     # Run directly with tsx (no build needed)
```

## Docker Build

```bash
docker build -t redash-mcp .
docker run --rm -i \
  -e REDASH_URL="https://redash.example.com" \
  -e REDASH_API_KEY="your-key" \
  redash-mcp
```

## Architecture

Clean Architecture layers:

```
interface/mcp  →  application/usecases  →  domain  ←  infrastructure/redash
```

- **domain**: Entities, repository interfaces, error types — no external dependencies
- **application**: Use cases (ListQueries, GetQuery, RunQuery with async polling)
- **infrastructure**: Redash HTTP client and repository implementations
- **interface/mcp**: MCP tool definitions and server wiring
- **index.ts**: Composition root — dependency injection and stdio transport startup
