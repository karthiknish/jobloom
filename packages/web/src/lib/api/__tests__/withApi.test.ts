/**
 * @jest-environment node
 */
import { NextRequest, NextResponse } from "next/server";
import { withApi } from "../withApi";
import { verifyIdToken } from "@/firebase/admin";
import { verifySessionFromRequest } from "@/lib/auth/session";
import { checkServerRateLimitWithAuth } from "@/lib/rateLimiter";
import { validateCsrf } from "@/lib/security/csrf";
import { z } from "zod";
import { TextEncoder, TextDecoder } from 'util';

// Polyfill Web API globals for NextRequest/NextResponse in Node environment
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  (global as any).TextDecoder = TextDecoder;
}

const { Request, Response, Headers } = require('next/dist/compiled/@edge-runtime/primitives');
global.Request = Request;
global.Response = Response;
global.Headers = Headers;

// Mock dependencies
jest.mock("@/firebase/admin", () => ({
  verifyIdToken: jest.fn(),
  isUserAdmin: jest.fn(),
  getAdminDb: jest.fn(),
}));

jest.mock("@/lib/auth/session", () => ({
  verifySessionFromRequest: jest.fn(),
  verifySessionHashForUser: jest.fn(),
}));

jest.mock("@/lib/api/cors", () => ({
  applyCorsHeaders: jest.fn((res) => res),
  isExtensionRequest: jest.fn(() => false),
}));

jest.mock("@/lib/rateLimiter", () => ({
  checkServerRateLimitWithAuth: jest.fn(),
  getRateLimitConfig: jest.fn(),
}));

jest.mock("@/lib/security/csrf", () => ({
  validateCsrf: jest.fn(),
}));

jest.mock("@/utils/security", () => ({
  SecurityLogger: {
    logSecurityEvent: jest.fn(),
  },
}));

jest.mock("../errorResponse", () => ({
  ErrorLogger: {
    log: jest.fn(),
    logValidationError: jest.fn(),
    logAuthError: jest.fn(),
    logDatabaseError: jest.fn(),
    logRateLimitError: jest.fn(),
    logNetworkError: jest.fn(),
  },
  ValidationError: class extends Error { code = 'VALIDATION_FAILED'; field = ''; },
  AuthorizationError: class extends Error { code = 'UNAUTHORIZED'; },
  RateLimitError: class extends Error { code = 'RATE_LIMIT_EXCEEDED'; retryAfter = 60; },
}));

describe("withApi middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (checkServerRateLimitWithAuth as jest.Mock).mockResolvedValue({ allowed: true, remaining: 10, resetIn: 60 });
  });

  const createRequest = (options: { method?: string; url?: string; body?: any; headers?: Record<string, string> } = {}) => {
    const { method = "GET", url = "https://api.example.com/test", body, headers = {} } = options;
    return new NextRequest(url, {
      method,
      headers: new Headers(headers),
      body: body ? JSON.stringify(body) : undefined,
    });
  };

  it("should allow a basic public request", async () => {
    const handler = jest.fn().mockResolvedValue({ message: "hello" });
    const middleware = withApi({ auth: "none" }, handler);
    const request = createRequest();

    const response = await middleware(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toEqual({ message: "hello" });
    expect(handler).toHaveBeenCalled();
  });

  it("should block unauthenticated requests when auth is required", async () => {
    (verifySessionFromRequest as jest.Mock).mockResolvedValue(null);
    (verifyIdToken as jest.Mock).mockResolvedValue(null);

    const handler = jest.fn();
    const middleware = withApi({ auth: "required" }, handler);
    const request = createRequest();

    const response = await middleware(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(handler).not.toHaveBeenCalled();
  });

  it("should allow authenticated requests with session", async () => {
    (verifySessionFromRequest as jest.Mock).mockResolvedValue({ uid: "user-123", email: "user@example.com" });
    
    // We also need to mock getUserTier which is used inside authenticateRequest
    // In withApi.ts, getUserTier is a local function. We need to mock the Firestore call it makes.
    const { getAdminDb } = require("@/firebase/admin");
    getAdminDb.mockReturnValue({
      collection: jest.fn().mockReturnThis(),
      doc: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({
        data: () => ({ tier: "free" })
      })
    });

    const handler = jest.fn().mockResolvedValue({ success: true });
    const middleware = withApi({ auth: "required" }, handler);
    const request = createRequest();

    const response = await middleware(request);
    expect(response.status).toBe(200);
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({
      user: expect.objectContaining({ uid: "user-123" })
    }));
  });

  it("should block CSRF failed requests for mutating methods", async () => {
    (validateCsrf as jest.Mock).mockImplementation(() => {
      throw new Error("CSRF failed");
    });

    const handler = jest.fn();
    const middleware = withApi({ auth: "none" }, handler);
    const request = createRequest({ method: "POST", body: { test: true } });

    const response = await middleware(request);
    expect(response.status).toBe(403);
    expect(handler).not.toHaveBeenCalled();
  });

  it("should block rate limited requests", async () => {
    (checkServerRateLimitWithAuth as jest.Mock).mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetIn: 30,
      retryAfter: 30
    });

    const handler = jest.fn();
    const middleware = withApi({ auth: "none", rateLimit: "test" }, handler);
    const request = createRequest();

    const response = await middleware(request);
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("30");
  });

  it("should validate request body with schema", async () => {
    const schema = z.object({
      name: z.string(),
      age: z.number()
    });

    const handler = jest.fn().mockResolvedValue({ ok: true });
    (validateCsrf as jest.Mock).mockImplementation(() => {});
    const middleware = withApi({ auth: "none", bodySchema: schema }, handler);
    
    // Invalid body
    const request = createRequest({
      method: "POST",
      body: { name: "John", age: "invalid" }
    });

    const response = await middleware(request);
    expect(response.status).toBe(400);
    expect(handler).not.toHaveBeenCalled();
  });

  it("should allow valid request body", async () => {
    const schema = z.object({
      name: z.string(),
      age: z.number()
    });

    const handler = jest.fn().mockResolvedValue({ ok: true });
    (validateCsrf as jest.Mock).mockImplementation(() => {});
    const middleware = withApi({ auth: "none", bodySchema: schema }, handler);
    
    const request = createRequest({
      method: "POST",
      body: { name: "John", age: 30 }
    });

    const response = await middleware(request);
    expect(response.status).toBe(200);
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({
      body: { name: "John", age: 30 }
    }));
  });
});
