#!/usr/bin/env node

/**
 * Script to add OPTIONS handlers to API routes that need CORS
 */

const fs = require('fs');
const path = require('path');

const routesToAddOptions = [
  'packages/web/src/app/api/app/jobs/route.ts',
  'packages/web/src/app/api/app/applications/route.ts',
  'packages/web/src/app/api/app/follow-ups/route.ts',
  'packages/web/src/app/api/app/autofill/profile/[userId]/route.ts',
  'packages/web/src/app/api/app/jobs/user/[userId]/route.ts',
  'packages/web/src/app/api/app/applications/user/[userId]/route.ts',
  'packages/web/src/app/api/subscription/status/route.ts'
];

const optionsHandler = `
// OPTIONS handler for CORS preflight
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, origin || undefined);
}
`;

function addOptionsHandler(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if OPTIONS handler already exists
    if (content.includes('export async function OPTIONS')) {
      console.log(`✅ ${filePath} - OPTIONS handler already exists`);
      return true;
    }
    
    // Check if CORS helper exists
    if (!content.includes('function addCorsHeaders')) {
      console.log(`⚠️  ${filePath} - CORS helper function missing, adding it`);
      // Add CORS helper at the top after imports
      const importEndIndex = content.lastIndexOf('import ');
      if (importEndIndex > -1) {
        const afterImportIndex = content.indexOf('\n', importEndIndex) + 1;
        content = content.slice(0, afterImportIndex) + getCorsHelper() + content.slice(afterImportIndex);
      }
    }
    
    // Add OPTIONS handler at the end
    content += '\n\n' + optionsHandler;
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ ${filePath} - OPTIONS handler added`);
    return true;
  } catch (error) {
    console.log(`❌ ${filePath} - Error: ${error.message}`);
    return false;
  }
}

function getCorsHelper() {
  return `
// CORS helper function for LinkedIn extension
function addCorsHeaders(response, origin) {
  const allowedOrigins = [
    'https://www.linkedin.com',
    'https://linkedin.com',
    process.env.NEXT_PUBLIC_WEB_URL || 'https://hireall.app',
    'http://localhost:3000',
  ];

  const requestOrigin = origin;

  if (requestOrigin && (allowedOrigins.includes(requestOrigin) || 
      requestOrigin.includes('hireall.app') || 
      requestOrigin.includes('vercel.app') || 
      requestOrigin.includes('netlify.app'))) {
    response.headers.set('Access-Control-Allow-Origin', requestOrigin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID, X-Requested-With');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Vary', 'Origin');
  } else if (process.env.NODE_ENV === 'development') {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID');
  }

  return response;
}
`;
}

console.log('🔧 Adding OPTIONS handlers to API routes...\n');

let successCount = 0;
let errorCount = 0;

routesToAddOptions.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    if (addOptionsHandler(filePath)) {
      successCount++;
    } else {
      errorCount++;
    }
  } else {
    console.log(`⚠️  ${filePath} - File not found`);
  }
});

console.log(`\n📊 Summary:`);
console.log(`✅ Success: ${successCount} files updated`);
console.log(`❌ Errors: ${errorCount} files failed`);

if (successCount > 0) {
  console.log(`\n🎉 OPTIONS handlers added successfully!`);
  console.log(`📋 Added CORS support for LinkedIn extension to ${successCount} API endpoints`);
}

if (errorCount > 0) {
  console.log(`\n⚠️  Some files failed to update. Please check the errors above.`);
}
