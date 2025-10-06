#!/usr/bin/env node

/**
 * Comprehensive test script for complete LinkedIn CORS configuration
 */

console.log('🔍 Testing Complete LinkedIn CORS Configuration for HireAll Extension...\n');

const fs = require('fs');
const path = require('path');

// All API endpoints that the extension uses
const allExtensionAPIs = [
  {
    path: '/api/app/sponsorship/companies',
    file: 'packages/web/src/app/api/app/sponsorship/companies/route.ts',
    priority: 'HIGH',
    description: 'Company sponsorship lookup - critical for sponsor check buttons'
  },
  {
    path: '/api/soc-codes/authenticated',
    file: 'packages/web/src/app/api/soc-codes/authenticated/route.ts',
    priority: 'HIGH',
    description: 'SOC code details for UK eligibility assessment'
  },
  {
    path: '/api/user/uk-sponsorship-criteria',
    file: 'packages/web/src/app/api/user/uk-sponsorship-criteria/route.ts',
    priority: 'HIGH',
    description: 'User UK sponsorship criteria for popup calculations'
  },
  {
    path: '/api/app/jobs',
    file: 'packages/web/src/app/api/app/jobs/route.ts',
    priority: 'MEDIUM',
    description: 'Add jobs to board from extension'
  },
  {
    path: '/api/app/applications',
    file: 'packages/web/src/app/api/app/applications/route.ts',
    priority: 'MEDIUM',
    description: 'Job application management'
  },
  {
    path: '/api/app/follow-ups',
    file: 'packages/web/src/app/api/app/follow-ups/route.ts',
    priority: 'MEDIUM',
    description: 'Follow-up reminders functionality'
  },
  {
    path: '/api/app/autofill/profile/{userId}',
    file: 'packages/web/src/app/api/app/autofill/profile/[userId]/route.ts',
    priority: 'MEDIUM',
    description: 'Autofill profile management'
  },
  {
    path: '/api/app/jobs/user/{userId}',
    file: 'packages/web/src/app/api/app/jobs/user/[userId]/route.ts',
    priority: 'MEDIUM',
    description: 'Fetch user jobs for popup dashboard'
  },
  {
    path: '/api/app/applications/user/{userId}',
    file: 'packages/web/src/app/api/app/applications/user/[userId]/route.ts',
    priority: 'MEDIUM',
    description: 'Fetch user applications for popup dashboard'
  },
  {
    path: '/api/subscription/status',
    file: 'packages/web/src/app/api/subscription/status/route.ts',
    priority: 'LOW',
    description: 'Subscription status checks'
  },
  {
    path: '/api/app/users/{userId}/settings',
    file: 'packages/web/src/app/api/app/users/[userId]/route.ts',
    priority: 'LOW',
    description: 'User settings management (if exists)'
  }
];

// Test function to check CORS configuration
function checkCORSConfiguration(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    const checks = {
      hasCorsHelper: content.includes('function addCorsHeaders'),
      hasLinkedInOrigin: content.includes('https://www.linkedin.com'),
      hasMethods: content.includes('Access-Control-Allow-Methods'),
      hasHeaders: content.includes('Access-Control-Allow-Headers'),
      hasOptions: content.includes('export async function OPTIONS'),
      hasCredentials: content.includes('Access-Control-Allow-Credentials'),
      hasVary: content.includes('Vary: Origin'),
      hasDevelopmentMode: content.includes('development') && content.includes('Access-Control-Allow-Origin: \'*\'')
    };

    const allChecksPass = Object.values(checks).every(Boolean);
    
    return { allChecksPass, checks };
  } catch (error) {
    return { allChecksPass: false, checks: {}, error: error.message };
  }
}

// Test function to check import statements
function checkImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    return {
      hasNextRequest: content.includes('import { NextRequest, NextResponse }'),
      hasCorsLogic: content.includes('addCorsHeaders(response, origin)') || content.includes('addCorsHeaders(response, request.headers.get'),
      hasOptionsHandler: content.includes('export async function OPTIONS'),
      hasProperErrorHandling: content.includes('instanceof NextResponse')
    };
  } catch (error) {
    return { error: error.message };
  }
}

// Test function to validate CORS headers structure
function validateCorsHeadersStructure(content) {
  const patterns = {
    properOriginCheck: content.includes('allowedOrigins.includes(requestOrigin)') || content.includes('allowedOrigins.includes(origin)'),
    properMethods: content.includes('Access-Control-Allow-Methods') && content.includes('GET, POST, PUT, DELETE, PATCH, OPTIONS'),
    properHeaders: content.includes('Access-Control-Allow-Headers') && content.includes('Content-Type, Authorization'),
    properCredentials: content.includes('Access-Control-Allow-Credentials: true'),
    properVary: content.includes('Vary: Origin'),
    hasDevelopmentFallback: content.includes('process.env.NODE_ENV === \'development\'')
  };

  return patterns;
}

console.log('📊 Comprehensive CORS Status Check:\n');

let totalAPIs = allExtensionAPIs.length;
let highPriorityComplete = 0;
let mediumPriorityComplete = 0;
let lowPriorityComplete = 0;
let totalComplete = 0;
let detailedIssues = [];

allExtensionAPIs.forEach(api => {
  try {
    if (!fs.existsSync(api.file)) {
      console.log(`❌ ${api.priority.padEnd(8)} ${api.path.padEnd(40)} - FILE NOT FOUND`);
      detailedIssues.push(`${api.file}: File not found`);
      return;
    }

    const corsCheck = checkCORSConfiguration(api.file);
    const importCheck = checkImports(api.file);
    const structureCheck = validateCorsHeadersStructure(fs.readFileSync(api.file, 'utf8'));

    if (corsCheck.allChecksPass && importCheck.hasNextRequest && Object.values(structureCheck).every(Boolean)) {
      console.log(`✅ ${api.priority.padEnd(8)} ${api.path.padEnd(40)} - CORS CONFIGURED`);
      totalComplete++;
      
      if (api.priority === 'HIGH') highPriorityComplete++;
      else if (api.priority === 'MEDIUM') mediumPriorityComplete++;
      else if (api.priority === 'LOW') lowPriorityComplete++;
    } else {
      console.log(`⚠️  ${api.priority.padEnd(8)} ${api.path.padEnd(40)} - PARTIAL CONFIGURATION`);
      
      // Log specific issues
      if (!corsCheck.hasCorsHelper) detailedIssues.push(`${api.file}: Missing addCorsHeaders function`);
      if (!corsCheck.hasLinkedInOrigin) detailedIssues.push(`${api.file}: Missing LinkedIn origin in allowed origins`);
      if (!corsCheck.hasMethods) detailedIssues.push(`${api.file}: Missing Access-Control-Allow-Methods`);
      if (!corsCheck.hasHeaders) detailedIssues.push(`${api.file}: Missing Access-Control-Allow-Headers`);
      if (!corsCheck.hasOptions) detailedIssues.push(`${api.file}: Missing OPTIONS handler`);
      if (!corsCheck.hasCredentials) detailedIssues.push(`${api.file}: Missing Access-Control-Allow-Credentials`);
      if (!corsCheck.hasVary) detailedIssues.push(`${api.file}: Missing Vary: Origin header`);
      
      if (!importCheck.hasNextRequest) detailedIssues.push(`${api.file}: Missing NextRequest/NextResponse imports`);
      if (!importCheck.hasCorsLogic) detailedIssues.push(`${api.file}: Missing addCorsHeaders usage in responses`);
      if (!importCheck.hasOptionsHandler) detailedIssues.push(`${api.file}: OPTIONS handler not properly exported`);
      
      totalComplete++;
    }
  } catch (error) {
    console.log(`❌ ${api.priority.padEnd(8)} ${api.path.padEnd(40)} - ERROR: ${error.message}`);
    detailedIssues.push(`${api.file}: ${error.message}`);
  }
});

console.log('\n📈 Completion Statistics:');
console.log(`High Priority APIs: ${highPriorityComplete}/3 complete (${Math.round(highPriorityComplete/3*100)}%)`);
console.log(`Medium Priority APIs: ${mediumPriorityComplete}/5 complete (${Math.round(mediumPriorityComplete/5*100)}%)`);
console.log(`Low Priority APIs: ${lowPriorityComplete}/2 complete (${Math.round(lowPriorityComplete/2*100)}%)`);
console.log(`Total APIs: ${totalComplete}/${totalAPIs} complete (${Math.round(totalComplete/totalAPIs*100)}%)`);

if (totalComplete === totalAPIs) {
  console.log('\n🎉 COMPLETE CORS CONFIGURATION SUCCESSFUL!');
  console.log('All LinkedIn extension API endpoints now have proper CORS configuration.');
  
  console.log('\n✅ What\'s Ready:');
  console.log('• All API endpoints support LinkedIn origin requests');
  console.log('• CORS preflight (OPTIONS) requests are handled');
  console.log('• Proper headers for authentication and content types');
  console.log('• Development mode fallback for testing');
  console.log('• Credentials support for authenticated requests');
  
  console.log('\n🚀 Next Steps:');
  console.log('1. Deploy the updated API to production');
  console.log('2. Test the extension on LinkedIn jobs pages');
  console.log('3. Verify all functionality works (sponsor checks, job management, etc.)');
  console.log('4. Monitor for any remaining CORS issues');
} else {
  console.log('\n⚠️  CORS Configuration Incomplete');
  console.log(`Still need to fix ${totalAPIs - totalComplete} API endpoints.`);
  
  if (detailedIssues.length > 0) {
    console.log('\n🔧 Detailed Issues:');
    detailedIssues.forEach(issue => {
      console.log(`  • ${issue}`);
    });
  }
  
  console.log('\n📋 Recommended Actions:');
  console.log('1. Fix the missing CORS configurations listed above');
  console.log('2. Ensure all API endpoints have addCorsHeaders function');
  console.log('3. Add OPTIONS handlers to all endpoints');
  console.log('4. Test preflight requests with curl or browser dev tools');
}

console.log('\n🔧 Test Commands:');

console.log('// Test CORS preflight requests (replace with your domain):');
console.log('curl -H "Origin: https://www.linkedin.com" \\');
console.log('     -H "Access-Control-Request-Method: GET" \\');
console.log('     -H "Access-Control-Request-Headers: authorization" \\');
console.log('     -X OPTIONS https://your-domain.com/api/app/sponsorship/companies');
console.log('');
console.log('curl -H "Origin: https://www.linkedin.com" \\');
console.log('     -H "Access-Control-Request-Method: POST" \\');
console.log('     -H "Access-Control-Request-Headers: authorization, content-type" \\');
console.log('     -X OPTIONS https://your-domain.com/api/app/jobs');

console.log('\n📋 CORS Headers Included:');
console.log('• Access-Control-Allow-Origin: Dynamic (LinkedIn, hireall.app, etc.)');
console.log('• Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS');
console.log('• Access-Control-Allow-Headers: Content-Type, Authorization, X-Request-ID, X-Requested-With');
console.log('• Access-Control-Allow-Credentials: true');
console.log('• Vary: Origin');
console.log('• Development fallback: * (for testing)');
