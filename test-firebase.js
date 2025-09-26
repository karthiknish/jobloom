// Test Firebase initialization
const { ensureFirebaseApp, getDb, getAuthClient } = require('./packages/web/src/firebase/client');

console.log('Testing Firebase initialization...');

try {
  const app = ensureFirebaseApp();
  console.log('Firebase app initialized:', app ? 'SUCCESS' : 'FAILED');
  
  const db = getDb();
  console.log('Firestore initialized:', db ? 'SUCCESS' : 'FAILED');
  
  const auth = getAuthClient();
  console.log('Auth initialized:', auth ? 'SUCCESS' : 'FAILED');
  
} catch (error) {
  console.error('Firebase initialization error:', error);
}