import { format } from "date-fns";
import { COLORS } from "../styles/colors";

export const NOTIFICATION_EMAIL_SUBJECT = "New Notification from Hireall";

interface NotificationEmailProps {
  userName?: string | null;
  title: string;
  message: string;
  type: string;
  actionUrl?: string;
  dashboardUrl?: string;
}

const backgroundColor = COLORS.backgroundLight;
const textColor = COLORS.text;
const mutedTextColor = COLORS.mutedText;
const cardBackground = COLORS.cardBackground;
const borderColor = COLORS.border;
const buttonBg = COLORS.buttonBg;
const buttonText = COLORS.buttonText;
const accentColor = COLORS.accent;

const defaultDashboardUrl = "https://hireall.app/dashboard";

export function renderNotificationEmailHtml({
  userName,
  title,
  message,
  type,
  actionUrl,
  dashboardUrl = defaultDashboardUrl,
}: NotificationEmailProps): string {
  const greeting = userName ? `Hi ${userName.split(" ")[0]}` : "Hi there";
  const year = format(new Date(), "yyyy");
  const finalActionUrl = actionUrl || dashboardUrl;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charSet="utf-8" />
    <title>${title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body style="margin:0; padding:32px 16px; background:${backgroundColor}; font-family:'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color:${textColor}">
    <table width="100%" border="0" cellPadding="0" cellSpacing="0">
      <tr>
        <td align="center">
          <table width="600" style="max-width:100%; border-collapse:collapse;">
            <!-- Logo -->
            <tr>
              <td style="text-align:center; padding-bottom:24px;">
                <div style="display:inline-flex; align-items:center; gap:12px;">
                  <div style="width:44px; height:44px; border-radius:12px; background:${buttonBg}; color:#fff; font-size:22px; font-weight:600; line-height:44px; text-align:center;">H</div>
                  <span style="font-size:22px; font-weight:700; color:${textColor};">Hireall</span>
                </div>
              </td>
            </tr>
            
            <!-- Main Card -->
            <tr>
              <td style="background:${cardBackground}; border-radius:16px; box-shadow:0 4px 12px rgba(0,0,0,0.1); padding:40px 48px; border:1px solid ${borderColor};">
                <p style="margin:0 0 8px; font-size:16px; color:${mutedTextColor};">${greeting},</p>
                <h1 style="margin:0 0 16px; font-size:22px; font-weight:700; letter-spacing:-0.5px; color:${textColor};">${title}</h1>
                
                <div style="background:${backgroundColor}; border-left:4px solid ${accentColor}; padding:16px; margin-bottom:24px;">
                  <p style="margin:0; font-size:16px; line-height:1.6; color:${textColor};">${message}</p>
                </div>

                <!-- CTA Button -->
                <table border="0" cellPadding="0" cellSpacing="0">
                  <tr>
                    <td>
                      <a href="${finalActionUrl}" style="display:inline-block; padding:14px 26px; border-radius:8px; background:${buttonBg}; color:${buttonText}; font-size:16px; font-weight:600; text-decoration:none;">
                        View in Hireall
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="text-align:center; padding-top:24px; font-size:12px; color:${mutedTextColor};">
                © ${year} Hireall. <a href="${dashboardUrl.replace('/dashboard', '/settings')}" style="color:${accentColor}; text-decoration:none;">Manage email preferences</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function renderNotificationEmailText({
  userName,
  title,
  message,
  type,
  actionUrl,
  dashboardUrl = defaultDashboardUrl,
}: NotificationEmailProps): string {
  const greeting = userName ? `Hi ${userName.split(" ")[0]}` : "Hi there";
  const finalActionUrl = actionUrl || dashboardUrl;

  return `${greeting},\n\n${title}\n\n${message}\n\nView here: ${finalActionUrl}\n\n---\nManage preferences: ${dashboardUrl.replace('/dashboard', '/settings')}`;
}
