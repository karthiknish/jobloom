// Test script to verify Firebase Admin SDK functionality
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const fs = require('fs');
const path = require('path');

async function testFirebaseAdmin() {
  console.log('Testing Firebase Admin SDK functionality...\n');

  let app;
  let serviceAccount;

  try {
    // Try to load service account from various sources
    const sources = [
      { name: 'hireall-4f106-firebase-adminsdk-fbsvc-2e91c28cd6.json', path: path.join(__dirname, 'hireall-4f106-firebase-adminsdk-fbsvc-2e91c28cd6.json') },
      { name: 'temp-key.json', path: path.join(__dirname, 'temp-key.json') },
    ];

    for (const source of sources) {
      try {
        if (fs.existsSync(source.path)) {
          serviceAccount = JSON.parse(fs.readFileSync(source.path, 'utf8'));
          console.log(`✓ Loaded service account from ${source.name}`);
          break;
        }
      } catch (error) {
        console.log(`✗ Failed to load from ${source.name}:`, error.message);
      }
    }

    if (!serviceAccount) {
      throw new Error('No service account file found');
    }

    // Initialize Firebase Admin
    console.log('\nInitializing Firebase Admin...');

    if (getApps().length > 0) {
      app = getApps()[0];
      console.log('✓ Using existing Firebase app');
    } else {
      app = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id,
        storageBucket: `${serviceAccount.project_id}.appspot.com`,
      });
      console.log('✓ Firebase Admin initialized successfully');
    }

    // Test Firestore
    console.log('\nTesting Firestore...');
    const db = getFirestore(app);

    // Test a simple query
    const testCollection = 'test_collection_' + Date.now();
    const testDoc = db.collection(testCollection).doc('test');

    await testDoc.set({
      message: 'Firebase Admin test successful',
      timestamp: new Date(),
      test: true
    });

    console.log('✓ Firestore write successful');

    const doc = await testDoc.get();
    if (doc.exists) {
      console.log('✓ Firestore read successful');
      console.log('  Data:', doc.data());
    }

    // Clean up test document
    await testDoc.delete();
    console.log('✓ Firestore delete successful');

    // Test Auth
    console.log('\nTesting Auth...');
    const auth = getAuth(app);

    // Just test that we can get the auth instance
    console.log('✓ Auth instance created successfully');

    // Test Storage
    console.log('\nTesting Storage...');
    const storage = getStorage(app);

    // Just test that we can get the storage instance
    console.log('✓ Storage instance created successfully');

    console.log('\n🎉 All Firebase Admin tests passed!');
    console.log('\nFirebase Admin SDK is working correctly with service account.');

  } catch (error) {
    console.error('\n❌ Firebase Admin test failed:', error);
    console.error('\nTroubleshooting tips:');
    console.error('1. Check that your service account JSON file is valid');
    console.error('2. Verify the project ID matches your Firebase project');
    console.error('3. Ensure the service account has proper permissions');
    console.error('4. Check that Firebase Security Rules allow the operations');
    process.exit(1);
  }
}

// Run the test
testFirebaseAdmin().catch(console.error);
