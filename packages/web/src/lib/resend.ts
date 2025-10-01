// Resend email service integration
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailData {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendEmail(data: EmailData): Promise<EmailResult> {
  try {
    const fromEmail = data.from || process.env.RESEND_FROM_EMAIL || 'noreply@hireall.app';
    
    const { data: result, error } = await resend.emails.send({
      from: fromEmail,
      to: Array.isArray(data.to) ? data.to : [data.to],
      subject: data.subject,
      html: data.html,
      text: data.text,
      reply_to: data.replyTo,
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
  variables: Record<string, any>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] || match;
  });
}

export function personalizeSubject(
  subject: string,
  variables: Record<string, any>
): string {
  return personalizeTemplate(subject, variables);
}