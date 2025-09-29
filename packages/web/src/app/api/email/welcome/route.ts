import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

import {
  WELCOME_EMAIL_SUBJECT,
  renderWelcomeEmailHtml,
  renderWelcomeEmailText,
} from "@/emails/welcomeEmail";

const resendApiKey = process.env.RESEND_API_KEY;
const resendFrom = process.env.RESEND_FROM_EMAIL ?? "Hireall <hello@hireall.com>";
const dashboardUrl = process.env.HIREALL_DASHBOARD_URL ?? "https://hireall.com/dashboard";
const settingsUrl = process.env.HIREALL_SETTINGS_URL ?? "https://hireall.com/settings";

const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const name = typeof body.name === "string" ? body.name : undefined;

    if (!email) {
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

    if (!resend) {
      console.warn("Welcome email skipped: RESEND_API_KEY is not configured");
      return NextResponse.json({ success: true, skipped: true });
    }

    await resend.emails.send({
      from: resendFrom,
      to: email,
      subject: WELCOME_EMAIL_SUBJECT,
      html: renderWelcomeEmailHtml({ name, dashboardUrl, settingsUrl }),
      text: renderWelcomeEmailText({ name, dashboardUrl, settingsUrl }),
    });

    return NextResponse.json({ success: true });
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
