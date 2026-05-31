import { RedashError, RedashErrorKind } from "../../domain/errors/RedashError.js";

export interface RedashClientConfig {
  baseUrl: string;
  headers: Readonly<Record<string, string>>;
}

export class RedashHttpClient {
  constructor(private readonly config: RedashClientConfig) {}

  async get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: "GET" });
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

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
      throw new RedashError(
        RedashErrorKind.NotFound,
        `Resource not found: ${path}`,
      );
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
