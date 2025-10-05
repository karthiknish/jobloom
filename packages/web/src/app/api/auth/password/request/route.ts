import { NextResponse } from "next/server";
import { Resend } from "resend";

import { getAdminApp, getAdminAuth, getAdminDb, type UserRecord } from "@/firebase/admin";
import { PASSWORD_RESET_SUBJECT, renderPasswordResetEmailHtml, renderPasswordResetEmailText } from "@/emails/passwordResetEmail";

const resendApiKey = process.env.RESEND_API_KEY;
const resendFrom = process.env.RESEND_FROM_EMAIL ?? "Hireall <hello@hireall.app>";
const appUrl = process.env.HIREALL_WEB_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://hireall.app";
const supportEmail = process.env.HIREALL_SUPPORT_EMAIL ?? "support@hireall.app";

const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function POST(request: Request) {
  try {
    const { email, redirectUrl } = await request.json().catch(() => ({ email: undefined }));

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "Email address is required" },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    const admin = getAdminApp();
    const adminAuth = getAdminAuth();
    let userRecord: UserRecord | null = null;
    try {
      userRecord = await adminAuth.getUserByEmail(email);
    } catch (error: any) {
      if (error?.code === "auth/user-not-found") {
        await new Promise((resolve) => setTimeout(resolve, 400));
        return NextResponse.json({ success: true, message: "If the email exists, a reset link will be sent." });
      }
      throw error;
    }

    const randomToken = (() => {
      const array = new Uint8Array(32);
      if (typeof crypto !== "undefined" && crypto.getRandomValues) {
        crypto.getRandomValues(array);
      } else {
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
      }
      return Buffer.from(array).toString("base64url");
    })();

    const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

    const db = getAdminDb();
    await db
      .collection("passwordResets")
      .doc(randomToken)
      .set({
        userId: userRecord.uid,
        email,
        createdAt: new Date(),
        expiresAt,
        used: false,
      });

    const baseReset = redirectUrl && typeof redirectUrl === "string" ? redirectUrl : `${appUrl}/reset-password`;
    const url = new URL(baseReset);
    url.searchParams.set("token", randomToken);
    url.searchParams.set("email", email);

    if (!resend) {
      console.warn("Password reset email skipped: RESEND_API_KEY is not configured");
      return NextResponse.json({ success: true, skipped: true });
    }

    const resetUrlWithToken = url.toString();

    const html = renderPasswordResetEmailHtml({
      name: userRecord.displayName,
      email,
      resetUrl: resetUrlWithToken,
      supportEmail,
      signInUrl: `${appUrl}/sign-in`,
    });

    const text = renderPasswordResetEmailText({
      name: userRecord.displayName,
      email,
      resetUrl: resetUrlWithToken,
      supportEmail,
      signInUrl: `${appUrl}/sign-in`,
    });

    await resend.emails.send({
      from: resendFrom,
      to: email,
      subject: PASSWORD_RESET_SUBJECT,
      html,
      text,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to process password reset request", error);
    return NextResponse.json({ success: false, error: "Unable to process request" }, { status: 500 });
  }
}

