import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { sendEmail } from "@/lib/resend";

import {
  WELCOME_EMAIL_SUBJECT,
  renderWelcomeEmailHtml,
  renderWelcomeEmailText,
} from "@/emails/welcomeEmail";

const resendFrom = process.env.RESEND_FROM_EMAIL ?? "Hireall <hello@hireall.app>";
const dashboardUrl = process.env.HIREALL_DASHBOARD_URL ?? "https://hireall.app/dashboard";
const settingsUrl = process.env.HIREALL_SETTINGS_URL ?? "https://hireall.app/settings";

const BodySchema = z.object({
  email: z.string().trim().email(),
  name: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = BodySchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request" },
        { status: 400 }
      );
    }

    const { email, name } = parsed.data;

    const result = await sendEmail({
      from: resendFrom,
      to: email,
      subject: WELCOME_EMAIL_SUBJECT,
      html: renderWelcomeEmailHtml({ name, dashboardUrl, settingsUrl }),
      text: renderWelcomeEmailText({ name, dashboardUrl, settingsUrl }),
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error ?? "Failed to send welcome email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, skipped: result.skipped === true });
  } catch (error) {
    console.error("Failed to send welcome email", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to send welcome email",
      },
      { status: 500 }
    );
  }
}
