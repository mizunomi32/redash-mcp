import { afterEach, describe, expect, it } from "vitest";
import { loadConfig } from "../../../src/config/Config.js";
import { RedashErrorKind } from "../../../src/domain/errors/RedashError.js";

afterEach(() => {
  delete process.env.REDASH_URL;
  delete process.env.REDASH_API_KEY;
  delete process.env.REDASH_EXTRA_HEADERS;
});

describe("loadConfig", () => {
  it("throws Config error when REDASH_URL is missing", () => {
    process.env.REDASH_API_KEY = "key";
    expect(() => loadConfig()).toThrow(
      expect.objectContaining({
        kind: RedashErrorKind.Config,
        message: expect.stringContaining("REDASH_URL"),
      }),
    );
  });

  it("throws Config error when REDASH_API_KEY is missing", () => {
    process.env.REDASH_URL = "https://redash.example.com";
    expect(() => loadConfig()).toThrow(
      expect.objectContaining({
        kind: RedashErrorKind.Config,
        message: expect.stringContaining("REDASH_API_KEY"),
      }),
    );
  });

  it("strips trailing slash from REDASH_URL", () => {
    process.env.REDASH_URL = "https://redash.example.com/";
    process.env.REDASH_API_KEY = "mykey";
    const config = loadConfig();
    expect(config.baseUrl).toBe("https://redash.example.com");
  });

  it("sets Authorization header as Key <apikey>", () => {
    process.env.REDASH_URL = "https://redash.example.com";
    process.env.REDASH_API_KEY = "mykey";
    const config = loadConfig();
    expect(config.headers.Authorization).toBe("Key mykey");
  });

  it("prevents REDASH_EXTRA_HEADERS from overriding Authorization", () => {
    process.env.REDASH_URL = "https://redash.example.com";
    process.env.REDASH_API_KEY = "realkey";
    process.env.REDASH_EXTRA_HEADERS = JSON.stringify({
      Authorization: "Key fakekey",
      "CF-Access-Client-Id": "client-id",
    });
    const config = loadConfig();
    expect(config.headers.Authorization).toBe("Key realkey");
    expect(config.headers["CF-Access-Client-Id"]).toBe("client-id");
  });

  it("throws Config error for malformed REDASH_EXTRA_HEADERS", () => {
    process.env.REDASH_URL = "https://redash.example.com";
    process.env.REDASH_API_KEY = "mykey";
    process.env.REDASH_EXTRA_HEADERS = "not-valid-json";
    expect(() => loadConfig()).toThrow(
      expect.objectContaining({
        kind: RedashErrorKind.Config,
        message: expect.stringContaining("REDASH_EXTRA_HEADERS"),
      }),
    );
  });

  it("passes extra headers through when valid", () => {
    process.env.REDASH_URL = "https://redash.example.com";
    process.env.REDASH_API_KEY = "mykey";
    process.env.REDASH_EXTRA_HEADERS = JSON.stringify({ "X-Custom": "value" });
    const config = loadConfig();
    expect(config.headers["X-Custom"]).toBe("value");
  });
});
