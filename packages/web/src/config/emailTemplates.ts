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
          .header { text-align: center; padding: 30px 0; background: linear-gradient(135deg, #059669 0%, #0d9488 100%); color: white; border-radius: 10px 10px 0 0; }
          .content { padding: 30px; background: #f9fafb; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 24px; background: #059669; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .feature { margin: 20px 0; padding: 15px; background: white; border-radius: 6px; border-left: 4px solid #059669; }
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
  },
  {
    id: 'uk-sponsorship-guide',
    name: 'UK Sponsorship Guide',
    description: 'Comprehensive guide for UK visa sponsorship requirements and opportunities',
    category: 'marketing',
    subject: '🇬🇧 Your Complete Guide to UK Sponsorship Opportunities',
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>UK Sponsorship Guide</title>
        <style>
          body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 30px 0; background: linear-gradient(135deg, #059669 0%, #0d9488 100%); color: white; border-radius: 10px 10px 0 0; }
          .content { padding: 30px; background: #f9fafb; border-radius: 0 0 10px 10px; }
          .uk-flag { font-size: 48px; margin-bottom: 20px; }
          .guide-section { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669; }
          .visa-list { list-style: none; padding: 0; }
          .visa-list li { background: #ecfdf5; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 3px solid #10b981; }
          .stats { display: flex; justify-content: space-around; background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .stat { text-align: center; }
          .stat-number { font-size: 24px; font-weight: bold; color: #059669; }
          .button { display: inline-block; padding: 12px 24px; background: #059669; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; }
          .tip { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; border-radius: 6px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="uk-flag">🇬🇧</div>
            <h1>Your UK Sponsorship Guide</h1>
            <p>Everything you need to know about working in the UK</p>
          </div>
          <div class="content">
            <p>Hi {{firstName}},</p>
            <p>Navigating the UK sponsorship landscape can be complex, but we're here to make it simple. Here's your comprehensive guide:</p>
            
            <div class="stats">
              <div class="stat">
                <div class="stat-number">{{sponsorshipJobsCount}}</div>
                <div>Sponsorship Jobs Available</div>
              </div>
              <div class="stat">
                <div class="stat-number">{{licensedCompaniesCount}}</div>
                <div>Licensed Companies</div>
              </div>
              <div class="stat">
                <div class="stat-number">{{successRate}}%</div>
                <div>Success Rate</div>
              </div>
            </div>
            
            <div class="guide-section">
              <h3>📋 UK Visa Types for Work</h3>
              <ul class="visa-list">
                <li><strong>Skilled Worker Visa:</strong> For qualified professionals with a job offer from a licensed sponsor</li>
                <li><strong>Global Talent Visa:</strong> For leaders in digital technology, arts, or science</li>
                <li><strong>Health and Care Visa:</strong> For medical professionals working in the NHS</li>
                <li><strong>Graduate Route Visa:</strong> For international students after completing their degree</li>
              </ul>
            </div>
            
            <div class="guide-section">
              <h3>🎯 Top Sponsorship Industries</h3>
              <p><strong>{{topIndustry1}}:</strong> {{industry1JobsCount}}+ opportunities</p>
              <p><strong>{{topIndustry2}}:</strong> {{industry2JobsCount}}+ opportunities</p>
              <p><strong>{{topIndustry3}}:</strong> {{industry3JobsCount}}+ opportunities</p>
            </div>
            
            <div class="tip">
              <strong>💡 Pro Tip:</strong> {{sponsorshipTip}}
            </div>
            
            <div class="guide-section">
              <h3>📈 Your Sponsorship Readiness Score</h3>
              <p>Based on your profile, you have a <strong>{{readinessScore}}%</strong> chance of securing sponsorship!</p>
              <p><strong>Areas to improve:</strong> {{improvementAreas}}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{sponsorshipUrl}}" class="button">Explore Sponsorship Opportunities</a>
            </div>
            
            <p>Ready to start your UK career journey? We're here to help every step of the way!</p>
            <p>Best regards,<br>The HireAll Team</p>
          </div>
        </div>
      </body>
      </html>
    `,
    textContent: `
      🇬🇧 Your UK Sponsorship Guide
      
      Hi {{firstName}},
      
      Navigating the UK sponsorship landscape can be complex, but we're here to make it simple.
      
      Current Stats:
      • {{sponsorshipJobsCount}} sponsorship jobs available
      • {{licensedCompaniesCount}} licensed companies
      • {{successRate}}% success rate
      
      UK Visa Types for Work:
      • Skilled Worker Visa - For qualified professionals
      • Global Talent Visa - For leaders in tech/arts/science
      • Health and Care Visa - For medical professionals
      • Graduate Route Visa - For international students
      
      Top Sponsorship Industries:
      • {{topIndustry1}}: {{industry1JobsCount}}+ opportunities
      • {{topIndustry2}}: {{industry2JobsCount}}+ opportunities
      • {{topIndustry3}}: {{industry3JobsCount}}+ opportunities
      
      Your Sponsorship Readiness Score: {{readinessScore}}%
      
      Explore opportunities: {{sponsorshipUrl}}
      
      Best regards,
      The HireAll Team
    `,
    variables: ['firstName', 'sponsorshipJobsCount', 'licensedCompaniesCount', 'successRate', 'topIndustry1', 'industry1JobsCount', 'topIndustry2', 'industry2JobsCount', 'topIndustry3', 'industry3JobsCount', 'sponsorshipTip', 'readinessScore', 'improvementAreas', 'sponsorshipUrl'],
    preview: 'Comprehensive UK sponsorship guide with personalized insights',
    tags: ['uk', 'sponsorship', 'visa', 'guide', 'international'],
    active: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'application-success-story',
    name: 'Application Success Story',
    description: 'Share success stories and testimonials to encourage engagement',
    category: 'marketing',
    subject: '🎉 How {{candidateName}} Landed Their Dream Job in the UK',
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Success Story</title>
        <style>
          body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 30px 0; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border-radius: 10px 10px 0 0; }
          .content { padding: 30px; background: #f9fafb; border-radius: 0 0 10px 10px; }
          .testimonial { background: white; padding: 30px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #10b981; }
          .quote { font-size: 18px; font-style: italic; color: #059669; margin: 20px 0; }
          .candidate-info { display: flex; align-items: center; margin: 20px 0; }
          .avatar { width: 60px; height: 60px; border-radius: 50%; background: #e5e7eb; margin-right: 15px; }
          .journey { background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .stats { display: flex; justify-content: space-around; background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .stat { text-align: center; }
          .stat-number { font-size: 24px; font-weight: bold; color: #10b981; }
          .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; }
          .company-logo { width: 100px; height: 40px; background: #e5e7eb; border-radius: 4px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Success Story Spotlight</h1>
            <p>Real results from real users</p>
          </div>
          <div class="content">
            <p>Hi {{firstName}},</p>
            <p>We love celebrating our users' successes! Today, we're excited to share {{candidateName}}'s journey:</p>
            
            <div class="testimonial">
              <div class="candidate-info">
                <div class="avatar">{{candidateInitials}}</div>
                <div>
                  <h3>{{candidateName}}</h3>
                  <p>{{candidateRole}} at {{candidateCompany}}</p>
                  <div class="company-logo">{{candidateCompany}}</div>
                </div>
              </div>
              
              <div class="quote">
                "{{testimonialQuote}}"
              </div>
              
              <div class="journey">
                <h4>🚀 The Journey</h4>
                <p><strong>Challenge:</strong> {{challenge}}</p>
                <p><strong>Solution:</strong> {{solution}}</p>
                <p><strong>Result:</strong> {{result}}</p>
              </div>
            </div>
            
            <div class="stats">
              <div class="stat">
                <div class="stat-number">{{applicationsSent}}</div>
                <div>Applications Sent</div>
              </div>
              <div class="stat">
                <div class="stat-number">{{interviewsLanded}}</div>
                <div>Interviews Landed</div>
              </div>
              <div class="stat">
                <div class="stat-number">{{timeToHire}} weeks</div>
                <div>Time to Hire</div>
              </div>
            </div>
            
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h4>💡 {{candidateName}}'s Top Tips</h4>
              <ul>
                {{#each tips}}
                <li>{{this}}</li>
                {{/each}}
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{dashboardUrl}}" class="button">Start Your Success Story</a>
            </div>
            
            <p>Your dream job is waiting. Let us help you get there!</p>
            <p>Best regards,<br>The HireAll Team</p>
          </div>
        </div>
      </body>
      </html>
    `,
    textContent: `
      🎉 Success Story: {{candidateName}}'s Journey to {{candidateCompany}}
      
      Hi {{firstName}},
      
      We're excited to share {{candidateName}}'s success story!
      
      "{{testimonialQuote}}"
      
      The Journey:
      Challenge: {{challenge}}
      Solution: {{solution}}
      Result: {{result}}
      
      Stats:
      • {{applicationsSent}} applications sent
      • {{interviewsLanded}} interviews landed  
      • {{timeToHire}} weeks to hire
      
      {{candidateName}}'s Top Tips:
      {{#each tips}}
      • {{this}}
      {{/each}}
      
      Start your journey: {{dashboardUrl}}
      
      Best regards,
      The HireAll Team
    `,
    variables: ['firstName', 'candidateName', 'candidateRole', 'candidateCompany', 'candidateInitials', 'testimonialQuote', 'challenge', 'solution', 'result', 'applicationsSent', 'interviewsLanded', 'timeToHire', 'tips', 'dashboardUrl'],
    preview: 'Success story testimonial to inspire and motivate users',
    tags: ['success-story', 'testimonial', 'motivation', 'case-study'],
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
          .header { text-align: center; padding: 30px 0; background: linear-gradient(135deg, #059669 0%, #0d9488 100%); color: white; border-radius: 10px 10px 0 0; }
          .content { padding: 30px; background: #f9fafb; border-radius: 0 0 10px 10px; }
          .job-card { margin: 20px 0; padding: 20px; background: white; border-radius: 8px; border: 1px solid #e5e7eb; }
          .job-title { font-size: 18px; font-weight: bold; color: #1f2937; margin-bottom: 8px; }
          .company { color: #6b7280; margin-bottom: 8px; }
          .location { color: #6b7280; font-size: 14px; margin-bottom: 12px; }
          .skills { display: flex; flex-wrap: wrap; gap: 6px; margin: 12px 0; }
          .skill { background: #ecfdf5; color: #059669; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
          .button { display: inline-block; padding: 10px 20px; background: #059669; color: white; text-decoration: none; border-radius: 6px; }
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
          .header { text-align: center; padding: 30px 0; background: linear-gradient(135deg, #059669 0%, #0d9488 100%); color: white; border-radius: 10px 10px 0 0; }
          .content { padding: 30px; background: #f9fafb; border-radius: 0 0 10px 10px; }
          .offer { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
          .stats { display: flex; justify-content: space-around; margin: 20px 0; }
          .stat { text-align: center; padding: 15px; background: white; border-radius: 6px; flex: 1; margin: 0 5px; }
          .button { display: inline-block; padding: 12px 24px; background: #059669; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>We Miss You! 💚</h1>
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