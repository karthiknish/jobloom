import { format } from "date-fns";
import { COLORS } from "../styles/colors";

export const STATUS_CHANGE_SUBJECT = "Your application status has been updated";

type ApplicationStatus = "saved" | "applied" | "offered" | "rejected" | "withdrawn";

interface StatusChangeEmailProps {
  userName?: string | null;
  jobTitle: string;
  companyName: string;
  previousStatus: ApplicationStatus;
  newStatus: ApplicationStatus;
  dashboardUrl?: string;
  jobUrl?: string;
}

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  saved: "Saved",
  applied: "Applied",
  offered: "Offered",
  rejected: "Not Selected",
  withdrawn: "Withdrawn",
};

const STATUS_MESSAGES: Record<ApplicationStatus, string> = {
  saved: "You've saved this job to review later.",
  applied: "Great job! You've submitted your application.",
  offered: "Amazing news! You've received an offer!",
  rejected: "Unfortunately, this application didn't work out this time.",
  withdrawn: "You've withdrawn your application for this role.",
};

const STATUS_TIPS: Record<ApplicationStatus, string[]> = {
  saved: [
    "Review the job description carefully",
    "Tailor your CV to match key requirements",
    "Research the company before applying"
  ],
  applied: [
    "Follow up if you haven't heard back in 1-2 weeks",
    "Continue applying to other positions",
    "Prepare for potential next steps"
  ],
  offered: [
    "Review the offer details carefully",
    "Consider negotiating if appropriate",
    "Don't forget to respond within the deadline"
  ],
  rejected: [
    "Don't be discouraged - it's part of the process",
    "Request feedback if possible",
    "Keep applying - your right role is out there"
  ],
  withdrawn: [
    "Focus on other promising opportunities",
    "Update your dashboard regularly",
    "Keep track of your top priority applications"
  ],
};

const brandColor = COLORS.brand;
const backgroundColor = COLORS.backgroundLight;
const textColor = COLORS.text;
const mutedTextColor = COLORS.mutedText;
const cardBackground = COLORS.cardBackground;
const borderColor = COLORS.border;
const buttonBg = COLORS.buttonBg;
const buttonText = COLORS.buttonText;
const accentColor = COLORS.accent;

const defaultDashboardUrl = "https://hireall.app/dashboard";

export function renderStatusChangeEmailHtml({
  userName,
  jobTitle,
  companyName,
  previousStatus,
  newStatus,
  dashboardUrl = defaultDashboardUrl,
  jobUrl,
}: StatusChangeEmailProps): string {
  const greeting = userName ? `Hi ${userName.split(" ")[0]}` : "Hi there";
  const year = format(new Date(), "yyyy");
  const statusLabel = STATUS_LABELS[newStatus];
  const statusMessage = STATUS_MESSAGES[newStatus];
  const tips = STATUS_TIPS[newStatus];

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charSet="utf-8" />
    <title>Application Status Update</title>
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
                <h1 style="margin:0 0 16px; font-size:24px; font-weight:700; letter-spacing:-0.5px;">${statusMessage}</h1>
                
                <!-- Job Info Card -->
                <div style="background:${backgroundColor}; border:1px solid ${borderColor}; border-radius:12px; padding:20px; margin:0 0 24px;">
                  <p style="margin:0 0 4px; font-size:18px; font-weight:600; color:${textColor};">${jobTitle}</p>
                  <p style="margin:0 0 12px; font-size:14px; color:${mutedTextColor};">${companyName}</p>
                  <div style="display:inline-block; padding:6px 12px; border-radius:6px; background:${buttonBg}; color:#fff; font-size:13px; font-weight:600;">
                    ${statusLabel}
                  </div>
                </div>

                <!-- Tips Section -->
                <p style="margin:0 0 12px; font-size:14px; font-weight:600; color:${textColor};">Tips for this stage:</p>
                <ul style="margin:0 0 24px; padding-left:20px; color:${mutedTextColor}; font-size:14px; line-height:1.7;">
                  ${tips.map(tip => `<li style="margin-bottom:8px;">${tip}</li>`).join('')}
                </ul>

                <!-- CTA Button -->
                <table border="0" cellPadding="0" cellSpacing="0">
                  <tr>
                    <td>
                      <a href="${dashboardUrl}" style="display:inline-block; padding:14px 26px; border-radius:8px; background:${buttonBg}; color:${buttonText}; font-size:16px; font-weight:600; text-decoration:none;">
                        View in Dashboard
                      </a>
                    </td>
                    ${jobUrl ? `
                    <td style="padding-left:12px;">
                      <a href="${jobUrl}" style="display:inline-block; padding:14px 26px; border-radius:8px; background:transparent; border:1px solid ${borderColor}; color:${textColor}; font-size:16px; font-weight:600; text-decoration:none;">
                        View Job Posting
                      </a>
                    </td>
                    ` : ''}
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="text-align:center; padding-top:24px; font-size:12px; color:${mutedTextColor};">
                © ${year} Hireall. All rights reserved.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function renderStatusChangeEmailText({
  userName,
  jobTitle,
  companyName,
  newStatus,
  dashboardUrl = defaultDashboardUrl,
}: StatusChangeEmailProps): string {
  const greeting = userName ? `Hi ${userName.split(" ")[0]}` : "Hi there";
  const statusMessage = STATUS_MESSAGES[newStatus];
  const tips = STATUS_TIPS[newStatus];

  return `${greeting},

${statusMessage}

Job: ${jobTitle}
Company: ${companyName}
Status: ${STATUS_LABELS[newStatus]}

Tips for this stage:
${tips.map(tip => `• ${tip}`).join('\n')}

View in Dashboard: ${dashboardUrl}

---
Hireall - Your smarter job search
`;
}
