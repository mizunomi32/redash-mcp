import { z } from "zod";
import type { GetQueryUseCase } from "../../../application/usecases/GetQueryUseCase.js";
import { formatToolError } from "../toolError.js";

/**
 * Zod schema for the `get_query` MCP tool input.
 * Validated and parsed by the MCP SDK before the handler is called.
 */
export const getQuerySchema = {
  query_id: z.number().int().positive().describe("Numeric ID of the Redash query"),
};

/** Input type inferred from `getQuerySchema`. */
export type GetQueryInput = {
  query_id: number;
};

/**
 * Creates the handler function for the `get_query` MCP tool.
 *
 * The handler fetches the full query definition (SQL body, parameters,
 * metadata) and returns it as a JSON-formatted text content item.
 * Any `RedashError` or unexpected error is converted to an MCP error
 * response via `formatToolError`.
 *
 * @param useCase - Use case instance injected at server construction time.
 * @returns Async MCP tool handler.
 */
export function createGetQueryHandler(useCase: GetQueryUseCase) {
  return async (input: GetQueryInput) => {
    try {
      const result = await useCase.execute(input.query_id);
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
