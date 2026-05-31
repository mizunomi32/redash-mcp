import { RedashError } from "../../domain/errors/RedashError.js";

/**
 * Converts any thrown value into an MCP tool error response.
 *
 * `RedashError` instances are formatted with their `kind` code prefix and
 * optional `details`; all other errors fall back to a generic message.
 * The returned object conforms to the MCP tool response shape with
 * `isError: true` so that clients can distinguish errors from normal results.
 *
 * @param error - The caught value (may be any type).
 * @returns An MCP-compatible error response with a single text content item.
 */
export function formatToolError(error: unknown): {
  content: [{ type: "text"; text: string }];
  isError: true;
} {
  let text: string;

  if (error instanceof RedashError) {
    text = `[${error.kind}] ${error.message}`;
    if (error.details) {
      text += `\nDetails: ${JSON.stringify(error.details)}`;
    }
  } else if (error instanceof Error) {
    text = `Unexpected error: ${error.message}`;
  } else {
    text = `Unexpected error: ${String(error)}`;
  }

  return { content: [{ type: "text" as const, text }], isError: true };
}
