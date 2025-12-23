// Brevo email service integration
import * as brevo from '@getbrevo/brevo';

let brevoClient: brevo.TransactionalEmailsApi | null = null;

function isEmailConfigured() {
  return !!process.env.BREVO_API_KEY;
}

function shouldSkipEmailWhenUnconfigured() {
  // In production, treat missing configuration as an error.
  return process.env.NODE_ENV !== 'production';
}

function isValidEmailAddress(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function stringifyVariable(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function getBrevoClient(): brevo.TransactionalEmailsApi {
  if (brevoClient) {
    return brevoClient;
  }
  
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error('BREVO_API_KEY is not configured');
  }
  
  brevoClient = new brevo.TransactionalEmailsApi();
  brevoClient.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);
  return brevoClient;
}

export interface EmailData {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  tags?: { name: string; value: string }[];
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  skipped?: boolean;
  error?: string;
}

export async function sendEmail(data: EmailData): Promise<EmailResult> {
  try {
    const toList = (Array.isArray(data.to) ? data.to : [data.to])
      .map((v) => (typeof v === 'string' ? v.trim() : ''))
      .filter(Boolean);

    if (toList.length === 0) {
      return { success: false, error: 'Recipient email is required' };
    }

    const invalid = toList.filter((v) => !isValidEmailAddress(v));
    if (invalid.length > 0) {
      return { success: false, error: 'Invalid recipient email format' };
    }

    const subject = typeof data.subject === 'string' ? data.subject.trim() : '';
    if (!subject) {
      return { success: false, error: 'Email subject is required' };
    }

    const html = typeof data.html === 'string' ? data.html : '';
    if (!html) {
      return { success: false, error: 'Email html is required' };
    }

    if (!isEmailConfigured()) {
      if (shouldSkipEmailWhenUnconfigured()) {
        console.warn('Email skipped: BREVO_API_KEY is not configured');
        return { success: true, skipped: true };
      }
      return { success: false, error: 'BREVO_API_KEY is not configured' };
    }

    const fromEmail = data.from || process.env.BREVO_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || 'Hireall <noreply@hireall.app>';
    
    // Parse fromEmail if it's in "Name <email@domain.com>" format
    let senderName = 'Hireall';
    let senderEmail = 'noreply@hireall.app';
    
    const fromMatch = fromEmail.match(/^(.*?)\s*<(.*?)>$/);
    if (fromMatch) {
      senderName = fromMatch[1].trim();
      senderEmail = fromMatch[2].trim();
    } else if (isValidEmailAddress(fromEmail)) {
      senderEmail = fromEmail;
    }

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = html;
    if (data.text) {
      sendSmtpEmail.textContent = data.text;
    }
    sendSmtpEmail.sender = { name: senderName, email: senderEmail };
    sendSmtpEmail.to = toList.map(email => ({ email }));
    
    if (data.replyTo) {
      sendSmtpEmail.replyTo = { email: data.replyTo };
    }

    if (data.tags && data.tags.length > 0) {
      sendSmtpEmail.tags = data.tags.map(tag => tag.name);
    }

    const result = await getBrevoClient().sendTransacEmail(sendSmtpEmail);

    console.log('Email sent successfully:', result.body);
    return {
      success: true,
      messageId: result.body.messageId
    };

  } catch (error: any) {
    console.error('Email sending error:', error);
    return {
      success: false,
      error: error?.response?.body?.message || error?.message || 'Unknown error'
    };
  }
}

export async function sendBulkEmails(
  emails: EmailData[],
  options: {
    batchSize?: number;
    delayBetweenBatches?: number;
  } = {}
): Promise<{ results: EmailResult[]; summary: { sent: number; failed: number } }> {
  const { batchSize = 100, delayBetweenBatches = 1000 } = options;
  const results: EmailResult[] = [];
  
  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);
    
    const batchResults = await Promise.allSettled(
      batch.map(email => sendEmail(email))
    );

    batchResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        results.push({
          success: false,
          error: (result.reason as any)?.message || 'Batch sending failed'
        });
      }
    });

    // Add delay between batches to avoid rate limiting
    if (i + batchSize < emails.length && delayBetweenBatches > 0) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }
  }

  const summary = {
    sent: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length
  };

  return { results, summary };
}

// Template personalization
export function personalizeTemplate(
  template: string,
  variables: Record<string, any>,
  options: { escapeHtml?: boolean } = {}
): string {
  const escape = options.escapeHtml === true;
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    if (!Object.prototype.hasOwnProperty.call(variables, key)) {
      return match;
    }
    const raw = stringifyVariable(variables[key]);
    return escape ? escapeHtml(raw) : raw;
  });
}

export function personalizeSubject(
  subject: string,
  variables: Record<string, any>
): string {
  return personalizeTemplate(subject, variables, { escapeHtml: false });
}

export function isEmailServiceConfigured() {
  return isEmailConfigured();
}
