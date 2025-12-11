/**
 * Marketing Email Templates
 */

import type { EmailTemplate } from './types';

export const marketingTemplates: EmailTemplate[] = [
  {
    id: 'uk-sponsorship-guide',
    name: 'UK Sponsorship Guide',
    description: 'Comprehensive guide for UK visa sponsorship requirements and opportunities',
    category: 'marketing',
    subject: 'Your Complete Guide to UK Sponsorship Opportunities',
    htmlContent: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:'Inter',sans-serif;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px}.header{text-align:center;padding:30px 0;background:linear-gradient(135deg,#059669 0%,#0d9488 100%);color:white;border-radius:10px 10px 0 0}.content{padding:30px;background:#f9fafb;border-radius:0 0 10px 10px}.guide-section{background:white;padding:25px;border-radius:8px;margin:20px 0;border-left:4px solid #059669}.button{display:inline-block;padding:12px 24px;background:#059669;color:white;text-decoration:none;border-radius:6px}</style></head><body><div class="container"><div class="header"><h1>Your UK Sponsorship Guide</h1></div><div class="content"><p>Hi {{firstName}},</p><p>Here's your comprehensive guide to UK sponsorship opportunities.</p><div class="guide-section"><h3>UK Visa Types</h3><ul><li>Skilled Worker Visa</li><li>Global Talent Visa</li><li>Health and Care Visa</li><li>Graduate Route Visa</li></ul></div><div style="text-align:center"><a href="{{sponsorshipUrl}}" class="button">Explore Opportunities</a></div><p>Best regards,<br>The HireAll Team</p></div></div></body></html>`,
    textContent: `UK Sponsorship Guide\n\nHi {{firstName}},\n\nHere's your guide to UK sponsorship opportunities.\n\nExplore: {{sponsorshipUrl}}\n\nBest regards,\nThe HireAll Team`,
    variables: ['firstName', 'sponsorshipUrl'],
    preview: 'Comprehensive UK sponsorship guide',
    tags: ['uk', 'sponsorship', 'visa', 'guide'],
    active: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'application-success-story',
    name: 'Application Success Story',
    description: 'Share success stories and testimonials to encourage engagement',
    category: 'marketing',
    subject: 'How {{candidateName}} Landed Their Dream Job in the UK',
    htmlContent: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:'Inter',sans-serif;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px}.header{text-align:center;padding:30px 0;background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:white;border-radius:10px 10px 0 0}.content{padding:30px;background:#f9fafb;border-radius:0 0 10px 10px}.testimonial{background:white;padding:30px;border-radius:10px;margin:20px 0;border-left:4px solid #10b981}.quote{font-size:18px;font-style:italic;color:#059669;margin:20px 0}.button{display:inline-block;padding:12px 24px;background:#10b981;color:white;text-decoration:none;border-radius:6px}</style></head><body><div class="container"><div class="header"><h1>Success Story</h1></div><div class="content"><p>Hi {{firstName}},</p><div class="testimonial"><h3>{{candidateName}}</h3><p>{{candidateRole}} at {{candidateCompany}}</p><div class="quote">"{{testimonialQuote}}"</div></div><div style="text-align:center"><a href="{{dashboardUrl}}" class="button">Start Your Journey</a></div><p>Best regards,<br>The HireAll Team</p></div></div></body></html>`,
    textContent: `Success Story: {{candidateName}}\n\nHi {{firstName}},\n\n"{{testimonialQuote}}"\n\nStart your journey: {{dashboardUrl}}\n\nBest regards,\nThe HireAll Team`,
    variables: ['firstName', 'candidateName', 'candidateRole', 'candidateCompany', 'testimonialQuote', 'dashboardUrl'],
    preview: 'Success story testimonial',
    tags: ['success-story', 'testimonial', 'motivation'],
    active: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'job-alert',
    name: 'New Job Alert',
    description: 'Personalized job recommendations based on user profile and preferences',
    category: 'marketing',
    subject: 'New Job Opportunities Matching Your Profile',
    htmlContent: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:'Inter',sans-serif;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px}.header{text-align:center;padding:30px 0;background:linear-gradient(135deg,#059669 0%,#0d9488 100%);color:white;border-radius:10px 10px 0 0}.content{padding:30px;background:#f9fafb;border-radius:0 0 10px 10px}.job-card{margin:20px 0;padding:20px;background:white;border-radius:8px;border:1px solid #e5e7eb}.button{display:inline-block;padding:10px 20px;background:#059669;color:white;text-decoration:none;border-radius:6px}</style></head><body><div class="container"><div class="header"><h1>New Job Matches</h1><p>{{jobCount}} opportunities for you</p></div><div class="content"><p>Hi {{firstName}},</p><p>We found new jobs matching your skills!</p><div style="text-align:center;margin-top:30px"><a href="{{dashboardUrl}}" class="button">View All Jobs</a></div><p>Best regards,<br>The HireAll Team</p></div></div></body></html>`,
    textContent: `New Job Opportunities\n\nHi {{firstName}},\n\nWe found {{jobCount}} new jobs matching your profile.\n\nView all: {{dashboardUrl}}\n\nBest regards,\nThe HireAll Team`,
    variables: ['firstName', 'jobCount', 'dashboardUrl'],
    preview: 'Personalized job recommendations',
    tags: ['jobs', 'recommendations', 'alerts'],
    active: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 're-engagement',
    name: 'User Re-engagement Campaign',
    description: 'Re-engage inactive users with personalized content and incentives',
    category: 'marketing',
    subject: "We Miss You! Here's What's New on HireAll",
    htmlContent: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:'Inter',sans-serif;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px}.header{text-align:center;padding:30px 0;background:linear-gradient(135deg,#059669 0%,#0d9488 100%);color:white;border-radius:10px 10px 0 0}.content{padding:30px;background:#f9fafb;border-radius:0 0 10px 10px}.offer{background:linear-gradient(135deg,#fef3c7 0%,#fde68a 100%);padding:20px;border-radius:8px;margin:20px 0;text-align:center}.button{display:inline-block;padding:12px 24px;background:#059669;color:white;text-decoration:none;border-radius:6px}</style></head><body><div class="container"><div class="header"><h1>We Miss You!</h1><p>It's been {{daysSinceLastLogin}} days</p></div><div class="content"><p>Hi {{firstName}},</p><div class="offer"><h3>Welcome Back Offer</h3><p>Get {{offerDiscount}} off</p><a href="{{offerUrl}}" class="button">Claim Offer</a></div><div style="text-align:center"><a href="{{dashboardUrl}}" class="button">Come Back & Explore</a></div><p>Best regards,<br>The HireAll Team</p></div></div></body></html>`,
    textContent: `We Miss You!\n\nHi {{firstName}},\n\nIt's been {{daysSinceLastLogin}} days since your last visit.\n\nGet {{offerDiscount}} off: {{offerUrl}}\n\nCome back: {{dashboardUrl}}\n\nBest regards,\nThe HireAll Team`,
    variables: ['firstName', 'daysSinceLastLogin', 'offerDiscount', 'offerUrl', 'dashboardUrl'],
    preview: 'Re-engage inactive users',
    tags: ['re-engagement', 'inactive', 'welcome-back'],
    active: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];
