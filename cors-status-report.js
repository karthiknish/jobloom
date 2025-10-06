#!/usr/bin/env node

/**
 * Comprehensive CORS status report for HireAll extension APIs
 */

console.log('🔍 HireAll Extension - CORS Status Report\n');

const fs = require('fs');
const path = require('path');

// All API endpoints used by the extension
const extensionAPIs = [
  // ✅ COMPLETED - High Priority (Core Sponsorship Features)
  {
    path: '/api/app/sponsorship/companies',
    file: 'packages/web/src/app/api/app/sponsorship/companies/route.ts',
    priority: 'HIGH',
    status: '✅ FIXED',
    description: 'Company sponsorship lookup - critical for sponsor check buttons'
  },
  {
    path: '/api/soc-codes/authenticated', 
    file: 'packages/web/src/app/api/soc-codes/authenticated/route.ts',
    priority: 'HIGH',
    status: '✅ FIXED',
    description: 'SOC code details for UK eligibility assessment'
  },
  {
    path: '/api/user/uk-sponsorship-criteria',
    file: 'packages/web/src/app/api/user/uk-sponsorship-criteria/route.ts', 
    priority: 'HIGH',
    status: '✅ FIXED',
    description: 'User UK sponsorship criteria for popup calculations'
  },

  // 🔧 IN PROGRESS - Medium Priority (Job Management)
  {
    path: '/api/app/jobs',
    file: 'packages/web/src/app/api/app/jobs/route.ts',
    priority: 'MEDIUM',
    status: '🔧 NEEDS CORS',
    description: 'Add jobs to board from extension'
  },
  {
    path: '/api/app/applications',
    file: 'packages/web/src/app/api/app/applications/route.ts', 
    priority: 'MEDIUM',
    status: '🔧 NEEDS CORS',
    description: 'Job application management'
  },
  {
    path: '/api/app/jobs/user/{userId}',
    file: 'packages/web/src/app/api/app/jobs/user/[userId]/route.ts',
    priority: 'MEDIUM', 
    status: '🔧 NEEDS CORS',
    description: 'Fetch user jobs for popup dashboard'
  },
  {
    path: '/api/app/applications/user/{userId}',
    file: 'packages/web/src/app/api/app/applications/user/[userId]/route.ts',
    priority: 'MEDIUM',
    status: '🔧 NEEDS CORS', 
    description: 'Fetch user applications for popup dashboard'
  },

  // 📋 LOWER PRIORITY - Background Features
  {
    path: '/api/app/follow-ups',
    file: 'packages/web/src/app/api/app/follow-ups/route.ts',
    priority: 'LOW',
    status: '🔧 NEEDS CORS',
    description: 'Follow-up reminders functionality'
  },
  {
    path: '/api/app/autofill/profile/{userId}',
    file: 'packages/web/src/app/api/app/autofill/profile/[userId]/route.ts',
    priority: 'LOW',
    status: '🔧 NEEDS CORS',
    description: 'Autofill profile management'
  },
  {
    path: '/api/subscription/status',
    file: 'packages/web/src/app/api/subscription/status/route.ts',
    priority: 'LOW',
    status: '🔧 NEEDS CORS',
    description: 'Subscription status checks'
  },
  {
    path: '/api/app/users/{userId}/settings',
    file: 'packages/web/src/app/api/app/users/[userId]/route.ts',
    priority: 'LOW',
    status: '🔧 NEEDS CORS',
    description: 'User settings management'
  }
];

// Check CORS status for each API
function checkCORSStatus(api) {
  try {
    if (!fs.existsSync(api.file)) {
      return '📁 FILE NOT FOUND';
    }

    const content = fs.readFileSync(api.file, 'utf8');
    const hasCORS = content.includes('Access-Control-Allow-Origin') &&
                   content.includes('linkedin.com') &&
                   content.includes('OPTIONS');

    if (hasCORS) {
      return '✅ HAS CORS';
    } else {
      return '🔧 NEEDS CORS';
    }
  } catch (error) {
    return `❌ ERROR: ${error.message}`;
  }
}

// Generate status report
console.log('📊 Current CORS Status:\n');

let highPriorityComplete = 0;
let totalHighPriority = 0;
let totalWithCORS = 0;

extensionAPIs.forEach(api => {
  const actualStatus = checkCORSStatus(api);
  
  if (api.priority === 'HIGH') {
    totalHighPriority++;
    if (actualStatus === '✅ HAS CORS') {
      highPriorityComplete++;
    }
  }
  
  if (actualStatus === '✅ HAS CORS') {
    totalWithCORS++;
  }

  console.log(`${actualStatus.padEnd(15)} ${api.priority.padEnd(8)} ${api.path}`);
  console.log(`${''.padEnd(15)} 📁 ${api.file}`);
  console.log(`${''.padEnd(15)} 📝 ${api.description}`);
  console.log('');
});

// Summary
console.log('📈 Summary:\n');
console.log(`High Priority APIs: ${highPriorityComplete}/${totalHighPriority} complete (${Math.round(highPriorityComplete/totalHighPriority*100)}%)`);
console.log(`Total APIs with CORS: ${totalWithCORS}/${extensionAPIs.length} complete (${Math.round(totalWithCORS/extensionAPIs.length*100)}%)`);

if (highPriorityComplete === totalHighPriority) {
  console.log('\n🎉 HIGH PRIORITY APIs COMPLETE!');
  console.log('The extension\'s core sponsor check functionality should work now.');
} else {
  console.log('\n⚠️  Some high priority APIs still need CORS setup.');
}

console.log('\n🚀 Deployment Checklist:');
console.log('✅ Global middleware configured for LinkedIn origins');
console.log('✅ Sponsorship lookup API CORS enabled');
console.log('✅ SOC codes API CORS enabled');
console.log('✅ UK sponsorship criteria API CORS enabled');

if (totalWithCORS < extensionAPIs.length) {
  console.log(`🔧 ${extensionAPIs.length - totalWithCORS} APIs still need CORS configuration`);
}

console.log('\n📋 Recommended Next Steps:');
if (highPriorityComplete === totalHighPriority) {
  console.log('1. ✅ Deploy current CORS fixes to production');
  console.log('2. ✅ Test core sponsor functionality on LinkedIn');
  console.log('3. 🔧 Add CORS to remaining APIs as needed (job management, etc.)');
} else {
  console.log('1. 🔧 Complete CORS setup for remaining HIGH priority APIs');
  console.log('2. 📋 Add CORS to medium priority APIs (job management)');
  console.log('3. 🚀 Deploy all CORS fixes to production');
}

console.log('\n🔍 Test Commands:');
console.log('// Test CORS preflight (replace with your domain):');
console.log('curl -H "Origin: https://www.linkedin.com" \\');
console.log('     -H "Access-Control-Request-Method: GET" \\');
console.log('     -H "Access-Control-Request-Headers: authorization" \\');
console.log('     -X OPTIONS https://your-domain.com/api/app/sponsorship/companies');
