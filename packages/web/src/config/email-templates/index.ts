/**
 * Email Templates Module
 * 
 * Exports all email templates and helper functions.
 */

export type { EmailTemplate, EmailCampaign, EmailCategory } from './types';

import { onboardingTemplates } from './onboarding';
import { promotionalTemplates } from './promotional';
import { newsletterTemplates } from './newsletter';
import { announcementTemplates } from './announcement';
import { marketingTemplates } from './marketing';
import type { EmailTemplate } from './types';

/**
 * All default email templates combined
 */
export const defaultEmailTemplates: EmailTemplate[] = [
  ...onboardingTemplates,
  ...promotionalTemplates,
  ...marketingTemplates,
  ...newsletterTemplates,
  ...announcementTemplates,
];

// Re-export individual category arrays for selective imports
export { onboardingTemplates } from './onboarding';
export { promotionalTemplates } from './promotional';
export { newsletterTemplates } from './newsletter';
export { announcementTemplates } from './announcement';
export { marketingTemplates } from './marketing';

/**
 * Get a template by ID
 */
export function getEmailTemplate(id: string): EmailTemplate | undefined {
  return defaultEmailTemplates.find(t => t.id === id);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: EmailTemplate['category']): EmailTemplate[] {
  return defaultEmailTemplates.filter(t => t.category === category);
}

/**
 * Get all active templates
 */
export function getActiveTemplates(): EmailTemplate[] {
  return defaultEmailTemplates.filter(t => t.active);
}

/**
 * Get templates by tag
 */
export function getTemplatesByTag(tag: string): EmailTemplate[] {
  return defaultEmailTemplates.filter(t => t.tags.includes(tag));
}
