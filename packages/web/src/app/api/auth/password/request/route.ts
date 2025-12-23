import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getAdminAuth, getAdminDb, type UserRecord } from "@/firebase/admin";
import { PASSWORD_RESET_SUBJECT, renderPasswordResetEmailHtml, renderPasswordResetEmailText } from "@/emails/passwordResetEmail";
import { sendEmail } from "@/lib/email";
import { withApi } from "@/lib/api/withApi";

const emailFrom = process.env.BREVO_FROM_EMAIL ?? process.env.RESEND_FROM_EMAIL ?? "Hireall <noreply@hireall.app>";
const appUrl = process.env.HIREALL_WEB_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://hireall.app";
const supportEmail = process.env.HIREALL_SUPPORT_EMAIL ?? "support@hireall.app";

// Zod schema for request body validation
const requestBodySchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  redirectUrl: z.string().url().optional(),
});

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  response.headers.set("Pragma", "no-cache");
  return response;
}

export const POST = withApi({
  auth: "none",
  rateLimit: "auth",
  bodySchema: requestBodySchema,
  handler: async ({ body }) => {
    const { email, redirectUrl } = body;

    const adminAuth = getAdminAuth();
    let userRecord: UserRecord | null = null;
    try {
      userRecord = await adminAuth.getUserByEmail(email);
    } catch (error: any) {
      if (error?.code === "auth/user-not-found") {
        // Delay to prevent timing attacks
        await new Promise((resolve) => setTimeout(resolve, 400));
        return { 
          success: true, 
          message: "If the email exists, a reset link will be sent." 
        };
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

    const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes

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
      from: emailFrom,
      to: email,
      subject: PASSWORD_RESET_SUBJECT,
      html,
      text,
    });

    if (!emailResult.success) {
      // Keep response generic to avoid leaking info
      console.error("Password reset email send failed:", emailResult.error);
    }

    return { 
      success: true, 
      skipped: emailResult.skipped === true 
    };
  },
});
