// Resend email service integration
import { Resend } from 'resend';

let resendClient: Resend | null = null;

function isEmailConfigured() {
  return !!process.env.RESEND_API_KEY;
}

function shouldSkipEmailWhenUnconfigured() {
  // In production, treat missing configuration as an error.
  return process.env.NODE_ENV !== 'production';
}

function isValidEmailAddress(email: string) {
  // Pragmatic validation: enough to reject obvious bad input.
  // (Full RFC 5322 validation is overkill here.)
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

function getResendClient(): Resend {
  if (resendClient) {
    return resendClient;
  }
  
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured');
  }
  
  resendClient = new Resend(apiKey);
  return resendClient;
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
        console.warn('Email skipped: RESEND_API_KEY is not configured');
        return { success: true, skipped: true };
      }
      return { success: false, error: 'RESEND_API_KEY is not configured' };
    }

    const fromEmail = data.from || process.env.RESEND_FROM_EMAIL || 'noreply@hireall.app';
    
    const { data: result, error } = await getResendClient().emails.send({
      from: fromEmail,
      to: toList,
      subject,
      html,
      text: data.text,
      reply_to: data.replyTo,
      tags: data.tags,
    });

    if (error) {
      console.error('Resend API error:', error);
      return {
        success: false,
        error: error.message
      };
    }

    console.log('Email sent successfully:', result);
    return {
      success: true,
      messageId: result?.id
    };

  } catch (error) {
    console.error('Email sending error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
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
          error: result.reason?.message || 'Batch sending failed'
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

export function isResendConfigured() {
  return isEmailConfigured();
}