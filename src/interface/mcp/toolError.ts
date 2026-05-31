import { RedashError } from "../../domain/errors/RedashError.js";

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
