/**
 * Onboarding Email Templates
 */

import type { EmailTemplate } from './types';

export const onboardingTemplates: EmailTemplate[] = [
  {
    id: 'welcome-newsletter',
    name: 'Welcome Newsletter',
    description: 'Welcome email for new subscribers with platform introduction',
    category: 'onboarding',
    subject: 'Welcome to HireAll - Your Career Journey Starts Here!',
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to HireAll</title>
        <style>
          body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 30px 0; background: linear-gradient(135deg, #059669 0%, #0d9488 100%); color: white; border-radius: 10px 10px 0 0; }
          .content { padding: 30px; background: #f9fafb; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 24px; background: #059669; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .feature { margin: 20px 0; padding: 15px; background: white; border-radius: 6px; border-left: 4px solid #059669; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to HireAll!</h1>
            <p>Your career transformation platform</p>
          </div>
          <div class="content">
            <p>Hi {{firstName}},</p>
            <p>We're thrilled to have you join our community of professionals who are taking their careers to the next level!</p>
            
            <div class="feature">
              <h3>AI-Powered Resume Builder</h3>
              <p>Let our AI help you craft the perfect resume that gets past ATS systems and impresses recruiters.</p>
            </div>
            
            <div class="feature">
              <h3>Job Discovery Platform</h3>
              <p>Find opportunities that match your skills and career aspirations with our smart job matching.</p>
            </div>
            
            <div style="text-align: center;">
              <a href="{{dashboardUrl}}" class="button">Get Started Now</a>
            </div>
            
            <p>Ready to transform your career? Your journey starts now!</p>
            <p>Best regards,<br>The HireAll Team</p>
          </div>
        </div>
      </body>
      </html>
    `,
    textContent: `
      Welcome to HireAll, {{firstName}}!
      
      We're thrilled to have you join our community of professionals who are taking their careers to the next level!
      
      With HireAll, you can:
      • Create AI-powered resumes that get results
      • Discover job opportunities matched to your skills
      
      Get started now: {{dashboardUrl}}
      
      Best regards,
      The HireAll Team
    `,
    variables: ['firstName', 'dashboardUrl'],
    preview: 'Welcome email introducing platform features',
    tags: ['welcome', 'onboarding', 'new-user'],
    active: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];
