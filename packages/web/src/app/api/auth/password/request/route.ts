import { NextResponse } from "next/server";
import { z } from "zod";

import { getAdminApp, getAdminAuth, getAdminDb, type UserRecord } from "@/firebase/admin";
import { PASSWORD_RESET_SUBJECT, renderPasswordResetEmailHtml, renderPasswordResetEmailText } from "@/emails/passwordResetEmail";
import { sendEmail } from "@/lib/resend";

const resendFrom = process.env.RESEND_FROM_EMAIL ?? "Hireall <hello@hireall.app>";
const appUrl = process.env.HIREALL_WEB_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://hireall.app";
const supportEmail = process.env.HIREALL_SUPPORT_EMAIL ?? "support@hireall.app";

const BodySchema = z.object({
  email: z.string().trim().email(),
  redirectUrl: z.string().url().optional(),
});

export async function POST(request: Request) {
  try {
    const parsed = BodySchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request" },
        { status: 400 }
      );
    }

    const { email, redirectUrl } = parsed.data;

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

    const baseReset = redirectUrl ? redirectUrl : `${appUrl}/reset-password`;
    const url = new URL(baseReset);
    url.searchParams.set("token", randomToken);
    url.searchParams.set("email", email);

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

    const emailResult = await sendEmail({
      from: resendFrom,
      to: email,
      subject: PASSWORD_RESET_SUBJECT,
      html,
      text,
    });

    if (!emailResult.success) {
      // Keep response generic to avoid leaking info.
      console.error("Password reset email send failed:", emailResult.error);
    }

    return NextResponse.json({ success: true, skipped: emailResult.skipped === true });
  } catch (error) {
    console.error("Failed to process password reset request", error);
    return NextResponse.json({ success: false, error: "Unable to process request" }, { status: 500 });
  }
}

