/**
 * Promotional Email Templates
 */

import type { EmailTemplate } from './types';

export const promotionalTemplates: EmailTemplate[] = [
  {
    id: 'premium-upgrade-reminder',
    name: 'Premium Upgrade Reminder',
    description: 'Encourage free users to upgrade to premium with limited-time offer',
    category: 'promotional',
    subject: '🔥 Limited Time: Unlock Premium Features for 50% Off!',
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Premium Upgrade Offer</title>
        <style>
          body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 40px 0; background: linear-gradient(135deg, #059669 0%, #0d9488 100%); color: white; border-radius: 10px 10px 0 0; }
          .content { padding: 30px; background: #f9fafb; border-radius: 0 0 10px 10px; }
          .offer-box { background: linear-gradient(135deg, #059669 0%, #0d9488 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin: 20px 0; }
          .feature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0; }
          .feature { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #059669; }
          .button { display: inline-block; padding: 15px 30px; background: #f59e0b; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; }
          .timer { background: #fef3c7; color: #856404; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔥 Exclusive Offer for {{firstName}}!</h1>
            <p>Upgrade to Premium and Transform Your Career</p>
          </div>
          <div class="content">
            <div class="offer-box">
              <h2 style="font-size: 36px; margin: 0;">50% OFF</h2>
              <p style="font-size: 18px; margin: 10px 0;">Premium Annual Plan</p>
              <p style="font-size: 14px; opacity: 0.9;">Normally $5.99/month - Now just $2.99/month!</p>
            </div>
            
            <div class="timer">
              <strong>⏰ Limited Time Offer!</strong><br>
              This special discount expires in {{offerExpiry}} hours
            </div>
            
            <h3>🚀 What You'll Unlock with Premium:</h3>
            <div class="feature-grid">
              <div class="feature">
                <h4>✨ Unlimited CV Analysis</h4>
                <p>Analyze as many resumes as you need with detailed AI feedback</p>
              </div>
              <div class="feature">
                <h4>🤖 AI Cover Letter Generator</h4>
                <p>Create personalized cover letters in seconds</p>
              </div>
              <div class="feature">
                <h4>📊 Advanced Analytics</h4>
                <p>Track your application success rate and optimize your strategy</p>
              </div>
              <div class="feature">
                <h4>⚡ Priority Support</h4>
                <p>Get faster responses from our career experts</p>
              </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{upgradeUrl}}" class="button">Claim Your 50% Discount</a>
            </div>
            
            <p style="text-align: center; font-size: 14px; color: #666;">
              No risk - 7-day free trial included • Cancel anytime
            </p>
            
            <p>Don't miss this opportunity to accelerate your career growth!</p>
            <p>Best regards,<br>The HireAll Team</p>
          </div>
        </div>
      </body>
      </html>
    `,
    textContent: `
      🔥 Exclusive Offer for {{firstName}}!
      
      Upgrade to Premium and Transform Your Career
      
      LIMITED TIME: 50% OFF Premium Annual Plan
      Normally $5.99/month - Now just $2.99/month!
      
      This special discount expires in {{offerExpiry}} hours
      
      What You'll Unlock with Premium:
      ✨ Unlimited CV Analysis - Analyze as many resumes as you need
      🤖 AI Cover Letter Generator - Create personalized cover letters
      📊 Advanced Analytics - Track your application success rate
      ⚡ Priority Support - Get faster responses from career experts
      
      Claim your discount now: {{upgradeUrl}}
      
      No risk - 7-day free trial included • Cancel anytime
      
      Best regards,
      The HireAll Team
    `,
    variables: ['firstName', 'upgradeUrl', 'offerExpiry'],
    preview: 'Limited-time premium upgrade offer with 50% discount',
    tags: ['premium', 'upgrade', 'promotion', 'limited-time'],
    active: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];
