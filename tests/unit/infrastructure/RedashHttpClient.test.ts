import { describe, it, expect, vi, afterEach } from "vitest";
import { RedashHttpClient } from "../../../src/infrastructure/redash/RedashHttpClient.js";
import { RedashErrorKind } from "../../../src/domain/errors/RedashError.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

afterEach(() => {
  vi.clearAllMocks();
});

function makeResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: String(status),
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as unknown as Response;
}

describe("RedashHttpClient", () => {
  const config = {
    baseUrl: "https://redash.example.com",
    headers: Object.freeze({
      Authorization: "Key test-api-key",
      "Content-Type": "application/json",
    }),
  };

  it("sends Authorization header from config", async () => {
    mockFetch.mockResolvedValue(makeResponse(200, { results: [] }));

    const client = new RedashHttpClient(config);
    await client.get("/api/queries");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://redash.example.com/api/queries",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Key test-api-key" }),
      }),
    );
  });

  it("throws Auth error on 401", async () => {
    mockFetch.mockResolvedValue(makeResponse(401, { message: "Unauthorized" }));

    const client = new RedashHttpClient(config);
    await expect(client.get("/api/queries")).rejects.toMatchObject({
      kind: RedashErrorKind.Auth,
    });
  });

  it("throws Auth error on 403", async () => {
    mockFetch.mockResolvedValue(makeResponse(403, { message: "Forbidden" }));

    const client = new RedashHttpClient(config);
    await expect(client.get("/api/queries/1")).rejects.toMatchObject({
      kind: RedashErrorKind.Auth,
    });
  });

  it("throws NotFound error on 404", async () => {
    mockFetch.mockResolvedValue(makeResponse(404, { message: "Not Found" }));

    const client = new RedashHttpClient(config);
    await expect(client.get("/api/queries/999")).rejects.toMatchObject({
      kind: RedashErrorKind.NotFound,
    });
  });

  it("throws Network error on fetch exception", async () => {
    mockFetch.mockRejectedValue(new Error("connection refused"));

    const client = new RedashHttpClient(config);
    await expect(client.get("/api/queries")).rejects.toMatchObject({
      kind: RedashErrorKind.Network,
    });
  });

  it("throws Http error on 500", async () => {
    mockFetch.mockResolvedValue(makeResponse(500, { message: "Internal Server Error" }));

    const client = new RedashHttpClient(config);
    await expect(client.get("/api/queries")).rejects.toMatchObject({
      kind: RedashErrorKind.Http,
    });
  });

  it("sends POST with JSON body", async () => {
    mockFetch.mockResolvedValue(makeResponse(200, { job: { id: "abc" } }));

    const client = new RedashHttpClient(config);
    await client.post("/api/queries/1/results", { parameters: {}, max_age: 0 });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://redash.example.com/api/queries/1/results",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ parameters: {}, max_age: 0 }),
      }),
    );
  });
});
