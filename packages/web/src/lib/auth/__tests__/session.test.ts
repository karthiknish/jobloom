/**
 * @jest-environment node
 */
import { NextRequest, NextResponse } from "next/server";
import { 
  verifySessionFromRequest, 
  createSessionCookie, 
  revokeSessionCookie,
  SESSION_COOKIE_NAME 
} from "../session";
import { getAdminAuth, getAdminDb } from "@/firebase/admin";
import { hashSessionToken } from "@/lib/security/csrf";
import { TextEncoder, TextDecoder } from 'util';
import { webcrypto } from 'crypto';

// Polyfill Web API globals
if (typeof global.TextEncoder === 'undefined') {
  (global as any).TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  (global as any).TextDecoder = TextDecoder;
}
if (typeof global.crypto === 'undefined') {
  (global as any).crypto = webcrypto;
}

const { Request, Response, Headers } = require('next/dist/compiled/@edge-runtime/primitives');
global.Request = Request;
global.Response = Response;
global.Headers = Headers;

// Mock dependencies
jest.mock("@/firebase/admin", () => ({
  getAdminAuth: jest.fn(),
  getAdminDb: jest.fn(),
  getAdminApp: jest.fn(),
}));

jest.mock("@/lib/security/csrf", () => ({
  hashSessionToken: jest.fn((t) => Promise.resolve(`hashed-${t}`)),
}));

jest.mock("@/utils/security", () => ({
  SecurityLogger: {
    logSecurityEvent: jest.fn(),
  },
}));

jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));

describe("Session Management", () => {
  const mockAuth = {
    verifySessionCookie: jest.fn(),
    createSessionCookie: jest.fn(),
    verifyIdToken: jest.fn(),
  };

  const mockDb = {
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    get: jest.fn(),
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getAdminAuth as jest.Mock).mockReturnValue(mockAuth);
    (getAdminDb as jest.Mock).mockReturnValue(mockDb);
  });

  const createRequest = (options: { 
    cookies?: Record<string, string>;
    headers?: Record<string, string>;
  } = {}) => {
    const { cookies = {}, headers = {} } = options;
    const req = new NextRequest("https://example.com", { headers: new Headers(headers) });
    Object.entries(cookies).forEach(([name, value]) => {
      req.cookies.set(name, value);
    });
    return req;
  };

  describe("verifySessionFromRequest", () => {
    it("should verify session from cookie if present", async () => {
      const sessionCookie = "valid-session-cookie";
      const request = createRequest({ cookies: { [SESSION_COOKIE_NAME]: sessionCookie } });
      
      mockAuth.verifySessionCookie.mockResolvedValue({ uid: "user-123" });
      mockDb.get.mockResolvedValue({ exists: true, ref: { update: jest.fn() } });

      const decoded = await verifySessionFromRequest(request);
      
      expect(decoded).toEqual({ uid: "user-123" });
      expect(mockAuth.verifySessionCookie).toHaveBeenCalledWith(sessionCookie, true);
    });

    it("should verify session from Authorization header if cookie is missing", async () => {
      const idToken = "valid-id-token".repeat(10); // Long enough to pass length check
      const request = createRequest({ headers: { "authorization": `Bearer ${idToken}` } });
      
      mockAuth.verifyIdToken.mockResolvedValue({ uid: "user-123" });

      const decoded = await verifySessionFromRequest(request);
      
      expect(decoded).toEqual({ uid: "user-123" });
      expect(mockAuth.verifyIdToken).toHaveBeenCalledWith(idToken);
    });

    it("should return null if no session or auth header", async () => {
      const request = createRequest();
      const decoded = await verifySessionFromRequest(request);
      expect(decoded).toBeNull();
    });

    it("should return null and log event if session cookie is not in DB", async () => {
      const sessionCookie = "stale-session-cookie";
      const request = createRequest({ cookies: { [SESSION_COOKIE_NAME]: sessionCookie } });
      
      mockAuth.verifySessionCookie.mockResolvedValue({ uid: "user-123" });
      mockDb.get.mockResolvedValue({ exists: false });

      const decoded = await verifySessionFromRequest(request);
      
      expect(decoded).toBeNull();
    });
  });

  describe("createSessionCookie", () => {
    it("should create a session cookie and store it in Firestore", async () => {
      const idToken = "id-token";
      mockAuth.createSessionCookie.mockResolvedValue("new-session-cookie");
      mockAuth.verifySessionCookie.mockResolvedValue({ uid: "user-123" });

      const result = await createSessionCookie(idToken, { userAgent: "test-agent", ip: "1.2.3.4" });
      
      expect(result.sessionCookie).toBe("new-session-cookie");
      expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining({
        userAgent: "test-agent",
        ip: "1.2.3.4"
      }), { merge: true });
    });
  });

  describe("revokeSessionCookie", () => {
    it("should revoke session and delete from Firestore", async () => {
      const sessionCookie = "expiring-session-cookie";
      const request = createRequest({ cookies: { [SESSION_COOKIE_NAME]: sessionCookie } });
      const response = NextResponse.next();
      
      mockAuth.verifySessionCookie.mockResolvedValue({ uid: "user-123" });
      
      await revokeSessionCookie(request, response);
      
      expect(mockDb.delete).toHaveBeenCalled();
      const cookie = response.cookies.get(SESSION_COOKIE_NAME);
      expect(cookie?.value).toBe(""); 
      const expires = cookie?.expires;
      const expireTime = expires instanceof Date ? expires.getTime() : expires;
      expect(expireTime).toBe(0); // 1970-01-01
    });
  });
});
