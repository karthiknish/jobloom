import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/firebase/admin";
import {
  clearSessionCookieInResponse,
  createSessionCookie,
  revokeSessionCookie,
  setSessionCookie,
} from "@/lib/auth/session";
import {
  CSRF_HEADER_NAME,
  ensureCsrfCookie,
  validateCsrf,
} from "@/lib/security/csrf";

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function GET(request: NextRequest) {
  const response = NextResponse.json({ ok: true });
  await ensureCsrfCookie(request, response);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Pragma", "no-cache");
  return response;
}

export async function POST(request: NextRequest) {
  try {
    validateCsrf(request);

    const { idToken } = await request.json();
    if (typeof idToken !== "string" || !idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }

    const decoded = await verifyIdToken(idToken);
    if (!decoded?.uid) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });

    const { sessionCookie, expiresAt } = await createSessionCookie(idToken, {
      userAgent: request.headers.get("user-agent"),
      ip: getClientIp(request),
    });

    setSessionCookie(response, sessionCookie, expiresAt);
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Pragma", "no-cache");

    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to establish session";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({ ok: true });
  try {
    validateCsrf(request);
  } catch (error) {
    return NextResponse.json(
      { error: "CSRF validation failed" },
      { status: 403 },
    );
  }

  await revokeSessionCookie(request, response);
  clearSessionCookieInResponse(response);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Pragma", "no-cache");
  return response;
}
