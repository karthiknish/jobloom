#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting HireAll Web App Tests with Playwright MCP\n');

// Check if we're in the right directory
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const playwrightConfigPath = path.join(__dirname, '..', 'playwright.config.ts');

console.log('📋 Test Configuration:');
console.log('├── Package:', require(packageJsonPath).name);
console.log('├── Playwright Config:', path.basename(playwrightConfigPath));
console.log('├── Test Directory:', path.basename(__dirname));
console.log('');

console.log('🧪 Running Test Suite...\n');

// Run the tests
try {
  const result = execSync('npm test -- --reporter=line', {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
    encoding: 'utf8'
  });

  console.log('\n✅ All tests completed successfully!');
  console.log('\n📊 Test Summary:');
  console.log('├── Homepage tests: Navigation, CTAs, responsiveness');
  console.log('├── Jobs tests: Search, filtering, job listings');
  console.log('├── Interview Prep tests: Tabs, questions, progress');
  console.log('├── Portfolio Builder tests: Marketing, features');
  console.log('├── Chatbot tests: UI, interactions, messaging');
  console.log('└── Mobile tests: Navigation, responsive design');

} catch (error) {
  console.error('\n❌ Tests failed with exit code:', error.status);
  console.log('\n🔍 To debug:');
  console.log('├── Run with UI: npm run test:ui');
  console.log('├── Run headed: npm run test:headed');
  console.log('├── Debug mode: npm run test:debug');
  console.log('└── View report: npx playwright show-report');

  process.exit(error.status);
}

console.log('\n🎉 HireAll web app testing complete!');
console.log('📈 Ready for deployment with confidence!\n');
