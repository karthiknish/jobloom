// Test script to verify isUserAdmin function specifically
const { isUserAdmin } = require('./src/firebase/admin.ts');

async function testIsUserAdmin() {
  console.log('Testing isUserAdmin function...\n');

  try {
    // Test with a known admin user ID (you'll need to replace this with an actual user ID)
    const testUserId = 'some-admin-user-id'; // Replace with actual admin user ID

    console.log(`Testing admin check for user: ${testUserId}`);
    const isAdmin = await isUserAdmin(testUserId);
    console.log(`Result: ${isAdmin}`);

    // Test with invalid input
    console.log('\nTesting with invalid input...');
    const invalidResult = await isUserAdmin('');
    console.log(`Invalid input result: ${invalidResult}`);

    console.log('\n✓ isUserAdmin test completed');

  } catch (error) {
    console.error('\n❌ isUserAdmin test failed:', error);
    console.error('Error details:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
  }
}

// Run the test
testIsUserAdmin().catch(console.error);