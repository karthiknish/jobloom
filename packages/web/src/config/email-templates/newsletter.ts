/**
 * Newsletter Email Templates
 */

import type { EmailTemplate } from './types';

export const newsletterTemplates: EmailTemplate[] = [
  {
    id: 'monthly-newsletter',
    name: 'Monthly Career Insights',
    description: 'Monthly newsletter with career tips, job market trends, and platform updates',
    category: 'newsletter',
    subject: 'Your Monthly Career Insights from HireAll 📊',
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Monthly Career Insights</title>
        <style>
          body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 30px 0; background: linear-gradient(135deg, #059669 0%, #0d9488 100%); color: white; border-radius: 10px 10px 0 0; }
          .content { padding: 30px; background: #f9fafb; border-radius: 0 0 10px 10px; }
          .article { margin: 20px 0; padding: 20px; background: white; border-radius: 6px; border-left: 4px solid #059669; }
          .stats { display: flex; justify-content: space-around; margin: 20px 0; }
          .stat { text-align: center; padding: 15px; background: white; border-radius: 6px; flex: 1; margin: 0 5px; }
          .button { display: inline-block; padding: 12px 24px; background: #059669; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Monthly Career Insights 📈</h1>
            <p>{{month}} {{year}} Edition</p>
          </div>
          <div class="content">
            <p>Hi {{firstName}},</p>
            <p>Here's your monthly dose of career insights, job market trends, and platform updates!</p>
            
            <div class="stats">
              <div class="stat">
                <h3>{{newJobsCount}}</h3>
                <p>New Jobs This Month</p>
              </div>
              <div class="stat">
                <h3>{{successStories}}</h3>
                <p>Success Stories</p>
              </div>
              <div class="stat">
                <h3>{{newFeatures}}</h3>
                <p>New Features</p>
              </div>
            </div>
            
            <div class="article">
              <h3>🔥 Hot Job Market Trends</h3>
              <p>{{marketTrends}}</p>
            </div>
            
            <div class="article">
              <h3>💡 Career Tip of the Month</h3>
              <p>{{careerTip}}</p>
            </div>
            
            <div class="article">
              <h3>🚀 Platform Updates</h3>
              <p>{{platformUpdates}}</p>
            </div>
            
            <div style="text-align: center;">
              <a href="{{dashboardUrl}}" class="button">Explore Opportunities</a>
            </div>
            
            <p>Keep growing and achieving!</p>
            <p>Best regards,<br>The HireAll Team</p>
          </div>
        </div>
      </body>
      </html>
    `,
    textContent: `
      Monthly Career Insights from HireAll
      
      Hi {{firstName}},
      
      Here's your monthly dose of career insights!
      
      This Month's Stats:
      • {{newJobsCount}} new jobs posted
      • {{successStories}} success stories shared
      • {{newFeatures}} new features launched
      
      Hot Job Market Trends:
      {{marketTrends}}
      
      Career Tip of the Month:
      {{careerTip}}
      
      Platform Updates:
      {{platformUpdates}}
      
      Explore more: {{dashboardUrl}}
      
      Best regards,
      The HireAll Team
    `,
    variables: ['firstName', 'month', 'year', 'newJobsCount', 'successStories', 'newFeatures', 'marketTrends', 'careerTip', 'platformUpdates', 'dashboardUrl'],
    preview: 'Monthly newsletter with career insights and platform updates',
    tags: ['newsletter', 'monthly', 'insights', 'trends'],
    active: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];
