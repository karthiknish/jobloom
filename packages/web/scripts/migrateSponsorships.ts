import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { ConvexHttpClient } from 'convex/browser';
import { config } from 'dotenv';
import { api } from '../convex/_generated/api';

config({ path: '.env.local' });

const firebaseProjectId = process.env.FIREBASE_PROJECT_ID;
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "https://spotted-viper-256.convex.cloud";

if (!firebaseProjectId) {
  console.error('Error: FIREBASE_PROJECT_ID not set in .env.local');
  process.exit(1);
}

if (!convexUrl) {
  console.error('Error: NEXT_PUBLIC_CONVEX_URL not set in .env.local');
  process.exit(1);
}

console.log(`Firebase Project ID: ${firebaseProjectId}`);
console.log(`Convex URL: ${convexUrl}`);

let convexClient: ConvexHttpClient | null = null;

function getConvexClient(): ConvexHttpClient {
  if (!convexClient) {
    convexClient = new ConvexHttpClient(convexUrl);
  }
  return convexClient;
}

async function initializeFirebaseAdmin() {
  const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  
  if (serviceAccountBase64) {
    try {
      const buf = Buffer.from(serviceAccountBase64, 'base64');
      const serviceAccount = JSON.parse(buf.toString('utf8'));
      console.log('Using Firebase service account from FIREBASE_SERVICE_ACCOUNT_BASE64');
      return initializeApp({
        credential: cert(serviceAccount),
        projectId: firebaseProjectId,
      });
    } catch (e: any) {
      console.warn('Failed to parse FIREBASE_SERVICE_ACCOUNT_BASE64:', e.message);
    }
  }
  
  console.log('Using Application Default Credentials');
  return initializeApp({
    projectId: firebaseProjectId,
  });
}

interface FirebaseSponsorship {
  id: string;
  name: string;
  city: string;
  county: string;
  createdAt: string;
  isActive: boolean;
  route: string;
  searchCity: string;
  searchCounty: string;
  searchName: string;
  typeRating: string;
}

async function migrateSponsorships() {
  console.log("\n==========================================");
  console.log("Starting sponsorship migration from Firebase to Convex");
  console.log("==========================================\n");

  try {
    const firebaseApp = await initializeFirebaseAdmin();
    const firestore = getFirestore(firebaseApp);
    
    const convex = getConvexClient();
    const batchSize = 200;
    const totalLimit = 20000;
    let successCount = 0;
    let failureCount = 0;
    let skipCount = 0;
    let lastDoc: any = null;
    let batchNum = 0;
    
    console.log(`\nMigrating in batches of ${batchSize}...\n`);

    while (true) {
      let query = firestore
        .collection('sponsors')
        .orderBy('createdAt', 'asc')
        .limit(batchSize);

      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }

      const snapshot = await query.get();
      
      if (snapshot.empty) {
        console.log('No more documents to migrate.');
        break;
      }

      batchNum++;
      const sponsors: FirebaseSponsorship[] = [];
      let sampleShown = false;

      snapshot.forEach((doc: any) => {
        const data = doc.data();
        sponsors.push({ id: doc.id, ...data } as FirebaseSponsorship);
        if (!sampleShown) {
          console.log('\nSample document structure from batch:');
          console.log(JSON.stringify({ id: doc.id, ...data }, null, 2));
          sampleShown = true;
        }
      });

      console.log(`Batch ${batchNum}: ${sponsors.length} sponsors fetched`);

      for (const sponsor of sponsors) {
        try {
          const domain = sponsor.name
            ?.toLowerCase()
            .replace(/[^a-z0-9.-]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 100);

          if (!domain || domain.length < 3) {
            console.log(`  Skipping ${sponsor.id}: invalid name/domain: "${sponsor.name}"`);
            skipCount++;
            continue;
          }

          await convex.mutation(api.sponsorships.createSponsorship, {
            domain,
            companyName: sponsor.name,
            isSponsored: sponsor.isActive ?? true,
            sponsorshipType: sponsor.route,
            notes: sponsor.typeRating,
            city: sponsor.city || '',
            county: sponsor.county || '',
            searchCity: sponsor.searchCity || '',
            searchCounty: sponsor.searchCounty || '',
            searchName: sponsor.searchName || '',
            lastChecked: sponsor.createdAt ? Date.parse(sponsor.createdAt) : Date.now(),
            lastUpdated: Date.now(),
            createdAt: sponsor.createdAt ? Date.parse(sponsor.createdAt) : Date.now(),
          });
          successCount++;
        } catch (error: any) {
          if (error.message && error.message.includes('already exists')) {
            skipCount++;
          } else {
            console.error(`  Failed to migrate ${sponsor.id}:`, error.message || error);
            failureCount++;
          }
        }
      }

      lastDoc = snapshot.docs[snapshot.docs.length - 1];
      const totalProcessed = successCount + skipCount + failureCount;
      console.log(`Batch ${batchNum} complete. Processed so far: ${totalProcessed}`);

      if (totalProcessed >= totalLimit) {
        console.log(`Reached limit of ${totalLimit}. Stopping.`);
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log("\n==========================================");
    console.log("Migration Complete!");
    console.log("==========================================");
    console.log(`Successfully migrated: ${successCount}`);
    console.log(`Skipped: ${skipCount}`);
    console.log(`Failed: ${failureCount}`);
    console.log(`Total processed: ${successCount + skipCount + failureCount}`);
    console.log("==========================================\n");

    return {
      success: successCount,
      skipped: skipCount,
      failed: failureCount,
    };
    
  } catch (error: any) {
    console.error('\n==========================================');
    console.error('Migration Failed!');
    console.error('==========================================');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

migrateSponsorships()
  .then((result) => {
    console.log('\nMigration completed successfully!');
    console.log('Summary:', JSON.stringify(result, null, 2));
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nMigration failed with error:', error);
    process.exit(1);
  });
