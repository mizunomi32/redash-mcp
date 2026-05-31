import { RedashError, RedashErrorKind } from "../domain/errors/RedashError.js";

/**
 * Immutable runtime configuration derived from environment variables.
 * Both `baseUrl` and `headers` are frozen to prevent accidental mutation
 * after the composition root initialises the application.
 */
export interface RedashConfig {
  /** Redash base URL with no trailing slash (e.g. `https://redash.example.com`). */
  readonly baseUrl: string;
  /** HTTP headers sent with every request, including the `Authorization` key. */
  readonly headers: Readonly<Record<string, string>>;
}

/**
 * Reads and validates environment variables, then returns a frozen
 * `RedashConfig` ready for injection into the HTTP client.
 *
 * Required environment variables:
 * - `REDASH_URL` — base URL of the Redash instance.
 * - `REDASH_API_KEY` — API key used for Bearer authentication.
 *
 * Optional:
 * - `REDASH_EXTRA_HEADERS` — JSON object of additional HTTP headers.
 *   Any attempt to override `Authorization` via this variable is silently
 *   dropped.
 *
 * @throws {RedashError} with kind `Config` when a required variable is absent
 *   or `REDASH_EXTRA_HEADERS` is malformed.
 */
export function loadConfig(): RedashConfig {
  const redashUrl = process.env.REDASH_URL;
  const apiKey = process.env.REDASH_API_KEY;

  if (!redashUrl) {
    throw new RedashError(RedashErrorKind.Config, "REDASH_URL environment variable is required");
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
    Accept: "application/json",
    // Authorization is always last to prevent REDASH_EXTRA_HEADERS override
    Authorization: `Key ${apiKey}`,
  };

  return Object.freeze({ baseUrl, headers: Object.freeze(headers) });
}

/**
 * Parses the optional `REDASH_EXTRA_HEADERS` JSON string into a header map.
 * Non-string values and the `Authorization` key are silently ignored.
 *
 * @param raw - Raw JSON string from the environment variable, or `undefined`.
 * @returns A sanitised header map (possibly empty).
 * @throws {RedashError} with kind `Config` when `raw` is not valid JSON or not
 *   a plain object.
 */
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
    throw new RedashError(RedashErrorKind.Config, "REDASH_EXTRA_HEADERS must be a JSON object");
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
