import { format } from "date-fns";

export const WELCOME_EMAIL_SUBJECT = "Welcome to Hireall";

interface WelcomeEmailTemplateProps {
  name?: string | null;
  dashboardUrl?: string;
  settingsUrl?: string;
}

const brandColor = "#2563eb";
const backgroundColor = "#f5f6ff";
const textColor = "#1f2937";
const mutedTextColor = "#4b5563";
const cardBackground = "#ffffff";
const borderColor = "#e5e7eb";
const defaultDashboardUrl = "https://hireall.com/dashboard";
const defaultSettingsUrl = "https://hireall.com/settings";

const currentYear = () => format(new Date(), "yyyy");

const getGreeting = (name?: string | null) => {
  if (!name) return "Hey there";
  const cleaned = name.trim();
  if (!cleaned) return "Hey there";
  return /^hi|hey|hello/i.test(cleaned)
    ? cleaned
    : `Hey ${cleaned.split(" ")[0]}`;
};

export function renderWelcomeEmailHtml({
  name,
  dashboardUrl = defaultDashboardUrl,
  settingsUrl = defaultSettingsUrl,
}: WelcomeEmailTemplateProps): string {
  const greeting = getGreeting(name);
  const year = currentYear();

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charSet="utf-8" />
    <title>${WELCOME_EMAIL_SUBJECT}</title>
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
                    <h1 style="margin:0 0 16px; font-size:28px; line-height:1.3; font-weight:700; letter-spacing:-0.6px;">Welcome to your smarter job search</h1>
                    <p style="margin:0 0 16px; font-size:16px; line-height:1.6; color:${mutedTextColor};">
                      Thanks for signing up for Hireall. You're all set to keep every application organized, spot sponsored opportunities faster, and stay on top of follow-ups without the chaos.
                    </p>
                    <p style="margin:0 0 20px; font-size:16px; line-height:1.6; color:${mutedTextColor};">
                      Here's how to get the most out of your new workspace:
                    </p>
                    <ul style="margin:0 0 24px 0; padding-left:20px; color:${mutedTextColor}; font-size:15px; line-height:1.7;">
                      <li style="margin-bottom:12px;"><strong style="color:${textColor};">Track every role in one place:</strong> add jobs manually or pull them in from the Hireall Chrome extension.</li>
                      <li style="margin-bottom:12px;"><strong style="color:${textColor};">Stay ahead with smart reminders:</strong> schedule follow-ups so nothing slips through the cracks.</li>
                      <li style="margin-bottom:12px;"><strong style="color:${textColor};">Spot visa-friendly companies:</strong> our sponsor insights help you prioritize the right openings.</li>
                    </ul>
                    <table border="0" cellPadding="0" cellSpacing="0" role="presentation" style="margin:0 0 32px;">
                      <tbody>
                        <tr>
                          <td>
                            <a class="cta-button" href="${dashboardUrl}" target="_blank" rel="noopener" style="display:inline-flex; align-items:center; justify-content:center; gap:8px; padding:14px 26px; border-radius:999px; background:${brandColor}; color:#ffffff; font-size:16px; font-weight:600; text-decoration:none; box-shadow:0 10px 25px -12px rgba(37, 99, 235, 0.7);">
                              Jump into your dashboard
                            </a>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <table width="100%" style="border-collapse:collapse; margin:0;">
                      <tbody>
                        <tr>
                          <td style="padding:18px 24px; border:1px solid ${borderColor}; border-radius:12px; background:${backgroundColor};">
                            <p style="margin:0 0 12px; font-size:15px; font-weight:600; color:${textColor};">Need a hand?</p>
                            <p style="margin:0; font-size:14px; line-height:1.6; color:${mutedTextColor};">
                              We love hearing from job seekers. Reply to this email or reach us anytime at <a href="mailto:support@hireall.com" style="color:${brandColor}; text-decoration:none;">support@hireall.com</a>.
                            </p>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <p style="margin:28px 0 0; font-size:15px; color:${mutedTextColor};">Cheering you on,<br/><span style="color:${textColor}; font-weight:600;">The Hireall Team</span></p>
                  </td>
                </tr>
                <tr>
                  <td style="text-align:center; padding-top:24px; font-size:12px; color:${mutedTextColor};">
                    © ${year} Hireall. 595 Market Street, San Francisco, CA 94103
                  </td>
                </tr>
                <tr>
                  <td style="text-align:center; padding-top:8px; font-size:12px; color:${mutedTextColor};">
                    Manage notifications from your <a href="${settingsUrl}" style="color:${brandColor}; text-decoration:none;">settings</a> anytime.
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

export function renderWelcomeEmailText({
  name,
  dashboardUrl = defaultDashboardUrl,
  settingsUrl = defaultSettingsUrl,
}: WelcomeEmailTemplateProps): string {
  const greeting = getGreeting(name);
  const year = currentYear();
  return `${greeting} 👋\n\nWelcome to Hireall — your smarter job search starts now.\n\nYou're ready to:\n• Track every role from one dashboard\n• Stay on top of follow-ups with reminders\n• Prioritize visa-friendly opportunities with sponsor insights\n\nJump into your dashboard → ${dashboardUrl}\n\nNeed help? Reply to this email or reach us at support@hireall.com.\n\nCheering you on,\nThe Hireall Team\n\n© ${year} Hireall | Manage notifications in your settings: ${settingsUrl}`;
}
