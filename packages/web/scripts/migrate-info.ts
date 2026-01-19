#!/usr/bin/env node

import { spawn } from 'child_process';

console.log('Starting Firebase to Convex sponsorship migration...\n');

console.log('This script requires:');
console.log('1. Firebase Admin SDK credentials (GOOGLE_APPLICATION_CREDENTIALS or service account JSON)');
console.log('2. Convex deployment URL (NEXT_PUBLIC_CONVEX_URL)');
console.log('\nTo migrate sponsors from Firebase to Convex:');
console.log('  npm run migrate:sponsorships\n');
console.log('\nNote: Make sure you have Firebase Admin credentials set up');
console.log('You can download a service account key from Firebase Console > Project Settings > Service Accounts');

const firebaseProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

if (!firebaseProjectId) {
  console.error('Error: NEXT_PUBLIC_FIREBASE_PROJECT_ID not set in .env.local');
  process.exit(1);
}

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  console.error('Error: NEXT_PUBLIC_CONVEX_URL not set in .env.local');
  process.exit(1);
}

console.log(`Firebase Project ID: ${firebaseProjectId}`);
console.log(`Convex URL: ${convexUrl}`);
console.log('\nManual Migration Steps:');
console.log('1. Export sponsors from Firebase Firestore:');
console.log('   firebase firestore:export --project ' + firebaseProjectId);
console.log('2. Convert the JSON export to Convex format');
console.log('3. Use the Convex Dashboard or CLI to import the data');
console.log('\nOr use the Firebase Admin SDK directly in a custom script with proper credentials.');
