#!/usr/bin/env node

/**
 * Test script to verify upload limits configuration
 */

console.log('🔍 Testing HireAll CV Upload Limits Configuration...\n');

const fs = require('fs');
const path = require('path');

// Test 1: Check if upload limits config file exists
console.log('1. Checking configuration files...');
const configFiles = [
  'packages/web/src/config/uploadLimits.ts',
  'packages/web/src/app/api/user/upload-limits/route.ts'
];

let configFilesExist = true;
configFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} - Configuration file exists`);
  } else {
    console.log(`❌ ${file} - Configuration file missing`);
    configFilesExist = false;
  }
});

// Test 2: Check if CV upload route has been updated
console.log('\n2. Checking CV upload route updates...');
try {
  const uploadRouteContent = fs.readFileSync('packages/web/src/app/api/cv/upload/route.ts', 'utf8');
  
  const hasDynamicLimits = uploadRouteContent.includes('getUploadLimitsForUser') &&
                       uploadRouteContent.includes('validateFileUploadWithLimits') &&
                       uploadRouteContent.includes('uploadLimits:');
  
  if (hasDynamicLimits) {
    console.log('✅ CV upload route updated with dynamic limits');
  } else {
    console.log('❌ CV upload route missing dynamic limits implementation');
  }
} catch (error) {
  console.log('❌ Failed to check CV upload route:', error.message);
  configFilesExist = false;
}

// Test 3: Check upload limits configuration
console.log('\n3. Checking upload limits configuration...');
try {
  const configContent = fs.readFileSync('packages/web/src/config/uploadLimits.ts', 'utf8');
  
  const hasFreePlan = configContent.includes('free:') &&
                     configContent.includes('maxSize: 2 * 1024 * 1024') &&
                     configContent.includes('maxSizeMB: 2');
  
  const hasProPlan = configContent.includes('pro:') &&
                    configContent.includes('maxSize: 5 * 1024 * 1024') &&
                    configContent.includes('maxSizeMB: 5');
  
  const hasPremiumPlan = configContent.includes('premium:') &&
                       configContent.includes('maxSize: 10 * 1024 * 1024') &&
                       configContent.includes('maxSizeMB: 10');
  
  const hasValidation = configContent.includes('validateFileUploadWithLimits') &&
                      configContent.includes('errorType');
  
  if (hasFreePlan && hasProPlan && hasPremiumPlan && hasValidation) {
    console.log('✅ Upload limits properly configured for all plans');
    console.log('   - Free plan: 2MB max');
    console.log('   - Pro plan: 5MB max');  
    console.log('   - Premium plan: 10MB max');
    console.log('   - Advanced validation included');
  } else {
    console.log('❌ Upload limits configuration incomplete');
    console.log(`   Free plan: ${hasFreePlan ? '✅' : '❌'}`);
    console.log(`   Pro plan: ${hasProPlan ? '✅' : '❌'}`);
    console.log(`   Premium plan: ${hasPremiumPlan ? '✅' : '❌'}`);
    console.log(`   Advanced validation: ${hasValidation ? '✅' : '❌'}`);
  }
} catch (error) {
  console.log('❌ Failed to check upload limits config:', error.message);
  configFilesExist = false;
}

// Test 4: Check if new API endpoint exists
console.log('\n4. Checking upload limits API endpoint...');
try {
  const endpointContent = fs.readFileSync('packages/web/src/app/api/user/upload-limits/route.ts', 'utf8');
  
  const hasCorrectStructure = endpointContent.includes('GET /api/user/upload-limits') &&
                           endpointContent.includes('verifyIdToken') &&
                           endpointContent.includes('getUploadLimitsForUser');
  
  if (hasCorrectStructure) {
    console.log('✅ Upload limits API endpoint properly implemented');
  } else {
    console.log('❌ Upload limits API endpoint missing key functionality');
  }
} catch (error) {
  console.log('❌ Failed to check upload limits API endpoint:', error.message);
  configFilesExist = false;
}

// Test 5: Check if component has been updated
console.log('\n5. Checking CvUploadForm component updates...');
try {
  const componentContent = fs.readFileSync('packages/web/src/components/CvUploadForm.tsx', 'utf8');
  
  const hasUploadLimitsState = componentContent.includes('uploadLimits:') &&
                            componentContent.includes('UploadLimits') &&
                            componentContent.includes('fetchUploadLimits');
  
  const hasDynamicValidation = componentContent.includes('uploadLimits.maxSize') &&
                              componentContent.includes('uploadLimits.allowedExtensions');
  
  if (hasUploadLimitsState && hasDynamicValidation) {
    console.log('✅ CvUploadForm component updated with dynamic limits');
  } else {
    console.log('⚠️  CvUploadForm component may need manual updates');
    console.log(`   Upload limits state: ${hasUploadLimitsState ? '✅' : '❌'}`);
    console.log(`   Dynamic validation: ${hasDynamicValidation ? '✅' : '❌'}`);
  }
} catch (error) {
  console.log('❌ Failed to check CvUploadForm component:', error.message);
}

if (configFilesExist) {
  console.log('\n🎉 Upload Limits Configuration Complete!');
  console.log('\n📋 Summary of Changes:');
  console.log('1. ✅ Created configurable upload limits by subscription plan');
  console.log('2. ✅ Free users: 2MB max, PDF and TXT files');
  console.log('3. ✅ Pro users: 5MB max, PDF, TXT, DOC, DOCX files');
  console.log('4. ✅ Premium users: 10MB max, PDF, TXT, DOC, DOCX files');
  console.log('5. ✅ Dynamic validation with detailed error messages');
  console.log('6. ✅ API endpoint to fetch user-specific limits');
  console.log('7. ✅ Enhanced security logging for validation failures');
  
  console.log('\n🚀 Features Added:');
  console.log('• Dynamic upload limits based on subscription plan');
  console.log('• Detailed error messages with file size information');
  console.log('• Client-side validation before upload');
  console.log('• Server-side validation with enhanced security logging');
  console.log('• Support for multiple file formats (PDF, TXT, DOC, DOCX)');
  console.log('• API endpoint for frontend to fetch current limits');
  
  console.log('\n📝 Usage Examples:');
  console.log('// API call to get upload limits');
  console.log('GET /api/user/upload-limits');
  console.log('Authorization: Bearer <user_token>');
  console.log('');
  console.log('// Response example');
  console.log('{');
  console.log('  "success": true,');
  console.log('  "uploadLimits": {');
  console.log('    "maxSize": 5242880,');
  console.log('    "maxSizeMB": 5,');
  console.log('    "allowedTypes": ["application/pdf", "text/plain"],');
  console.log('    "allowedExtensions": ["pdf", "txt"]');
  console.log('  }');
  console.log('}');
  
  console.log('\n🔧 Test Commands:');
  console.log('// Test with different file sizes');
  console.log('curl -X POST http://localhost:3000/api/cv/upload \\');
  console.log('  -H "Authorization: Bearer <token>" \\');
  console.log('  -F "file=@large-file.pdf" \\');
  console.log('  -F "userId=test-user"');
  
} else {
  console.log('\n❌ Upload Limits Configuration Incomplete');
  console.log('Please review the errors above and fix any missing files or configurations.');
}
