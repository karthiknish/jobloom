import { withApi, z } from "@/lib/api/withApi";
import { sendEmail } from "@/lib/email";
import {
  WELCOME_EMAIL_SUBJECT,
  renderWelcomeEmailHtml,
  renderWelcomeEmailText,
} from "@/emails/welcomeEmail";

const emailFrom = process.env.BREVO_FROM_EMAIL ?? process.env.RESEND_FROM_EMAIL ?? "Hireall <noreply@hireall.app>";
const dashboardUrl = process.env.HIREALL_DASHBOARD_URL ?? "https://hireall.app/dashboard";
const settingsUrl = process.env.HIREALL_SETTINGS_URL ?? "https://hireall.app/settings";

const welcomeEmailSchema = z.object({
  email: z.string().trim().email(),
  name: z.string().optional(),
});

export const POST = withApi({
  auth: 'none',
  bodySchema: welcomeEmailSchema,
}, async ({ body }) => {
  const { email, name } = body;

  const result = await sendEmail({
    from: emailFrom,
    to: email,
    subject: WELCOME_EMAIL_SUBJECT,
    html: renderWelcomeEmailHtml({ name, dashboardUrl, settingsUrl }),
    text: renderWelcomeEmailText({ name, dashboardUrl, settingsUrl }),
  });

  if (!result.success) {
    throw new Error(result.error ?? "Failed to send welcome email");
  }

  return { skipped: result.skipped === true };
});

