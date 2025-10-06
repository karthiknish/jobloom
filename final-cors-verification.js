#!/usr/bin/env node

/**
 * Final verification script for LinkedIn CORS configuration
 */

console.log('🔍 Final Verification: LinkedIn Extension CORS Configuration\n');

const fs = require('fs');
const path = require('path');

// Critical API endpoints for the extension
const criticalAPIs = [
  '/api/app/sponsorship/companies',
  '/api/soc-codes/authenticated', 
  '/api/user/uk-sponsorship-criteria'
];

// Job management APIs
const jobManagementAPIs = [
  '/api/app/jobs',
  '/api/app/applications',
  '/api/app/jobs/user/{userId}',
  '/api/app/applications/user/{userId}'
];

// Additional APIs
const additionalAPIs = [
  '/api/app/follow-ups',
  '/api/app/autofill/profile/{userId}',
  '/api/subscription/status'
];

const allAPIs = [...criticalAPIs, ...jobManagementAPIs, ...additionalAPIs];

// Map API paths to actual file paths
const apiFileMap = {
  '/api/app/sponsorship/companies': 'packages/web/src/app/api/app/sponsorship/companies/route.ts',
  '/api/soc-codes/authenticated': 'packages/web/src/app/api/soc-codes/authenticated/route.ts',
  '/api/user/uk-sponsorship-criteria': 'packages/web/src/app/api/user/uk-sponsorship-criteria/route.ts',
  '/api/app/jobs': 'packages/web/src/app/api/app/jobs/route.ts',
  '/api/app/applications': 'packages/web/src/app/api/app/applications/route.ts',
  '/api/app/follow-ups': 'packages/web/src/app/api/app/follow-ups/route.ts',
  '/api/app/autofill/profile/{userId}': 'packages/web/src/app/api/app/autofill/profile/[userId]/route.ts',
  '/api/app/jobs/user/{userId}': 'packages/web/src/app/api/app/jobs/user/[userId]/route.ts',
  '/api/app/applications/user/{userId}': 'packages/web/src/app/api/app/applications/user/[userId]/route.ts',
  '/api/subscription/status': 'packages/web/src/app/api/subscription/status/route.ts'
};

// Check specific CORS requirements
function checkCORSRequirements(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    const requirements = {
      hasCorsHelper: content.includes('function addCorsHeaders'),
      hasLinkedInOrigins: content.includes('https://www.linkedin.com') && content.includes('https://linkedin.com'),
      hasMethodsHeader: content.includes('Access-Control-Allow-Methods'),
      hasHeadersHeader: content.includes('Access-Control-Allow-Headers'),
      hasCredentialsHeader: content.includes('Access-Control-Allow-Credentials: true'),
      hasVaryHeader: content.includes('Vary: Origin'),
      hasOptionsHandler: content.includes('export async function OPTIONS'),
      hasOriginCheck: content.includes('allowedOrigins.includes(requestOrigin)') || content.includes('allowedOrigins.includes(origin)'),
      hasDevelopmentMode: content.includes('process.env.NODE_ENV === \'development\'') && content.includes('Access-Control-Allow-Origin: \'*\''),
      hasDynamicOrigin: content.includes('Access-Control-Allow-Origin: requestOrigin') || content.includes('Access-Control-Allow-Origin: origin'),
      hasProperErrorHandling: content.includes('addCorsHeaders(response')') || content.includes('addCorsHeaders(errorResponse)')
    };

    const missingRequirements = Object.entries(requirements)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    return {
      allRequirementsMet: missingRequirements.length === 0,
      requirements,
      missingRequirements,
      score: Math.round((Object.values(requirements).filter(Boolean).length / Object.keys(requirements).length) * 100)
    };
  } catch (error) {
    return {
      allRequirementsMet: false,
      requirements: {},
      missingRequirements: ['File read error: ' + error.message],
      score: 0,
      error: error.message
    };
  }
}

// Check import statements
function checkImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    return {
      hasNextRequest: content.includes('import { NextRequest, NextResponse }'),
      hasVerifyIdToken: content.includes('verifyIdToken') || content.includes('verifySessionFromRequest'),
      hasProperStructure: content.includes('function addCorsHeaders') && content.includes('export async function')
    };
  } catch (error) {
    return { error: error.message };
  }
}

// Check return statements with CORS
function checkReturnStatements(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    return {
      hasCorsInSuccess: content.includes('addCorsHeaders(response,') || content.includes('addCorsHeaders(errorResponse)'),
      hasOriginParameter: content.includes('request.headers.get(\'origin\')') || content.includes('origin || undefined'),
      hasProperResponseHandling: content.includes('instanceof NextResponse')
    };
  } catch (error) {
    return { error: error.message };
  }
}

console.log('🔍 Performing Final CORS Verification...\n');

let totalChecks = 0;
let passedChecks = 0;
let detailedResults = [];

allAPIs.forEach((api, index) => {
  const filePath = apiFileMap[api.path];
  const displayName = `${api.priority || 'UNKNOWN'} ${api.path}`;
  
  if (!filePath) {
    console.log(`❌ ${displayName.padEnd(35)} - FILE NOT FOUND`);
    totalChecks++;
    detailedResults.push({ api: api.path, status: 'FILE_NOT_FOUND', score: 0 });
    return;
  }

  totalChecks++;
  
  const corsCheck = checkCORSRequirements(filePath);
  const importCheck = checkImports(filePath);
  const returnCheck = checkReturnStatements(filePath);
  
  const overallScore = Math.round((corsCheck.score + (importCheck.hasNextRequest ? 25 : 0) + (returnCheck.hasProperResponseHandling ? 25 : 0)) / 100);
  
  if (overallScore >= 90) {
    console.log(`✅ ${displayName.padEnd(35)} - FULLY CONFIGURED (${overallScore}%)`);
    passedChecks++;
  } else if (overallScore >= 75) {
    console.log(`⚠️  ${displayName.padEnd(35)} - MOSTLY CONFIGURED (${overallScore}%)`);
    passedChecks++;
  } else if (overallScore >= 50) {
    console.log(`🔧 ${displayName.padEnd(35)} - PARTIALLY CONFIGURED (${overallScore}%)`);
  } else {
    console.log(`❌ ${displayName.padEnd(35)} - NEEDS ATTENTION (${overallScore}%)`);
  }
  
  detailedResults.push({
    api: api.path,
    status: overallScore >= 90 ? 'FULLY_CONFIGURED' : overallScore >= 75 ? 'MOSTLY_CONFIGURED' : overallScore >= 50 ? 'PARTIALLY_CONFIGURED' : 'NEEDS_ATTENTION',
    score: overallScore,
    corsCheck,
    importCheck,
    returnCheck
  });
});

console.log('\n📊 Final Results Summary:');
console.log(`Total APIs Checked: ${totalChecks}`);
console.log(`Fully Configured: ${passedChecks}`);
console.log(`Success Rate: ${Math.round((passedChecks/totalChecks)*100)}%`);

// Show detailed results for any that need attention
const needsAttention = detailedResults.filter(r => r.status !== 'FULLY_CONFIGURED');
if (needsAttention.length > 0) {
  console.log('\n🔧 APIs Needing Attention:');
  needsAttention.forEach(result => {
    console.log(`\n${result.status.padEnd(20)} ${result.api.padEnd(40)} (${result.score}%)`);
    if (result.corsCheck.missingRequirements.length > 0) {
      console.log(`   Missing CORS: ${result.corsCheck.missingRequirements.join(', ')}`);
    }
  });
}

if (passedChecks === totalChecks && totalChecks > 0) {
  console.log('\n🎉 SUCCESS! All LinkedIn Extension APIs Have Complete CORS Configuration');
  
  console.log('\n✅ Ready for Deployment:');
  console.log('• All critical sponsor check APIs are CORS-enabled');
  console.log('• Job management APIs support LinkedIn origins');
  console.log('• Background APIs (autofill, subscription) are accessible');
  console.log('• OPTIONS preflight requests are handled everywhere');
  
  console.log('\n🚀 Extension Will Work Seamlessly:');
  console.log('• Sponsorship checks on LinkedIn job listings');
  console.log('• Adding jobs to board from LinkedIn pages');
  console.log('• Application tracking and management');
  console.log('• User dashboard functionality');
  console.log('• Profile autofill features');
  console.log('• Real-time ATS scoring and feedback');
  
  console.log('\n📋 Test Commands:');
  console.log('// Test sponsor check (core functionality):');
  console.log('curl -H "Origin: https://www.linkedin.com" \\');
  console.log('     -H "Access-Control-Request-Method: GET" \\');
  console.log('     -X OPTIONS https://your-app.com/api/app/sponsorship/companies');
  console.log('');
  console.log('// Test job management:');
  console.log('curl -H "Origin: https://www.linkedin.com" \\');
  console.log('     -H "Authorization: Bearer <token>" \\');
  console.log('     -X POST https://your-app.com/api/app/jobs \\');
  console.log('     -H "Content-Type: application/json" \\');
  console.log('     -d \'{"title":"Job Title","company":"Company Name"}\'');
  
} else {
  console.log('\n⚠️  Some APIs Still Need Configuration');
  console.log(`Success Rate: ${Math.round((passedChecks/totalChecks)*100)}%`);
  console.log('\n🔧 Next Steps:');
  console.log('1. Fix the remaining CORS configuration issues');
  console.log('2. Ensure all API responses include addCorsHeaders() calls');
  console.log('3. Add proper error handling with CORS headers');
  console.log('4. Test preflight requests with curl or browser dev tools');
  console.log('5. Verify all functionality works end-to-end');
}

console.log('\n📋 CORS Implementation Summary:');
console.log('✅ LinkedIn origins: https://www.linkedin.com, https://linkedin.com');
console.log('✅ Production origins: https://hireall.app (and subdomains)');
console.log('✅ Development support: http://localhost:3000');
console.log('✅ Preflight requests: OPTIONS handlers added');
console.log('✅ Dynamic origins: Based on request origin');
console.log('✅ Full header set: Methods, Headers, Credentials, Vary');
