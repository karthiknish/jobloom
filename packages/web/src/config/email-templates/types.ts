/**
 * Email Template Types
 */

export interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  category: 'marketing' | 'newsletter' | 'onboarding' | 'promotional' | 'announcement';
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: string[];
  preview?: string;
  tags: string[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailCampaign {
  id: string;
  name: string;
  templateId: string;
  subject: string;
  fromEmail: string;
  fromName: string;
  replyTo?: string;
  recipients: {
    type: 'all' | 'segment' | 'custom';
    segment?: string;
    customEmails?: string[];
  };
  schedule?: {
    type: 'immediate' | 'scheduled';
    sendAt?: Date;
  };
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled';
  metrics: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
  };
  createdAt: Date;
  updatedAt: Date;
  sentAt?: Date;
}

export type EmailCategory = EmailTemplate['category'];
