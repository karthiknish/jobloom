import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { randomUUID } from "node:crypto";
import { getAdminApp, getAdminDb } from "@/firebase/admin";
import { hashSessionToken } from "@/lib/security/csrf";
import { SecurityLogger } from "@/utils/security";

export const SESSION_COOKIE_NAME = "__session";
const SESSION_COLLECTION = "userSessions";
const SESSION_EXPIRY_SECONDS = 60 * 60 * 24 * 7; // 7 days

type SessionMetadata = {
  userAgent?: string | null;
  ip?: string | null;
};

export async function createSessionCookie(
  idToken: string,
  metadata: SessionMetadata,
): Promise<{ sessionCookie: string; expiresAt: number }> {
  const auth = getAuth(getAdminApp());
  const expiresAt = Date.now() + SESSION_EXPIRY_SECONDS * 1000;
  const sessionCookie = await auth.createSessionCookie(idToken, {
    expiresIn: SESSION_EXPIRY_SECONDS * 1000,
  });

  const decoded = await auth.verifySessionCookie(sessionCookie, true);
  const hash = hashSessionToken(sessionCookie);
  const db = getAdminDb();
  const sessionDoc = db
    .collection(SESSION_COLLECTION)
    .doc(decoded.uid)
    .collection("sessions")
    .doc(hash);

  await sessionDoc.set(
    {
      createdAt: new Date().toISOString(),
      expiresAt,
      lastSeenAt: new Date().toISOString(),
      userAgent: metadata.userAgent ?? "unknown",
      ip: metadata.ip ?? "unknown",
    },
    { merge: true },
  );

  return { sessionCookie, expiresAt };
}

export async function verifySessionFromRequest(request: NextRequest) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) {
    return null;
  }

  try {
    const auth = getAuth(getAdminApp());
    const decoded = await auth.verifySessionCookie(sessionCookie, true);
    const hash = hashSessionToken(sessionCookie);
    const db = getAdminDb();
    const doc = await db
      .collection(SESSION_COLLECTION)
      .doc(decoded.uid)
      .collection("sessions")
      .doc(hash)
      .get();

    if (!doc.exists) {
      SecurityLogger.logSecurityEvent({
        type: "suspicious_request",
        severity: "medium",
        details: {
          reason: "Session cookie not found in store",
        },
        userId: decoded.uid,
        ip: request.ip ?? undefined,
      });
      return null;
    }

    await doc.ref.update({ lastSeenAt: new Date().toISOString() });

    return decoded;
  } catch (error) {
    SecurityLogger.logSecurityEvent({
      type: "auth_failure",
      severity: "medium",
      details: {
        reason: "Session verification failed",
        error: error instanceof Error ? error.message : "unknown",
      },
      ip: request.ip ?? undefined,
    });
    return null;
  }
}

export async function revokeSessionCookie(
  request: NextRequest,
  response: NextResponse,
) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) {
    response.cookies.delete(SESSION_COOKIE_NAME);
    return;
  }

  try {
    const auth = getAuth(getAdminApp());
    const decoded = await auth.verifySessionCookie(sessionCookie, true);
    const hash = hashSessionToken(sessionCookie);
    const db = getAdminDb();
    await db
      .collection(SESSION_COLLECTION)
      .doc(decoded.uid)
      .collection("sessions")
      .doc(hash)
      .delete();

    response.cookies.delete(SESSION_COOKIE_NAME);
  } catch (error) {
    response.cookies.delete(SESSION_COOKIE_NAME);
    SecurityLogger.logSecurityEvent({
      type: "auth_failure",
      severity: "medium",
      details: {
        reason: "Failed to revoke session",
        error: error instanceof Error ? error.message : "unknown",
      },
      ip: request.ip ?? undefined,
    });
  }
}

export function setSessionCookie(
  response: NextResponse,
  cookieValue: string,
  expiresAt: number,
): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: cookieValue,
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor((expiresAt - Date.now()) / 1000),
  });
}

export function clearSessionCookieInResponse(response: NextResponse): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function getSessionCookieValue(): string | undefined {
  try {
    return cookies().get(SESSION_COOKIE_NAME)?.value;
  } catch {
    return undefined;
  }
}
