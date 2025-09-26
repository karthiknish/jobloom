const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('./hireall-4f106-firebase-adminsdk-fbsvc-2e91c28cd6.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'hireall-4f106'
});

const db = admin.firestore();

async function migrateSponsors() {
  console.log('Starting sponsor data migration...');

  try {
    const sponsorsData = JSON.parse(fs.readFileSync('sponsors.json', 'utf8'));

    // Process in batches to avoid Firestore limits
    const batchSize = 500;
    let batch = db.batch();
    let count = 0;

    for (let i = 0; i < sponsorsData.length; i++) {
      const sponsor = sponsorsData[i];

      // Create a document reference
      const docRef = db.collection('sponsors').doc();

      // Add to batch
      batch.set(docRef, {
        ...sponsor,
        searchName: sponsor.name.toLowerCase(),
        searchCity: sponsor.city.toLowerCase(),
        searchCounty: sponsor.county.toLowerCase(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        isActive: true
      });

      count++;

      // Commit batch when it reaches the limit
      if (count % batchSize === 0) {
        await batch.commit();
        console.log(`Committed batch of ${batchSize} sponsors (total: ${count})`);
        batch = db.batch();
      }
    }

    // Commit remaining documents
    if (count % batchSize !== 0) {
      await batch.commit();
      console.log(`Committed final batch of ${count % batchSize} sponsors (total: ${count})`);
    }

    console.log('✅ Sponsor migration completed successfully!');

  } catch (error) {
    console.error('❌ Error migrating sponsors:', error);
  }
}

async function migrateSocCodes() {
  console.log('Starting SOC codes migration...');

  try {
    const socCodesData = JSON.parse(fs.readFileSync('soc-codes.json', 'utf8'));

    const batch = db.batch();
    let count = 0;

    for (const socCode of socCodesData) {
      const docRef = db.collection('socCodes').doc(socCode.code);

      batch.set(docRef, {
        ...socCode,
        searchTerms: [
          socCode.jobType.toLowerCase(),
          ...socCode.relatedTitles.map(title => title.toLowerCase())
        ].join(' '),
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      count++;
    }

    await batch.commit();
    console.log(`✅ SOC codes migration completed! (${count} codes)`);

  } catch (error) {
    console.error('❌ Error migrating SOC codes:', error);
  }
}

async function createIndexes() {
  console.log('Creating Firestore indexes...');

  // Note: You'll need to create composite indexes in Firebase Console for:
  // - sponsors: searchName, searchCity, searchCounty, route
  // - socCodes: eligibility, searchTerms

  console.log('⚠️  Please create the following indexes in Firebase Console:');
  console.log('1. sponsors collection: searchName (ASC), route (ASC)');
  console.log('2. sponsors collection: searchCity (ASC), route (ASC)');
  console.log('3. socCodes collection: eligibility (ASC), searchTerms (ASC)');
}

async function main() {
  try {
    await migrateSponsors();
    await migrateSocCodes();
    await createIndexes();
    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

main();
