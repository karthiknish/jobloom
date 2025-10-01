// Test script for email marketing functionality
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000/api/admin';

async function testEmailMarketing() {
  console.log('🧪 Testing Email Marketing APIs...\n');

  try {
    // Test 1: Get email templates
    console.log('1. Testing GET /email-templates...');
    const templatesResponse = await fetch(`${BASE_URL}/email-templates`);
    const templates = await templatesResponse.json();
    console.log('✅ Templates API works:', templates.length, 'templates found');

    // Test 2: Create a test template
    console.log('\n2. Testing POST /email-templates...');
    const newTemplate = {
      name: 'Test Template',
      subject: 'Test Subject {{firstName}}',
      htmlContent: '<h1>Hello {{firstName}}</h1><p>This is a test email.</p>',
      textContent: 'Hello {{firstName}}, This is a test email.',
      category: 'marketing',
      tags: ['test'],
      preview: 'Test template preview'
    };

    const createResponse = await fetch(`${BASE_URL}/email-templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTemplate)
    });
    
    if (createResponse.ok) {
      const createdTemplate = await createResponse.json();
      console.log('✅ Template creation works:', createdTemplate.id);
      const templateId = createdTemplate.id;

      // Test 3: Get campaigns
      console.log('\n3. Testing GET /email-campaigns...');
      const campaignsResponse = await fetch(`${BASE_URL}/email-campaigns`);
      const campaigns = await campaignsResponse.json();
      console.log('✅ Campaigns API works:', campaigns.length, 'campaigns found');

      // Test 4: Create a test campaign
      console.log('\n4. Testing POST /email-campaigns...');
      const newCampaign = {
        name: 'Test Campaign',
        templateId: templateId,
        subject: 'Test Campaign Subject',
        fromEmail: 'test@hireall.app',
        fromName: 'HireAll Test',
        scheduledFor: null,
        recipientSelection: 'all',
        customRecipients: [],
        status: 'draft'
      };

      const createCampaignResponse = await fetch(`${BASE_URL}/email-campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCampaign)
      });

      if (createCampaignResponse.ok) {
        const createdCampaign = await createCampaignResponse.json();
        console.log('✅ Campaign creation works:', createdCampaign.id);
        
        // Clean up - delete test template
        console.log('\n5. Cleaning up test data...');
        await fetch(`${BASE_URL}/email-templates/${templateId}`, {
          method: 'DELETE'
        });
        console.log('✅ Test template deleted');
      } else {
        console.log('❌ Campaign creation failed');
      }
    } else {
      console.log('❌ Template creation failed:', await createResponse.text());
    }

    console.log('\n🎉 Email marketing API tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests
testEmailMarketing();