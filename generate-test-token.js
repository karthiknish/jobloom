#!/usr/bin/env node

/**
 * Firebase Token Generator for Testing
 *
 * This script generates valid Firebase ID tokens for API testing.
 * It creates a custom token and then signs in with it to get an ID token.
 *
 * Run with: node generate-test-token.js
 */

const { initializeApp } = require('firebase/app');
const { getAuth, signInWithCustomToken } = require('firebase/auth');
const path = require('path');
const fs = require('fs');

// Firebase config - same as used in the web app
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "your-api-key-here",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
};

async function generateTestToken() {
  console.log('🔐 Generating Firebase test token...');

  try {
    // Initialize Firebase app
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);

    // For testing, we'll create a custom token using the admin SDK
    // Since we can't run the admin SDK directly in Node.js without the service account,
    // we'll use a different approach - create a mock ID token that matches Firebase format

    // Firebase ID tokens are JWTs with specific structure
    // For testing purposes, we'll create a mock token that the API can validate
    // In a real scenario, you'd use Firebase Admin SDK to create custom tokens

    const testUserId = 'test-user-123';
    const testEmail = 'test@example.com';

    // Create a mock JWT token (this won't actually verify with Firebase, but can be used for testing)
    // In production, you'd use Firebase Admin SDK to create real custom tokens
    const mockIdToken = createMockIdToken(testUserId, testEmail);

    console.log('✅ Mock Firebase ID token generated');
    console.log(`User ID: ${testUserId}`);
    console.log(`Email: ${testEmail}`);
    console.log(`Token: ${mockIdToken.substring(0, 50)}...`);

    // Output for use in tests
    console.log('\n📋 Use this token in your API tests:');
    console.log(`export MOCK_AUTH_TOKEN="${mockIdToken}"`);
    console.log(`export TEST_USER_ID="${testUserId}"`);

    return mockIdToken;

  } catch (error) {
    console.error('❌ Failed to generate test token:', error.message);
    process.exit(1);
  }
}

function createMockIdToken(uid, email) {
  // Create a mock JWT token structure
  // This is NOT a real JWT, but follows the structure for testing
  const header = Buffer.from(JSON.stringify({
    alg: 'RS256',
    typ: 'JWT'
  })).toString('base64url');

  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({
    iss: `https://securetoken.google.com/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'your-project-id'}`,
    aud: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'your-project-id',
    auth_time: now,
    user_id: uid,
    sub: uid,
    iat: now,
    exp: now + 3600, // 1 hour
    email: email,
    email_verified: true,
    firebase: {
      identities: {
        email: [email]
      },
      sign_in_provider: 'password'
    }
  })).toString('base64url');

  // Mock signature (not cryptographically valid)
  const signature = Buffer.from('mock-signature-for-testing').toString('base64url');

  return `${header}.${payload}.${signature}`;
}

// Alternative approach: Try to use Firebase Admin SDK if available
async function tryAdminSDK() {
  try {
    // Check if we can load the admin SDK
    const admin = require('firebase-admin');

    // Try to initialize with service account
    const serviceAccountPath = path.join(process.cwd(), 'your-firebase-adminsdk.json');

    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = require(serviceAccountPath);

      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'your-project-id'
        });
      }

      const uid = 'test-user-123';
      const customToken = await admin.auth().createCustomToken(uid, {
        email: 'test@example.com',
        email_verified: true
      });

      console.log('✅ Real Firebase custom token created');
      console.log(`Token: ${customToken}`);

      // Now sign in with the custom token to get an ID token
      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);

      const userCredential = await signInWithCustomToken(auth, customToken);
      const idToken = await userCredential.user.getIdToken();

      console.log('✅ Firebase ID token obtained');
      console.log(`ID Token: ${idToken.substring(0, 50)}...`);

      return idToken;
    }
  } catch (error) {
    console.log('⚠️  Could not use Firebase Admin SDK, falling back to mock token');
    console.log(`Admin SDK error: ${error.message}`);
  }

  return null;
}

async function main() {
  // Try real Firebase Admin SDK first
  const realToken = await tryAdminSDK();
  if (realToken) {
    console.log('\n📋 Use this REAL Firebase ID token in your API tests:');
    console.log(`export MOCK_AUTH_TOKEN="${realToken}"`);
    return;
  }

  // Fall back to mock token
  await generateTestToken();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { generateTestToken, createMockIdToken };