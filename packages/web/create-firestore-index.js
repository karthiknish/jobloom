// Script to create Firestore composite index using Firebase Admin SDK
const admin = require('firebase-admin');
const { GoogleAuth } = require('google-auth-library');

// Initialize Firebase Admin SDK
const serviceAccount = require('./hireall-4f106-firebase-adminsdk-fbsvc-2e91c28cd6.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'hireall-4f106'
});

const firestore = admin.firestore();

async function createCompositeIndex() {
  try {
    console.log('Creating Firestore composite index for cvAnalyses collection...');

    // Use Firestore Admin API to create index
    // Note: Firebase Admin SDK doesn't directly support index creation
    // We'll use the REST API with Google Auth

    const projectId = 'hireall-4f106';
    const databaseId = '(default)';
    const collectionGroupId = 'cvAnalyses';

    // Get access token using Google Auth
    const auth = new GoogleAuth({
      credentials: serviceAccount,
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });

    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    const indexData = {
      fields: [
        {
          fieldPath: 'userId',
          order: 'ASCENDING'
        },
        {
          fieldPath: 'createdAt',
          order: 'ASCENDING'
        }
      ],
      queryScope: 'COLLECTION'
    };

    const response = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/collectionGroups/${collectionGroupId}/indexes`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(indexData)
      }
    );

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Index creation request submitted successfully!');
      console.log('Index name:', result.name);
      console.log('Status:', result.state);
      console.log('\n📋 Index Details:');
      console.log('- Collection: cvAnalyses');
      console.log('- Fields: userId (ASC), createdAt (ASC)');
      console.log('\n⏱️  The index will take 2-5 minutes to build.');
      console.log('You can check the status in Firebase Console → Firestore → Indexes');
    } else {
      const error = await response.json();
      console.error('❌ Failed to create index:', error);

      if (error.error && error.error.message.includes('already exists')) {
        console.log('ℹ️  Index may already exist. This is normal if you\'ve created it before.');
      }
    }

  } catch (error) {
    console.error('❌ Error creating index:', error.message);

    // Provide fallback instructions
    console.log('\n🔄 Fallback: Please create the index manually:');
    console.log('1. Go to: https://console.firebase.google.com/v1/r/project/hireall-4f106/firestore/indexes?create_composite=ClBwcm9qZWN0cy9oaXJlYWxsLTRmMTA2L2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9jdkFuYWx5c2VzL2luZGV4ZXMvXxABGgoKBnVzZXJJZBABGg0KCWNyZWF0ZWRBdBABGgwKCF9fbmFtZV9fEAE');
    console.log('2. Or manually: Firebase Console → Firestore → Indexes → Create Index');
    console.log('   - Collection: cvAnalyses');
    console.log('   - Fields: userId (Ascending), createdAt (Ascending)');
  } finally {
    process.exit(0);
  }
}

createCompositeIndex();
