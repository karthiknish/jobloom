// Test Resend integration directly
const { sendEmail } = require('./src/lib/resend');

async function testResend() {
  console.log('🧪 Testing Resend email integration...\n');
  
  try {
    const result = await sendEmail({
      to: 'test@example.com', // Replace with actual email for testing
      subject: '🎉 HireAll Resend Integration Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">✅ Resend Integration Successful!</h2>
          <p>This is a test email from the HireAll Email Marketing System using Resend.</p>
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
            <h3 style="color: #1e40af; margin-top: 0;">Integration Features:</h3>
            <ul style="color: #374151;">
              <li>✅ Resend API Connection</li>
              <li>✅ Email Sending</li>
              <li>✅ HTML Content Support</li>
              <li>✅ Personalization Ready</li>
              <li>✅ Bulk Email Support</li>
            </ul>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            If you received this email, Resend integration is working correctly!
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #9ca3af; font-size: 12px;">
            This is an automated test email from HireAll Email Marketing System.
          </p>
        </div>
      `,
      text: `
        Resend Integration Successful!
        
        This is a test email from the HireAll Email Marketing System using Resend.
        
        Integration Features:
        - Resend API Connection
        - Email Sending
        - HTML Content Support
        - Personalization Ready
        - Bulk Email Support
        
        If you received this email, Resend integration is working correctly!
        
        This is an automated test email from HireAll Email Marketing System.
      `
    });

    if (result.success) {
      console.log('✅ Email sent successfully!');
      console.log('Message ID:', result.messageId);
      console.log('From:', process.env.RESEND_FROM_EMAIL || 'noreply@hireall.app');
    } else {
      console.error('❌ Email sending failed:', result.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

// Check if Resend credentials are available
if (!process.env.RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY not found in environment variables');
  process.exit(1);
}

console.log('✅ RESEND_API_KEY found');
console.log('✅ From email:', process.env.RESEND_FROM_EMAIL || 'noreply@hireall.app');

testResend();