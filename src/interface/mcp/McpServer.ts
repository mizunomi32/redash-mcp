import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GetQueryUseCase } from "../../application/usecases/GetQueryUseCase.js";
import type { ListQueriesUseCase } from "../../application/usecases/ListQueriesUseCase.js";
import type { RunQueryUseCase } from "../../application/usecases/RunQueryUseCase.js";
import { createGetQueryHandler, getQuerySchema } from "./tools/getQueryTool.js";
import { createListQueriesHandler, listQueriesSchema } from "./tools/listQueriesTool.js";
import { createRunQueryHandler, runQuerySchema } from "./tools/runQueryTool.js";

/**
 * Constructs and configures the MCP server instance.
 *
 * Registers the three read-only Redash tools (`list_queries`, `get_query`,
 * `run_query`) and wires each tool handler to its corresponding use case.
 * The returned `McpServer` is transport-agnostic; callers connect it to a
 * transport (e.g. `StdioServerTransport`) after creation.
 *
 * @param listQueriesUseCase - Use case for listing and searching queries.
 * @param getQueryUseCase - Use case for fetching a single query definition.
 * @param runQueryUseCase - Use case for executing a query and returning results.
 * @returns Configured `McpServer` ready to be connected to a transport.
 */
export function createMcpServer(
  listQueriesUseCase: ListQueriesUseCase,
  getQueryUseCase: GetQueryUseCase,
  runQueryUseCase: RunQueryUseCase,
): McpServer {
  const server = new McpServer({
    name: "redash-mcp",
    version: "1.0.0",
  });

  server.tool(
    "list_queries",
    "List and search existing Redash queries. Returns id, name, tags, and updated_at for each match. Does not return SQL body.",
    listQueriesSchema,
    createListQueriesHandler(listQueriesUseCase),
  );

  server.tool(
    "get_query",
    "Get the full definition of a Redash query including SQL body, parameter definitions, data source ID, and metadata.",
    getQuerySchema,
    createGetQueryHandler(getQueryUseCase),
  );

  server.tool(
    "run_query",
    "Execute a saved Redash query and return results. Handles async execution with polling. Results are truncated to row_limit rows.",
    runQuerySchema,
    createRunQueryHandler(runQueryUseCase),
  );

  return server;
}
