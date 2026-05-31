import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GetQueryUseCase } from "../../application/usecases/GetQueryUseCase.js";
import type { ListQueriesUseCase } from "../../application/usecases/ListQueriesUseCase.js";
import type { RunQueryUseCase } from "../../application/usecases/RunQueryUseCase.js";
import { createGetQueryHandler, getQuerySchema } from "./tools/getQueryTool.js";
import { createListQueriesHandler, listQueriesSchema } from "./tools/listQueriesTool.js";
import { createRunQueryHandler, runQuerySchema } from "./tools/runQueryTool.js";

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
