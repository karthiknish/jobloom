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

export const defaultEmailTemplates: EmailTemplate[] = [
  {
    id: 'welcome-newsletter',
    name: 'Welcome Newsletter',
    description: 'Welcome email for new subscribers with platform introduction',
    category: 'onboarding',
    subject: 'Welcome to HireAll - Your Career Journey Starts Here! 🚀',
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
          .header { text-align: center; padding: 30px 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 10px 10px 0 0; }
          .content { padding: 30px; background: #f9fafb; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .feature { margin: 20px 0; padding: 15px; background: white; border-radius: 6px; border-left: 4px solid #667eea; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to HireAll! 👋</h1>
            <p>Your career transformation platform</p>
          </div>
          <div class="content">
            <p>Hi {{firstName}},</p>
            <p>We're thrilled to have you join our community of professionals who are taking their careers to the next level!</p>
            
            <div class="feature">
              <h3>🎯 Build Your Professional Portfolio</h3>
              <p>Create stunning portfolios that showcase your skills and experience to potential employers.</p>
            </div>
            
            <div class="feature">
              <h3>📋 AI-Powered Resume Builder</h3>
              <p>Let our AI help you craft the perfect resume that gets past ATS systems and impresses recruiters.</p>
            </div>
            
            <div class="feature">
              <h3>💼 Job Discovery Platform</h3>
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
      • Build stunning professional portfolios
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
  },
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
          .header { text-align: center; padding: 30px 0; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; border-radius: 10px 10px 0 0; }
          .content { padding: 30px; background: #f9fafb; border-radius: 0 0 10px 10px; }
          .article { margin: 20px 0; padding: 20px; background: white; border-radius: 6px; border-left: 4px solid #f093fb; }
          .stats { display: flex; justify-content: space-around; margin: 20px 0; }
          .stat { text-align: center; padding: 15px; background: white; border-radius: 6px; flex: 1; margin: 0 5px; }
          .button { display: inline-block; padding: 12px 24px; background: #f093fb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
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
  },
  {
    id: 'job-alert',
    name: 'New Job Alert',
    description: 'Personalized job recommendations based on user profile and preferences',
    category: 'marketing',
    subject: 'New Job Opportunities Matching Your Profile 💼',
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Job Opportunities</title>
        <style>
          body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 30px 0; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; border-radius: 10px 10px 0 0; }
          .content { padding: 30px; background: #f9fafb; border-radius: 0 0 10px 10px; }
          .job-card { margin: 20px 0; padding: 20px; background: white; border-radius: 8px; border: 1px solid #e5e7eb; }
          .job-title { font-size: 18px; font-weight: bold; color: #1f2937; margin-bottom: 8px; }
          .company { color: #6b7280; margin-bottom: 8px; }
          .location { color: #6b7280; font-size: 14px; margin-bottom: 12px; }
          .skills { display: flex; flex-wrap: wrap; gap: 6px; margin: 12px 0; }
          .skill { background: #e0f2fe; color: #0369a1; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
          .button { display: inline-block; padding: 10px 20px; background: #4facfe; color: white; text-decoration: none; border-radius: 6px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Job Matches! 🎯</h1>
            <p>We found {{jobCount}} opportunities perfect for you</p>
          </div>
          <div class="content">
            <p>Hi {{firstName}},</p>
            <p>Great news! We found new job opportunities that match your skills and preferences. Here are the top matches:</p>
            
            {{#each jobs}}
            <div class="job-card">
              <div class="job-title">{{title}}</div>
              <div class="company">{{company}}</div>
              <div class="location">📍 {{location}} • {{type}} • {{salary}}</div>
              <div class="skills">
                {{#each skills}}
                <span class="skill">{{this}}</span>
                {{/each}}
              </div>
              <p>{{description}}</p>
              <a href="{{applyUrl}}" class="button">Apply Now</a>
            </div>
            {{/each}}
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="{{dashboardUrl}}" class="button">View All Jobs</a>
            </div>
            
            <p>These opportunities are getting attention quickly. Don't wait to apply!</p>
            <p>Good luck with your job search!</p>
            <p>Best regards,<br>The HireAll Team</p>
          </div>
        </div>
      </body>
      </html>
    `,
    textContent: `
      New Job Opportunities Matching Your Profile
      
      Hi {{firstName}},
      
      Great news! We found {{jobCount}} new job opportunities that match your skills and preferences.
      
      Top Matches:
      {{#each jobs}}
      • {{title}} at {{company}}
        Location: {{location}}
        Type: {{type}}
        Salary: {{salary}}
        Skills: {{join skills ", "}}
        {{description}}
        Apply: {{applyUrl}}
      
      {{/each}}
      
      View all opportunities: {{dashboardUrl}}
      
      These jobs are getting attention quickly - apply now!
      
      Best regards,
      The HireAll Team
    `,
    variables: ['firstName', 'jobCount', 'jobs', 'dashboardUrl'],
    preview: 'Personalized job recommendations based on user profile',
    tags: ['jobs', 'recommendations', 'alerts', 'personalized'],
    active: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
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
          .header { text-align: center; padding: 30px 0; background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; border-radius: 10px 10px 0 0; }
          .content { padding: 30px; background: #f9fafb; border-radius: 0 0 10px 10px; }
          .feature { margin: 25px 0; padding: 25px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .feature-title { font-size: 20px; font-weight: bold; color: #1f2937; margin-bottom: 10px; }
          .feature-icon { font-size: 24px; margin-bottom: 10px; }
          .button { display: inline-block; padding: 12px 24px; background: #fa709a; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
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
  },
  {
    id: 're-engagement',
    name: 'User Re-engagement Campaign',
    description: 'Re-engage inactive users with personalized content and incentives',
    category: 'marketing',
    subject: 'We Miss You! Here\'s What\'s New on HireAll 👋',
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>We Miss You!</title>
        <style>
          body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 30px 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 10px 10px 0 0; }
          .content { padding: 30px; background: #f9fafb; border-radius: 0 0 10px 10px; }
          .offer { background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%); padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
          .stats { display: flex; justify-content: space-around; margin: 20px 0; }
          .stat { text-align: center; padding: 15px; background: white; border-radius: 6px; flex: 1; margin: 0 5px; }
          .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>We Miss You! 💜</h1>
            <p>It's been {{daysSinceLastLogin}} days since your last visit</p>
          </div>
          <div class="content">
            <p>Hi {{firstName}},</p>
            <p>We noticed you haven't been around lately, and we wanted to let you know about the exciting things happening on HireAll!</p>
            
            <div class="offer">
              <h3>🎁 Welcome Back Offer!</h3>
              <p>Get {{offerDiscount}} off premium features for the next {{offerDuration}} days</p>
              <a href="{{offerUrl}}" class="button">Claim Your Offer</a>
            </div>
            
            <div class="stats">
              <div class="stat">
                <h3>{{newJobsCount}}</h3>
                <p>New Jobs Since You Left</p>
              </div>
              <div class="stat">
                <h3>{{newFeaturesCount}}</h3>
                <p>New Features Added</p>
              </div>
              <div class="stat">
                <h3>{{successRate}}%</h3>
                <p>Success Rate This Month</p>
              </div>
            </div>
            
            <h3>What's New Since Your Last Visit:</h3>
            <ul>
              <li>{{newFeature1}}</li>
              <li>{{newFeature2}}</li>
              <li>{{newFeature3}}</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="{{dashboardUrl}}" class="button">Come Back & Explore</a>
            </div>
            
            <p>Your career journey doesn't pause, and neither should your opportunities. We're here to help you every step of the way!</p>
            <p>Best regards,<br>The HireAll Team</p>
          </div>
        </div>
      </body>
      </html>
    `,
    textContent: `
      We Miss You! Here's What's New on HireAll
      
      Hi {{firstName}},
      
      It's been {{daysSinceLastLogin}} days since your last visit, and we wanted to share what's new!
      
      🎁 Welcome Back Offer!
      Get {{offerDiscount}} off premium features for {{offerDuration}} days
      Claim now: {{offerUrl}}
      
      What's New:
      • {{newJobsCount}} new jobs posted
      • {{newFeaturesCount}} new features added
      • {{successRate}}% success rate this month
      
      Latest Updates:
      • {{newFeature1}}
      • {{newFeature2}}
      • {{newFeature3}}
      
      Come back: {{dashboardUrl}}
      
      Your career journey continues - we're here to help!
      
      Best regards,
      The HireAll Team
    `,
    variables: ['firstName', 'daysSinceLastLogin', 'offerDiscount', 'offerDuration', 'offerUrl', 'newJobsCount', 'newFeaturesCount', 'successRate', 'newFeature1', 'newFeature2', 'newFeature3', 'dashboardUrl'],
    preview: 'Re-engage inactive users with personalized content and special offers',
    tags: ['re-engagement', 'inactive', 'welcome-back', 'offer'],
    active: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];

export function getEmailTemplate(id: string): EmailTemplate | undefined {
  return defaultEmailTemplates.find(t => t.id === id);
}

export function getTemplatesByCategory(category: EmailTemplate['category']): EmailTemplate[] {
  return defaultEmailTemplates.filter(t => t.category === category);
}

export function getActiveTemplates(): EmailTemplate[] {
  return defaultEmailTemplates.filter(t => t.active);
}

export function getTemplatesByTag(tag: string): EmailTemplate[] {
  return defaultEmailTemplates.filter(t => t.tags.includes(tag));
}