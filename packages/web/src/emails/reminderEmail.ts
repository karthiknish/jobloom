import { format, formatDistanceToNow } from "date-fns";
import { COLORS } from "../styles/colors";

export const REMINDER_EMAIL_SUBJECT = "Job Application Reminder";

type ReminderType = "follow_up" | "deadline" | "weekly_digest";

interface ReminderEmailProps {
  userName?: string | null;
  reminderType: ReminderType;
  // For single job reminders
  jobTitle?: string;
  companyName?: string;
  reminderDate?: Date | string;
  notes?: string;
  // For weekly digest
  totalApplications?: number;
  applicationsThisWeek?: number;
  pendingFollowUps?: { jobTitle: string; company: string; appliedDate: Date | string }[];
  dashboardUrl?: string;
}

const REMINDER_HEADERS: Record<ReminderType, string> = {
  follow_up: "Time to follow up!",
  deadline: "Application deadline approaching",
  weekly_digest: "Your weekly job search summary",
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

export function renderReminderEmailHtml({
  userName,
  reminderType,
  jobTitle,
  companyName,
  reminderDate,
  notes,
  totalApplications,
  applicationsThisWeek,
  pendingFollowUps,
  dashboardUrl = defaultDashboardUrl,
}: ReminderEmailProps): string {
  const greeting = userName ? `Hi ${userName.split(" ")[0]}` : "Hi there";
  const year = format(new Date(), "yyyy");
  const header = REMINDER_HEADERS[reminderType];

  // Format the reminder date if provided
  const formattedDate = reminderDate 
    ? format(new Date(reminderDate), "EEEE, MMMM d 'at' h:mm a")
    : null;

  // Build content based on reminder type
  let contentHtml = "";

  if (reminderType === "weekly_digest") {
    contentHtml = `
      <!-- Weekly Stats -->
      <div style="display:flex; gap:16px; margin-bottom:24px;">
        <div style="flex:1; background:${backgroundColor}; border:1px solid ${borderColor}; border-radius:12px; padding:20px; text-align:center;">
          <p style="margin:0 0 4px; font-size:28px; font-weight:700; color:${textColor};">${totalApplications || 0}</p>
          <p style="margin:0; font-size:13px; color:${mutedTextColor};">Total Applications</p>
        </div>
        <div style="flex:1; background:${backgroundColor}; border:1px solid ${borderColor}; border-radius:12px; padding:20px; text-align:center;">
          <p style="margin:0 0 4px; font-size:28px; font-weight:700; color:${accentColor};">+${applicationsThisWeek || 0}</p>
          <p style="margin:0; font-size:13px; color:${mutedTextColor};">This Week</p>
        </div>
      </div>

      ${pendingFollowUps && pendingFollowUps.length > 0 ? `
      <!-- Pending Follow-ups -->
      <div style="margin-bottom:24px;">
        <p style="margin:0 0 12px; font-size:16px; font-weight:600; color:${textColor};">Follow-up Suggestions</p>
        <p style="margin:0 0 12px; font-size:14px; color:${mutedTextColor};">Consider following up on these applications:</p>
        ${pendingFollowUps.slice(0, 5).map(job => `
        <div style="background:${backgroundColor}; border:1px solid ${borderColor}; border-radius:8px; padding:16px; margin-bottom:8px;">
          <p style="margin:0 0 4px; font-size:14px; font-weight:600; color:${textColor};">${job.jobTitle}</p>
          <p style="margin:0; font-size:13px; color:${mutedTextColor};">${job.company} • Applied ${formatDistanceToNow(new Date(job.appliedDate), { addSuffix: true })}</p>
        </div>
        `).join('')}
      </div>
      ` : ''}
    `;
  } else {
    // Single job reminder
    contentHtml = `
      <div style="background:${backgroundColor}; border:1px solid ${borderColor}; border-radius:12px; padding:20px; margin-bottom:24px;">
        <p style="margin:0 0 4px; font-size:18px; font-weight:600; color:${textColor};">${jobTitle}</p>
        <p style="margin:0 0 12px; font-size:14px; color:${mutedTextColor};">${companyName}</p>
        ${formattedDate ? `<p style="margin:0; font-size:14px; color:${accentColor}; font-weight:500;">${formattedDate}</p>` : ''}
      </div>

      ${notes ? `
      <div style="background:#FEF3C7; border:1px solid #F59E0B; border-radius:8px; padding:16px; margin-bottom:24px;">
        <p style="margin:0 0 8px; font-size:14px; font-weight:600; color:#92400E;">Your notes:</p>
        <p style="margin:0; font-size:14px; color:#92400E;">${notes}</p>
      </div>
      ` : ''}

      ${reminderType === "follow_up" ? `
      <p style="margin:0 0 16px; font-size:14px; color:${mutedTextColor};">
        <strong>Follow-up tips:</strong>
      </p>
      <ul style="margin:0 0 24px; padding-left:20px; color:${mutedTextColor}; font-size:14px; line-height:1.7;">
        <li>Keep it brief and professional</li>
        <li>Reference your application date</li>
        <li>Express continued interest in the role</li>
      </ul>
      ` : ''}
    `;
  }

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charSet="utf-8" />
    <title>${header}</title>
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
                <h1 style="margin:0 0 24px; font-size:24px; font-weight:700; letter-spacing:-0.5px;">${header}</h1>
                
                ${contentHtml}

                <!-- CTA Button -->
                <table border="0" cellPadding="0" cellSpacing="0">
                  <tr>
                    <td>
                      <a href="${dashboardUrl}" style="display:inline-block; padding:14px 26px; border-radius:8px; background:${buttonBg}; color:${buttonText}; font-size:16px; font-weight:600; text-decoration:none;">
                        Open Dashboard
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

export function renderReminderEmailText({
  userName,
  reminderType,
  jobTitle,
  companyName,
  reminderDate,
  notes,
  totalApplications,
  applicationsThisWeek,
  pendingFollowUps,
  dashboardUrl = defaultDashboardUrl,
}: ReminderEmailProps): string {
  const greeting = userName ? `Hi ${userName.split(" ")[0]}` : "Hi there";
  const header = REMINDER_HEADERS[reminderType];

  let content = `${greeting},\n\n${header}\n\n`;

  if (reminderType === "weekly_digest") {
    content += `Your Stats\n`;
    content += `• Total Applications: ${totalApplications || 0}\n`;
    content += `• Added This Week: ${applicationsThisWeek || 0}\n\n`;

    if (pendingFollowUps && pendingFollowUps.length > 0) {
      content += `Consider Following Up:\n`;
      pendingFollowUps.slice(0, 5).forEach(j => {
        content += `• ${j.jobTitle} at ${j.company}\n`;
      });
    }
  } else {
    content += `Job: ${jobTitle}\n`;
    content += `Company: ${companyName}\n`;
    if (reminderDate) {
      content += `When: ${format(new Date(reminderDate), "EEEE, MMMM d 'at' h:mm a")}\n`;
    }
    if (notes) {
      content += `\nYour notes: ${notes}\n`;
    }
  }

  content += `\n---\nView in Dashboard: ${dashboardUrl}\n`;

  return content;
}
