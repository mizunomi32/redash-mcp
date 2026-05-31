import { RedashError, RedashErrorKind } from "../../domain/errors/RedashError.js";

/** Minimal configuration required by `RedashHttpClient`. */
export interface RedashClientConfig {
  /** Redash base URL with no trailing slash. */
  baseUrl: string;
  /** HTTP headers merged into every request (must include `Authorization`). */
  headers: Readonly<Record<string, string>>;
}

/**
 * Thin HTTP client for the Redash REST API.
 *
 * Wraps the global `fetch` API and maps HTTP-level errors to typed
 * `RedashError` instances so that upper layers never see raw `Response`
 * objects or generic `Error`s from network failures.
 *
 * All requests include the headers supplied via `RedashClientConfig`, which
 * must contain a valid `Authorization: Key <api-key>` header.
 */
export class RedashHttpClient {
  /** @param config - Base URL and default headers for every request. */
  constructor(private readonly config: RedashClientConfig) {}

  /**
   * Sends a GET request and returns the JSON-decoded response body.
   *
   * @param path - API path relative to `baseUrl` (e.g. `/api/queries/1`).
   * @returns Parsed response body cast to `T`.
   * @throws {RedashError} on network, auth, not-found, or other HTTP errors.
   */
  async get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: "GET" });
  }

  /**
   * Sends a POST request with a JSON body and returns the JSON-decoded response.
   *
   * @param path - API path relative to `baseUrl`.
   * @param body - Request payload; will be serialised to JSON.
   * @returns Parsed response body cast to `T`.
   * @throws {RedashError} on network, auth, not-found, or other HTTP errors.
   */
  async post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  /**
   * Core fetch wrapper shared by `get` and `post`.
   * Maps HTTP status codes to specific `RedashErrorKind` values.
   *
   * @param path - API path relative to `baseUrl`.
   * @param options - `RequestInit` options (method, body, etc.).
   * @returns Parsed response body cast to `T`.
   */
  private async request<T>(path: string, options: RequestInit): Promise<T> {
    const url = `${this.config.baseUrl}${path}`;
    let response: Response;

    try {
      response = await fetch(url, {
        ...options,
        headers: { ...this.config.headers },
      });
    } catch (e) {
      throw new RedashError(
        RedashErrorKind.Network,
        `Network error while connecting to Redash: ${(e as Error).message}`,
      );
    }

    if (response.status === 401 || response.status === 403) {
      throw new RedashError(
        RedashErrorKind.Auth,
        `Authentication failed (HTTP ${response.status}). Check your REDASH_API_KEY.`,
      );
    }

    if (response.status === 404) {
      throw new RedashError(RedashErrorKind.NotFound, `Resource not found: ${path}`);
    }

    if (!response.ok) {
      let body = "";
      try {
        body = await response.text();
      } catch {
        // ignore read errors
      }
      throw new RedashError(
        RedashErrorKind.Http,
        `HTTP ${response.status}: ${response.statusText}`,
        { body: body.slice(0, 500) },
      );
    }

    return response.json() as Promise<T>;
  }
}
