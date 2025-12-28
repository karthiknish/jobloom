/**
 * @jest-environment node
 */
import { 
  categorizeFirebaseError, 
  verifyIdTokenDetailed, 
  isUserAdmin,
  getAdminAuth,
  getAdminDb
} from "../admin";
import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Mock firebase-admin
jest.mock("firebase-admin/app", () => ({
  getApps: jest.fn(() => []),
  initializeApp: jest.fn(),
  cert: jest.fn(),
  applicationDefault: jest.fn(),
}));

jest.mock("firebase-admin/auth", () => ({
  getAuth: jest.fn(),
}));

jest.mock("firebase-admin/firestore", () => ({
  getFirestore: jest.fn(),
}));

describe("Firebase Admin Utilities", () => {
  const mockAuth = {
    verifyIdToken: jest.fn(),
  };

  const mockDb = {
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    get: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getAuth as jest.Mock).mockReturnValue(mockAuth);
    (getFirestore as jest.Mock).mockReturnValue(mockDb);
    (getApps as jest.Mock).mockReturnValue([{ name: "[DEFAULT]" }]);
  });

  describe("categorizeFirebaseError", () => {
    it("should categorize auth errors", () => {
      const error = { code: "auth/id-token-expired", message: "Expired" };
      const categorized = categorizeFirebaseError(error);
      expect(categorized.category).toBe("auth");
      expect(categorized.retryable).toBe(false);
    });

    it("should categorize permission errors", () => {
      const error = { code: "permission-denied", message: "Denied" };
      const categorized = categorizeFirebaseError(error);
      expect(categorized.category).toBe("permission");
      expect(categorized.retryable).toBe(false);
    });

    it("should categorize network errors as retryable", () => {
      const error = { code: "unavailable", message: "Service unavailable" };
      const categorized = categorizeFirebaseError(error);
      expect(categorized.category).toBe("network");
      expect(categorized.retryable).toBe(true);
    });
  });

  describe("verifyIdTokenDetailed", () => {
    it("should fail for empty tokens", async () => {
      const result = await verifyIdTokenDetailed("");
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("auth/invalid-token-format");
    });

    it("should fail for short tokens", async () => {
      const result = await verifyIdTokenDetailed("too-short");
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("auth/token-too-short");
    });

    it("should fail for test tokens", async () => {
      const result = await verifyIdTokenDetailed("mock-test-token".repeat(10));
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("auth/test-token");
    });

    it("should succeed for valid tokens", async () => {
      const validToken = "valid-token".repeat(10);
      mockAuth.verifyIdToken.mockResolvedValue({ uid: "user-123" });

      const result = await verifyIdTokenDetailed(validToken);
      expect(result.success).toBe(true);
      expect(result.token?.uid).toBe("user-123");
    });

    it("should return categorized error on verification failure", async () => {
      const validToken = "valid-token".repeat(10);
      mockAuth.verifyIdToken.mockRejectedValue({ code: "auth/id-token-expired" });

      const result = await verifyIdTokenDetailed(validToken);
      expect(result.success).toBe(false);
      expect(result.error?.category).toBe("auth");
    });
  });

  describe("isUserAdmin", () => {
    it("should return true if user is admin in Firestore", async () => {
      mockDb.get.mockResolvedValue({
        exists: true,
        data: () => ({ isAdmin: true })
      });

      const isAdmin = await isUserAdmin("user-123");
      expect(isAdmin).toBe(true);
      expect(mockDb.collection).toHaveBeenCalledWith("users");
      expect(mockDb.doc).toHaveBeenCalledWith("user-123");
    });

    it("should return false if user is not admin", async () => {
      mockDb.get.mockResolvedValue({
        exists: true,
        data: () => ({ isAdmin: false })
      });

      const isAdmin = await isUserAdmin("user-123");
      expect(isAdmin).toBe(false);
    });

    it("should return false if user document does not exist", async () => {
      mockDb.get.mockResolvedValue({ exists: false });
      const isAdmin = await isUserAdmin("non-existent");
      expect(isAdmin).toBe(false);
    });

    it("should return false on database error", async () => {
      mockDb.get.mockRejectedValue(new Error("DB Error"));
      const isAdmin = await isUserAdmin("user-123");
      expect(isAdmin).toBe(false);
    });
  });
});
