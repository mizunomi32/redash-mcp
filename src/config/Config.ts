import { RedashError, RedashErrorKind } from "../domain/errors/RedashError.js";

export interface RedashConfig {
  readonly baseUrl: string;
  readonly headers: Readonly<Record<string, string>>;
}

export function loadConfig(): RedashConfig {
  const redashUrl = process.env.REDASH_URL;
  const apiKey = process.env.REDASH_API_KEY;

  if (!redashUrl) {
    throw new RedashError(
      RedashErrorKind.Config,
      "REDASH_URL environment variable is required",
    );
  }

  if (!apiKey) {
    throw new RedashError(
      RedashErrorKind.Config,
      "REDASH_API_KEY environment variable is required",
    );
  }

  const baseUrl = redashUrl.replace(/\/$/, "");
  const extraHeaders = parseExtraHeaders(process.env.REDASH_EXTRA_HEADERS);

  const headers: Record<string, string> = {
    ...extraHeaders,
    "Content-Type": "application/json",
    "Accept": "application/json",
    // Authorization is always last to prevent REDASH_EXTRA_HEADERS override
    "Authorization": `Key ${apiKey}`,
  };

  return Object.freeze({ baseUrl, headers: Object.freeze(headers) });
}

function parseExtraHeaders(raw: string | undefined): Record<string, string> {
  if (!raw) return {};

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new RedashError(
      RedashErrorKind.Config,
      `REDASH_EXTRA_HEADERS is not valid JSON: ${(e as Error).message}`,
    );
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new RedashError(
      RedashErrorKind.Config,
      "REDASH_EXTRA_HEADERS must be a JSON object",
    );
  }

  const sanitized: Record<string, string> = {};
  for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (key.toLowerCase() === "authorization") {
      // Silently drop — never log the attempted value
      continue;
    }
    if (typeof value === "string") {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
