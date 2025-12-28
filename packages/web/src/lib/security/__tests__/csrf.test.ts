/**
 * @jest-environment node
 */
import { NextRequest, NextResponse } from "next/server";
import { 
  ensureCsrfCookie, 
  validateCsrf, 
  CSRF_COOKIE_NAME, 
  CSRF_HEADER_NAME,
  hashSessionToken
} from "../csrf";
import { TextEncoder, TextDecoder } from 'util';
import { webcrypto } from 'crypto';

// Polyfill Web API globals
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}
if (typeof global.crypto === 'undefined') {
  (global as any).crypto = webcrypto;
}

const { Request, Response, Headers } = require('next/dist/compiled/@edge-runtime/primitives');
global.Request = Request;
global.Response = Response;
global.Headers = Headers;

describe("CSRF Protection", () => {
  const createRequest = (options: { 
    method?: string; 
    url?: string; 
    cookies?: Record<string, string>;
    headers?: Record<string, string>;
  } = {}) => {
    const { method = "GET", url = "https://example.com", cookies = {}, headers = {} } = options;
    const req = new NextRequest(url, { method, headers: new Headers(headers) });
    Object.entries(cookies).forEach(([name, value]) => {
      req.cookies.set(name, value);
    });
    return req;
  };

  describe("ensureCsrfCookie", () => {
    it("should reuse an existing CSRF cookie", async () => {
      const request = createRequest({ cookies: { [CSRF_COOKIE_NAME]: "existing-token" } });
      const response = NextResponse.next();
      
      const token = await ensureCsrfCookie(request, response);
      
      expect(token).toBe("existing-token");
      expect(response.cookies.get(CSRF_COOKIE_NAME)?.value).toBe("existing-token");
    });

    it("should generate a new CSRF cookie if none exists", async () => {
      const request = createRequest();
      const response = NextResponse.next();
      
      const token = await ensureCsrfCookie(request, response);
      
      expect(token).toBeDefined();
      expect(token.length).toBeGreaterThan(0);
      expect(response.cookies.get(CSRF_COOKIE_NAME)?.value).toBe(token);
    });
  });

  describe("validateCsrf", () => {
    it("should skip validation for GET requests", () => {
      const request = createRequest({ method: "GET" });
      expect(() => validateCsrf(request)).not.toThrow();
    });

    it("should skip validation for extension requests", () => {
      const request = createRequest({ 
        method: "POST", 
        headers: { "origin": "chrome-extension://abc" } 
      });
      expect(() => validateCsrf(request)).not.toThrow();
    });

    it("should skip validation for LinkedIn referer/origin", () => {
      const request = createRequest({ 
        method: "POST", 
        headers: { 
          "origin": "https://www.linkedin.com",
          "referer": "https://www.linkedin.com/feed/" 
        } 
      });
      expect(() => validateCsrf(request)).not.toThrow();
    });

    it("should fail if cookie is missing for mutating requests", () => {
      const request = createRequest({ 
        method: "POST", 
        headers: { [CSRF_HEADER_NAME]: "some-token" } 
      });
      expect(() => validateCsrf(request)).toThrow("Missing CSRF token");
    });

    it("should fail if header is missing for mutating requests", () => {
      const request = createRequest({ 
        method: "POST", 
        cookies: { [CSRF_COOKIE_NAME]: "some-token" } 
      });
      expect(() => validateCsrf(request)).toThrow("Missing CSRF token");
    });

    it("should pass if cookie and header match", () => {
      const token = "valid-token-32-chars-long-12345678";
      const request = createRequest({ 
        method: "POST", 
        cookies: { [CSRF_COOKIE_NAME]: token },
        headers: { [CSRF_HEADER_NAME]: token }
      });
      expect(() => validateCsrf(request)).not.toThrow();
    });

    it("should pass if cookie and query parameter match", () => {
      const token = "valid-token-32-chars-long-12345678";
      const request = createRequest({ 
        method: "POST", 
        url: `https://example.com?_csrf=${token}`,
        cookies: { [CSRF_COOKIE_NAME]: token }
      });
      expect(() => validateCsrf(request)).not.toThrow();
    });

    it("should fail if tokens mismatch", () => {
      const request = createRequest({ 
        method: "POST", 
        cookies: { [CSRF_COOKIE_NAME]: "token-a" },
        headers: { [CSRF_HEADER_NAME]: "token-b" }
      });
      expect(() => validateCsrf(request)).toThrow();
    });
  });

  describe("hashSessionToken", () => {
    it("should generate a consistent SHA-256 hash", async () => {
      const token = "my-secret-token";
      const hash1 = await hashSessionToken(token);
      const hash2 = await hashSessionToken(token);
      
      expect(hash1).toBe(hash2);
      expect(hash1.length).toBe(64); // SHA-256 hex length
    });

    it("should generate different hashes for different tokens", async () => {
      const hash1 = await hashSessionToken("token-1");
      const hash2 = await hashSessionToken("token-2");
      
      expect(hash1).not.toBe(hash2);
    });
  });
});
