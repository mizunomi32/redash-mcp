/**
 * Discriminator codes that categorise every `RedashError`.
 * Consumers can switch on `error.kind` for structured error handling.
 */
export enum RedashErrorKind {
  /** API key missing, invalid, or insufficient permissions (HTTP 401/403). */
  Auth = "AUTH_ERROR",
  /** Requested resource does not exist (HTTP 404). */
  NotFound = "NOT_FOUND",
  /** Non-2xx HTTP response that is not auth or not-found. */
  Http = "HTTP_ERROR",
  /** TCP/DNS failure or fetch-level network error. */
  Network = "NETWORK_ERROR",
  /** Redash reported a SQL execution error or job failure. */
  Sql = "SQL_ERROR",
  /** Async job polling exceeded the configured timeout. */
  Timeout = "TIMEOUT",
  /** Invalid or missing environment-variable configuration. */
  Config = "CONFIG_ERROR",
}

/**
 * Typed domain error used throughout the application.
 * Carries a machine-readable `kind` code and an optional `details` object
 * for structured logging without leaking raw API responses to the user.
 */
export class RedashError extends Error {
  /**
   * @param kind - Category of the error.
   * @param message - Human-readable description.
   * @param details - Optional supplementary data (e.g. truncated response body).
   */
  constructor(
    public readonly kind: RedashErrorKind,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "RedashError";
  }
}
