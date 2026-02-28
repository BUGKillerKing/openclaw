import { afterEach, describe, expect, it, vi } from "vitest";
import { appendCdpPath, ensureLoopbackInNoProxy, isLoopbackHost } from "./cdp.helpers.js";

describe("cdp.helpers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("ensureLoopbackInNoProxy", () => {
    it("primes no_proxy when only ALL_PROXY is set", () => {
      vi.stubEnv("ALL_PROXY", "socks5://proxy.local:1080");
      delete process.env.NO_PROXY;
      delete process.env.no_proxy;

      ensureLoopbackInNoProxy();

      expect(process.env.no_proxy).toContain("127.0.0.1");
      expect(process.env.no_proxy).toContain("localhost");
      expect(process.env.no_proxy).toContain("::1");
    });

    it("primes no_proxy when only all_proxy is set", () => {
      vi.stubEnv("all_proxy", "http://proxy.local:8080");
      delete process.env.NO_PROXY;
      delete process.env.no_proxy;

      ensureLoopbackInNoProxy();

      expect(process.env.no_proxy).toContain("127.0.0.1");
      expect(process.env.no_proxy).toContain("localhost");
    });

    it("primes no_proxy when only HTTPS_PROXY is set", () => {
      vi.stubEnv("HTTPS_PROXY", "https://proxy.local:7890");
      delete process.env.NO_PROXY;
      delete process.env.no_proxy;

      ensureLoopbackInNoProxy();

      expect(process.env.no_proxy).toContain("127.0.0.1");
    });

    it("does not prime when no proxy env is set", () => {
      delete process.env.HTTP_PROXY;
      delete process.env.http_proxy;
      delete process.env.HTTPS_PROXY;
      delete process.env.https_proxy;
      delete process.env.ALL_PROXY;
      delete process.env.all_proxy;
      delete process.env.NO_PROXY;
      delete process.env.no_proxy;

      ensureLoopbackInNoProxy();

      expect(process.env.no_proxy).toBeUndefined();
      expect(process.env.NO_PROXY).toBeUndefined();
    });

    it("appends missing loopback entries to existing no_proxy", () => {
      vi.stubEnv("HTTP_PROXY", "http://proxy.local:7890");
      vi.stubEnv("no_proxy", "*.internal");

      ensureLoopbackInNoProxy();

      expect(process.env.no_proxy).toMatch(/127\.0\.0\.1/);
      expect(process.env.no_proxy).toMatch(/localhost/);
      expect(process.env.no_proxy).toMatch(/\*\.internal/);
    });

    it("updates NO_PROXY when it is set and loopback is missing", () => {
      vi.stubEnv("ALL_PROXY", "socks5://proxy.local:1080");
      vi.stubEnv("NO_PROXY", "*.corp.local");
      delete process.env.no_proxy;

      ensureLoopbackInNoProxy();

      expect(process.env.NO_PROXY).toMatch(/127\.0\.0\.1/);
      expect(process.env.NO_PROXY).toMatch(/localhost/);
      expect(process.env.NO_PROXY).toMatch(/\*\.corp\.local/);
    });
  });

  describe("appendCdpPath", () => {
    it("appends path to CDP URL", () => {
      expect(appendCdpPath("http://127.0.0.1:9222", "/json/version")).toBe(
        "http://127.0.0.1:9222/json/version",
      );
    });

    it("handles path without leading slash", () => {
      expect(appendCdpPath("http://127.0.0.1:9222", "json/version")).toBe(
        "http://127.0.0.1:9222/json/version",
      );
    });
  });

  describe("isLoopbackHost", () => {
    it("returns true for 127.0.0.1", () => {
      expect(isLoopbackHost("127.0.0.1")).toBe(true);
    });

    it("returns true for localhost", () => {
      expect(isLoopbackHost("localhost")).toBe(true);
    });

    it("returns false for non-loopback host", () => {
      expect(isLoopbackHost("example.com")).toBe(false);
    });
  });
});
