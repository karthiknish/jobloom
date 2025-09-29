import { format } from "date-fns";

export const PASSWORD_RESET_SUBJECT = "Reset your Hireall password";

interface PasswordResetTemplateProps {
  name?: string | null;
  email: string;
  resetUrl: string;
  supportEmail?: string;
  signInUrl?: string;
}

const brandColor = "#2563eb";
const backgroundColor = "#f5f6ff";
const textColor = "#1f2937";
const mutedTextColor = "#4b5563";
const cardBackground = "#ffffff";
const borderColor = "#e5e7eb";
const supportEmailDefault = "support@hireall.com";
const signInUrlDefault = "https://hireall.com/sign-in";

const currentYear = () => format(new Date(), "yyyy");

const getGreeting = (name?: string | null) => {
  if (!name) return "Hey there";
  const cleaned = name.trim();
  if (!cleaned) return "Hey there";
  return /^hi|hey|hello/i.test(cleaned) ? cleaned : `Hey ${cleaned.split(" ")[0]}`;
};

export function renderPasswordResetEmailHtml({
  name,
  email,
  resetUrl,
  supportEmail = supportEmailDefault,
  signInUrl = signInUrlDefault,
}: PasswordResetTemplateProps): string {
  const greeting = getGreeting(name);
  const year = currentYear();

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charSet="utf-8" />
    <title>${PASSWORD_RESET_SUBJECT}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      @media (max-width: 600px) {
        .container {
          width: 100% !important;
          padding: 24px 16px !important;
        }
        .card {
          padding: 28px 20px !important;
        }
        .cta-button {
          width: 100% !important;
        }
      }
    </style>
  </head>
  <body style="margin:0; padding:32px 16px; background:${backgroundColor}; font-family:'Inter', BlinkMacSystemFont, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:${textColor}">
    <table width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation">
      <tbody>
        <tr>
          <td align="center">
            <table class="container" width="600" style="width:600px; max-width:100%; border-collapse:collapse;">
              <tbody>
                <tr>
                  <td style="text-align:center; padding-bottom:24px;">
                    <div style="display:inline-flex; align-items:center; gap:12px;">
                      <div style="width:44px; height:44px; border-radius:12px; background:${brandColor}; display:flex; align-items:center; justify-content:center; color:#ffffff; font-size:22px; font-weight:600;">H</div>
                      <span style="font-size:22px; font-weight:700; letter-spacing:-0.4px; color:${textColor};">Hireall</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td class="card" style="background:${cardBackground}; border-radius:16px; box-shadow:0 20px 50px -20px rgba(37, 99, 235, 0.35); padding:40px 48px; border:1px solid ${borderColor};">
                    <p style="margin:0 0 12px; font-size:18px; font-weight:600;">${greeting} 👋</p>
                    <h1 style="margin:0 0 16px; font-size:28px; line-height:1.3; font-weight:700; letter-spacing:-0.6px;">Reset your Hireall password</h1>
                    <p style="margin:0 0 16px; font-size:16px; line-height:1.6; color:${mutedTextColor};">
                      We received a request to reset the password for <strong>${email}</strong>. If this was you, tap the button below to choose a new password.
                    </p>
                    <table border="0" cellPadding="0" cellSpacing="0" role="presentation" style="margin:0 0 24px;">
                      <tbody>
                        <tr>
                          <td>
                            <a class="cta-button" href="${resetUrl}" target="_blank" rel="noopener" style="display:inline-flex; align-items:center; justify-content:center; gap:8px; padding:14px 26px; border-radius:999px; background:${brandColor}; color:#ffffff; font-size:16px; font-weight:600; text-decoration:none; box-shadow:0 10px 25px -12px rgba(37, 99, 235, 0.7);">
                              Reset password
                            </a>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <p style="margin:0 0 16px; font-size:14px; line-height:1.6; color:${mutedTextColor};">
                      Having trouble with the button? Copy and paste this link into your browser:
                    </p>
                    <p style="word-break:break-all; font-size:13px; color:${brandColor}; margin:0 0 24px;">
                      <a href="${resetUrl}" style="color:${brandColor}; text-decoration:none;">${resetUrl}</a>
                    </p>
                    <p style="margin:0 0 16px; font-size:14px; line-height:1.6; color:${mutedTextColor};">
                      If you did not request a password reset, you can safely ignore this email—your password will stay the same.
                    </p>
                    <table width="100%" style="border-collapse:collapse; margin:0;">
                      <tbody>
                        <tr>
                          <td style="padding:18px 24px; border:1px solid ${borderColor}; border-radius:12px; background:${backgroundColor};">
                            <p style="margin:0 0 12px; font-size:15px; font-weight:600; color:${textColor};">Need help?</p>
                            <p style="margin:0; font-size:14px; line-height:1.6; color:${mutedTextColor};">
                              We’re here if you need us. Reply to this email or reach out at <a href="mailto:${supportEmail}" style="color:${brandColor}; text-decoration:none;">${supportEmail}</a>.
                            </p>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <p style="margin:28px 0 0; font-size:15px; color:${mutedTextColor};">Stay secure,<br/><span style="color:${textColor}; font-weight:600;">The Hireall Team</span></p>
                  </td>
                </tr>
                <tr>
                  <td style="text-align:center; padding-top:24px; font-size:12px; color:${mutedTextColor};">
                    © ${year} Hireall. 595 Market Street, San Francisco, CA 94103
                  </td>
                </tr>
                <tr>
                  <td style="text-align:center; padding-top:8px; font-size:12px; color:${mutedTextColor};">
                    Forgot your password by mistake? You can sign in anytime at <a href="${signInUrl}" style="color:${brandColor}; text-decoration:none;">${signInUrl}</a>.
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  </body>
</html>`;
}

export function renderPasswordResetEmailText({
  name,
  email,
  resetUrl,
  supportEmail = supportEmailDefault,
  signInUrl = signInUrlDefault,
}: PasswordResetTemplateProps): string {
  const greeting = getGreeting(name);
  const year = currentYear();

  return `${greeting} 👋

We received a request to reset the password for ${email}.

If this was you, reset your password here: ${resetUrl}

If you didn’t request this, you can ignore this email – your password won’t change.

Need help? Reach us at ${supportEmail}.

Stay secure,
The Hireall Team

© ${year} Hireall | Sign in anytime: ${signInUrl}`;
}

