export enum RedashErrorKind {
  Auth = "AUTH_ERROR",
  NotFound = "NOT_FOUND",
  Http = "HTTP_ERROR",
  Network = "NETWORK_ERROR",
  Sql = "SQL_ERROR",
  Timeout = "TIMEOUT",
  Config = "CONFIG_ERROR",
}

export class RedashError extends Error {
  constructor(
    public readonly kind: RedashErrorKind,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "RedashError";
  }
}
