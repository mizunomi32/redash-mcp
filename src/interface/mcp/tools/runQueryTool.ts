import { z } from "zod";
import type { RunQueryUseCase } from "../../../application/usecases/RunQueryUseCase.js";
import { formatToolError } from "../toolError.js";

/**
 * Zod schema for the `run_query` MCP tool input.
 * Validated and parsed by the MCP SDK before the handler is called.
 */
export const runQuerySchema = {
  query_id: z.number().int().positive().describe("Numeric ID of the Redash query to execute"),
  parameters: z
    .record(z.unknown())
    .optional()
    .describe("Query parameter values keyed by parameter name"),
  max_age: z
    .number()
    .int()
    .min(0)
    .default(0)
    .describe("Max cache age in seconds; 0 forces fresh execution"),
  row_limit: z.number().int().positive().max(10000).default(100).describe("Max rows to return"),
  timeout_sec: z
    .number()
    .int()
    .positive()
    .max(300)
    .default(60)
    .describe("Execution timeout in seconds"),
};

/** Input type inferred from `runQuerySchema`. */
export type RunQueryInput = {
  query_id: number;
  parameters?: Record<string, unknown>;
  max_age: number;
  row_limit: number;
  timeout_sec: number;
};

/**
 * Creates the handler function for the `run_query` MCP tool.
 *
 * Executes the query and returns results as JSON.  When the query does not
 * finish within `timeout_sec`, the handler returns a structured timeout
 * response (with `status: "in_progress_interrupted"` and the `job_id`) rather
 * than an error, so that callers can choose to retry or surface the partial
 * status to the user.
 * Any error is converted to an MCP error response via `formatToolError`.
 *
 * @param useCase - Use case instance injected at server construction time.
 * @returns Async MCP tool handler.
 */
export function createRunQueryHandler(useCase: RunQueryUseCase) {
  return async (input: RunQueryInput) => {
    try {
      const result = await useCase.execute({
        query_id: input.query_id,
        parameters: input.parameters,
        max_age: input.max_age,
        row_limit: input.row_limit,
        timeout_sec: input.timeout_sec,
      });

      if (result.kind === "timeout") {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  status: "in_progress_interrupted",
                  job_id: result.jobId,
                  message:
                    "Query is still running. The timeout was reached before results were available.",
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result.result, null, 2),
          },
        ],
      };
    } catch (error) {
      return formatToolError(error);
    }
  };
}
