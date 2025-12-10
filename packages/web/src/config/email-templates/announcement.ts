/**
 * Announcement Email Templates
 */

import type { EmailTemplate } from './types';

export const announcementTemplates: EmailTemplate[] = [
  {
    id: 'feature-announcement',
    name: 'New Feature Announcement',
    description: 'Announce new platform features and improvements',
    category: 'announcement',
    subject: 'Exciting New Features on HireAll! 🎉',
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Features Announcement</title>
        <style>
          body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 30px 0; background: linear-gradient(135deg, #059669 0%, #0d9488 100%); color: white; border-radius: 10px 10px 0 0; }
          .content { padding: 30px; background: #f9fafb; border-radius: 0 0 10px 10px; }
          .feature { margin: 25px 0; padding: 25px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .feature-title { font-size: 20px; font-weight: bold; color: #1f2937; margin-bottom: 10px; }
          .feature-icon { font-size: 24px; margin-bottom: 10px; }
          .button { display: inline-block; padding: 12px 24px; background: #059669; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Big News! 🚀</h1>
            <p>We've launched exciting new features just for you</p>
          </div>
          <div class="content">
            <p>Hi {{firstName}},</p>
            <p>We're excited to announce some powerful new features that will help you advance your career even faster!</p>
            
            {{#each features}}
            <div class="feature">
              <div class="feature-icon">{{icon}}</div>
              <div class="feature-title">{{title}}</div>
              <p>{{description}}</p>
              <a href="{{learnMoreUrl}}" class="button">Learn More</a>
            </div>
            {{/each}}
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="{{dashboardUrl}}" class="button">Try New Features</a>
            </div>
            
            <p>These updates are designed to give you more control and better results in your career journey.</p>
            <p>We can't wait to see what you'll accomplish with these new tools!</p>
            <p>Best regards,<br>The HireAll Team</p>
          </div>
        </div>
      </body>
      </html>
    `,
    textContent: `
      Exciting New Features on HireAll!
      
      Hi {{firstName}},
      
      We're excited to announce powerful new features to help advance your career!
      
      {{#each features}}
      {{icon}} {{title}}
      {{description}}
      Learn more: {{learnMoreUrl}}
      
      {{/each}}
      
      Try them now: {{dashboardUrl}}
      
      These updates are designed to give you better results in your career journey.
      
      Best regards,
      The HireAll Team
    `,
    variables: ['firstName', 'features', 'dashboardUrl'],
    preview: 'Announce new platform features and improvements',
    tags: ['announcement', 'features', 'updates', 'new'],
    active: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];
