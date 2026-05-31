import { z } from "zod";
import type { ListQueriesUseCase } from "../../../application/usecases/ListQueriesUseCase.js";
import { formatToolError } from "../toolError.js";

/**
 * Zod schema for the `list_queries` MCP tool input.
 * Validated and parsed by the MCP SDK before the handler is called.
 */
export const listQueriesSchema = {
  search: z.string().optional().describe("Search term to filter queries by name or tags"),
  page: z.number().int().positive().default(1).describe("Page number (1-based)"),
  page_size: z.number().int().positive().max(100).default(25).describe("Results per page"),
};

/** Input type inferred from `listQueriesSchema`. */
export type ListQueriesInput = {
  search?: string;
  page: number;
  page_size: number;
};

/**
 * Creates the handler function for the `list_queries` MCP tool.
 *
 * The handler returns a paginated list of query summaries (id, name, tags,
 * updated_at) as a JSON-formatted text content item.  SQL bodies are not
 * included; use `get_query` to fetch a full query definition.
 * Any error is converted to an MCP error response via `formatToolError`.
 *
 * @param useCase - Use case instance injected at server construction time.
 * @returns Async MCP tool handler.
 */
export function createListQueriesHandler(useCase: ListQueriesUseCase) {
  return async (input: ListQueriesInput) => {
    try {
      const result = await useCase.execute(input);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return formatToolError(error);
    }
  };
}
