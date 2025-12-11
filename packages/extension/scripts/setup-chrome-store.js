#!/usr/bin/env node

/**
 * Chrome Web Store API Token Setup Helper
 *
 * This script helps you generate the necessary tokens for Chrome Web Store publishing.
 * Run this script to get instructions for setting up your GitHub secrets.
 */

const https = require('https');
const querystring = require('querystring');

console.log('Chrome Web Store API Token Setup Helper');
console.log('============================================\n');

console.log('This script will help you set up automated publishing to the Chrome Web Store.\n');

console.log('Prerequisites:');
console.log('1. Chrome Web Store Developer account');
console.log('2. Extension published to Chrome Web Store (get the Extension ID)');
console.log('3. Google Cloud Console project with Chrome Web Store API enabled\n');

console.log('Step-by-Step Setup:\n');

console.log('1. Create Chrome Web Store API Credentials:');
console.log('   - Go to: https://chromewebstore.google.com/developer/dashboard');
console.log('   - Click "API access" in the left sidebar');
console.log('   - Create OAuth 2.0 credentials');
console.log('   - Note down: Client ID and Client Secret\n');

console.log('2. Generate Refresh Token:');
console.log('   - Go to: https://developers.google.com/oauthplayground/');
console.log('   - Click the gear icon (settings)');
console.log('   - Enter your OAuth Client ID and Secret');
console.log('   - Click "Authorize APIs"');
console.log('   - Select "Chrome Web Store API v1.1" from the list');
console.log('   - Click "Authorize APIs"');
console.log('   - Grant permissions');
console.log('   - Click "Exchange authorization code for tokens"');
console.log('   - Copy the "refresh_token" value\n');

console.log('3. Get Your Extension ID:');
console.log('   - Go to Chrome Web Store Developer Dashboard');
console.log('   - Find your extension');
console.log('   - Copy the Extension ID from the URL or extension details\n');

console.log('4. Add GitHub Secrets:');
console.log('   Go to your GitHub repo > Settings > Secrets and variables > Actions');
console.log('   Add these secrets:\n');

console.log('   CHROME_CLIENT_ID=your_client_id_here');
console.log('   CHROME_CLIENT_SECRET=your_client_secret_here');
console.log('   CHROME_REFRESH_TOKEN=your_refresh_token_here');
console.log('   CHROME_EXTENSION_ID=your_extension_id_here');
console.log('   OAUTH_CLIENT_ID=your_oauth_client_id');
console.log('   OAUTH_CLIENT_SECRET_BASE64=your_base64_oauth_secret\n');

console.log('5. Test the Workflow:');
console.log('   - Push changes to the extension to trigger auto-publish');
console.log('   - Or manually trigger via GitHub Actions > Publish Chrome Extension\n');

console.log('Additional Resources:');
console.log('   - Chrome Web Store API: https://developer.chrome.com/docs/webstore/using-api/');
console.log('   - OAuth 2.0 Playground: https://developers.google.com/oauthplayground/');
console.log('   - GitHub Actions Docs: https://docs.github.com/en/actions\n');

console.log('Once set up, your extension will automatically publish on every push to main/release branches!');

process.exit(0);
