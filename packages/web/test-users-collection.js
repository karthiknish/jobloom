// Test script to specifically test users collection access
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

async function testUsersCollectionAccess() {
  console.log('Testing users collection access with Admin SDK...\n');

  let app;
  let serviceAccount;

  try {
    // Load service account
    const serviceAccountPath = path.join(__dirname, 'hireall-4f106-firebase-adminsdk-fbsvc-2e91c28cd6.json');
    serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    console.log('✓ Loaded service account');

    // Initialize Firebase Admin
    if (getApps().length > 0) {
      app = getApps()[0];
      console.log('✓ Using existing Firebase app');
    } else {
      app = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });
      console.log('✓ Firebase Admin initialized');
    }

    const db = getFirestore(app);
    console.log('✓ Got Firestore instance');

    // Try to list some documents from users collection
    console.log('\nTesting users collection access...');
    const usersRef = db.collection('users');
    const snapshot = await usersRef.limit(5).get();

    console.log(`✓ Found ${snapshot.size} user documents`);
    snapshot.forEach((doc) => {
      console.log(`  - User ID: ${doc.id}`);
      const data = doc.data();
      console.log(`    Admin status: ${data.isAdmin || false}`);
    });

    // Try to access a specific user document if any exist
    if (snapshot.size > 0) {
      const firstUserId = snapshot.docs[0].id;
      console.log(`\nTesting specific user document access for: ${firstUserId}`);

      const userDoc = await usersRef.doc(firstUserId).get();
      if (userDoc.exists) {
        console.log('✓ User document exists and is accessible');
        const userData = userDoc.data();
        console.log(`  Admin status: ${userData.isAdmin || false}`);
      } else {
        console.log('✗ User document does not exist');
      }
    }

    console.log('\n🎉 Users collection access test passed!');

  } catch (error) {
    console.error('\n❌ Users collection access test failed:', error);
    console.error('Error details:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    if (error.details) {
      console.error('Error details:', error.details);
    }
  }
}

// Run the test
testUsersCollectionAccess().catch(console.error);