const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test categories
const testCategories = {
  'cv-evaluator': 'tests/cv-evaluator.spec.ts',
  'dashboard': 'tests/dashboard.spec.ts', 
  'settings': 'tests/settings.spec.ts',
  'auth': 'tests/auth.spec.ts',
  'api': 'tests/api.spec.ts'
};

// Extension test categories (for when extension tests are implemented)
const extensionTestCategories = {
  'popup': 'tests/popup.spec.ts',
  'content-script': 'tests/content-script.spec.ts',
  'background': 'tests/background.spec.ts',
  'job-tracker': 'tests/job-tracker.spec.ts'
};

function runTests(categories, type = 'web') {
  console.log(`\n🧪 Running ${type} tests...\n`);
  
  Object.entries(categories).forEach(([category, testFile]) => {
    if (fs.existsSync(testFile)) {
      console.log(`\n📋 Running ${category} tests...`);
      try {
        execSync(`npx playwright test ${testFile} --reporter=line`, {
          stdio: 'inherit',
          timeout: 60000
        });
        console.log(`✅ ${category} tests completed`);
      } catch (error) {
        console.log(`❌ ${category} tests failed`);
      }
    } else {
      console.log(`⚠️  ${category} test file not found: ${testFile}`);
    }
  });
}

// Check if tests directory exists
if (!fs.existsSync('tests')) {
  console.log('❌ Tests directory not found');
  process.exit(1);
}

// Parse command line arguments
const args = process.argv.slice(2);
const category = args[0];
const type = args[1] || 'web';

if (category === 'all') {
  if (type === 'extension') {
    runTests(extensionTestCategories, 'extension');
  } else {
    runTests(testCategories, 'web');
  }
} else if (category && testCategories[category]) {
  console.log(`\n🧪 Running ${category} tests...\n`);
  try {
    execSync(`npx playwright test ${testCategories[category]} --reporter=line`, {
      stdio: 'inherit',
      timeout: 60000
    });
    console.log(`✅ ${category} tests completed`);
  } catch (error) {
    console.log(`❌ ${category} tests failed`);
    process.exit(1);
  }
} else if (category === 'list') {
  console.log('\n📋 Available test categories:');
  console.log('\nWeb Tests:');
  Object.keys(testCategories).forEach(key => {
    console.log(`  - ${key}`);
  });
  console.log('\nExtension Tests:');
  Object.keys(extensionTestCategories).forEach(key => {
    console.log(`  - ${key}`);
  });
  console.log('\nUsage:');
  console.log('  node test-runner.js [category] [type]');
  console.log('  node test-runner.js all [web|extension]');
  console.log('  node test-runner.js list');
} else {
  console.log(`\n❌ Unknown category: ${category}`);
  console.log('Run "node test-runner.js list" to see available categories');
  process.exit(1);
}
