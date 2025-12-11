/**
 * Script to populate Firebase with test SOC codes and sponsor data
 * Run this script to set up test data for the SOC and sponsorship functionality
 */

import { getAdminDb } from '../firebase/admin';

const testSOCCodes = [
  {
    code: '2131',
    jobType: 'Software Engineer',
    relatedTitles: ['Software Developer', 'Full Stack Developer', 'Backend Developer', 'Frontend Developer', 'Software Engineer'],
    eligibility: 'High Skilled',
    searchTerms: ['software', 'engineer', 'developer', 'programming', 'coding', 'javascript', 'python', 'react', 'node.js'],
    rqfLevel: 'RQF Level 6',
    typicalSalary: 45000
  },
  {
    code: '2136',
    jobType: 'Data Analyst',
    relatedTitles: ['Data Scientist', 'Business Analyst', 'Data Engineer', 'Analytics Consultant', 'Data Analyst'],
    eligibility: 'Skilled',
    searchTerms: ['data', 'analyst', 'analytics', 'sql', 'python', 'statistics', 'visualization'],
    rqfLevel: 'RQF Level 6',
    typicalSalary: 38000
  },
  {
    code: '3543',
    jobType: 'Marketing Assistant',
    relatedTitles: ['Marketing Coordinator', 'Digital Marketing Assistant', 'Marketing Executive', 'Marketing Assistant'],
    eligibility: 'Ineligible',
    searchTerms: ['marketing', 'assistant', 'coordinator', 'digital marketing', 'social media'],
    rqfLevel: 'RQF Level 4',
    typicalSalary: 25000
  },
  {
    code: '3544',
    jobType: 'Marketing Manager',
    relatedTitles: ['Digital Marketing Manager', 'Brand Manager', 'Marketing Director', 'Marketing Manager'],
    eligibility: 'Skilled',
    searchTerms: ['marketing', 'manager', 'brand', 'digital marketing', 'campaign'],
    rqfLevel: 'RQF Level 6',
    typicalSalary: 42000
  },
  {
    code: '2231',
    jobType: 'Registered Nurse',
    relatedTitles: ['Nurse Practitioner', 'Staff Nurse', 'Clinical Nurse', 'Registered Nurse'],
    eligibility: 'High Skilled',
    searchTerms: ['nurse', 'nursing', 'healthcare', 'medical', 'clinical', 'registered nurse'],
    rqfLevel: 'RQF Level 6',
    typicalSalary: 35000
  },
  {
    code: '2413',
    jobType: 'Financial Analyst',
    relatedTitles: ['Investment Analyst', 'Finance Analyst', 'Business Analyst', 'Financial Analyst'],
    eligibility: 'Skilled',
    searchTerms: ['financial', 'analyst', 'finance', 'investment', 'banking', 'accounting'],
    rqfLevel: 'RQF Level 6',
    typicalSalary: 48000
  },
  {
    code: '2135',
    jobType: 'IT Project Manager',
    relatedTitles: ['Project Manager', 'Technical Project Manager', 'Scrum Master', 'IT Project Manager'],
    eligibility: 'Skilled',
    searchTerms: ['project', 'manager', 'agile', 'scrum', 'pmp', 'it project'],
    rqfLevel: 'RQF Level 6',
    typicalSalary: 55000
  },
  {
    code: '1121',
    jobType: 'Finance Director',
    relatedTitles: ['CFO', 'Chief Financial Officer', 'Finance Director', 'Financial Controller'],
    eligibility: 'High Skilled',
    searchTerms: ['finance', 'director', 'cfo', 'chief financial', 'executive'],
    rqfLevel: 'RQF Level 7',
    typicalSalary: 85000
  }
];

const testSponsors = [
  {
    name: 'Tech Solutions Ltd',
    searchName: 'tech solutions',
    city: 'London',
    searchCity: 'london',
    county: 'Greater London',
    typeRating: 'A',
    route: 'Skilled Worker',
    isActive: true,
    dateAdded: new Date().toISOString()
  },
  {
    name: 'Finance Corporation',
    searchName: 'finance corporation',
    city: 'Manchester',
    searchCity: 'manchester',
    county: 'Greater Manchester',
    typeRating: 'A',
    route: 'Skilled Worker',
    isActive: true,
    dateAdded: new Date().toISOString()
  },
  {
    name: 'NHS Trust',
    searchName: 'nhs trust',
    city: 'Birmingham',
    searchCity: 'birmingham',
    county: 'West Midlands',
    typeRating: 'A',
    route: 'Skilled Worker',
    isActive: true,
    dateAdded: new Date().toISOString()
  },
  {
    name: 'Digital Agency Ltd',
    searchName: 'digital agency',
    city: 'London',
    searchCity: 'london',
    county: 'Greater London',
    typeRating: 'B',
    route: 'Skilled Worker',
    isActive: true,
    dateAdded: new Date().toISOString()
  },
  {
    name: 'Analytics Partners',
    searchName: 'analytics partners',
    city: 'Cambridge',
    searchCity: 'cambridge',
    county: 'Cambridgeshire',
    typeRating: 'A',
    route: 'Skilled Worker',
    isActive: true,
    dateAdded: new Date().toISOString()
  },
  {
    name: 'Tech Corp International',
    searchName: 'tech corp',
    city: 'London',
    searchCity: 'london',
    county: 'Greater London',
    typeRating: 'A',
    route: 'Skilled Worker',
    isActive: true,
    dateAdded: new Date().toISOString()
  },
  {
    name: 'Healthcare Solutions',
    searchName: 'healthcare solutions',
    city: 'Manchester',
    searchCity: 'manchester',
    county: 'Greater Manchester',
    typeRating: 'A',
    route: 'Skilled Worker',
    isActive: true,
    dateAdded: new Date().toISOString()
  },
  {
    name: 'Innovation Labs',
    searchName: 'innovation labs',
    city: 'Bristol',
    searchCity: 'bristol',
    county: 'Bristol',
    typeRating: 'B',
    route: 'Skilled Worker',
    isActive: true,
    dateAdded: new Date().toISOString()
  }
];

async function populateTestData() {
  console.log('Starting to populate test data...');
  
  try {
    const db = getAdminDb();
    
    // Clear existing data
    console.log('Clearing existing test data...');
    const socSnapshot = await db.collection('socCodes').get();
    const sponsorSnapshot = await db.collection('sponsors').get();
    
    // Delete existing SOC codes
    for (const doc of socSnapshot.docs) {
      await doc.ref.delete();
    }
    
    // Delete existing sponsors
    for (const doc of sponsorSnapshot.docs) {
      await doc.ref.delete();
    }
    
    // Add SOC codes
    console.log('Adding SOC codes...');
    for (const socCode of testSOCCodes) {
      await db.collection('socCodes').add(socCode);
      console.log(`Added SOC code: ${socCode.code} - ${socCode.jobType}`);
    }
    
    // Add sponsors
    console.log('Adding sponsors...');
    for (const sponsor of testSponsors) {
      await db.collection('sponsors').add(sponsor);
      console.log(`Added sponsor: ${sponsor.name} (${sponsor.city})`);
    }
    
    console.log('Test data populated successfully!');
    console.log(`Added ${testSOCCodes.length} SOC codes`);
    console.log(`Added ${testSponsors.length} sponsors`);
    
    // Verify data was added
    const socCount = await db.collection('socCodes').count().get();
    const sponsorCount = await db.collection('sponsors').count().get();
    
    console.log('Database now contains:');
    console.log(`   - SOC codes: ${socCount.data().count}`);
    console.log(`   - Sponsors: ${sponsorCount.data().count}`);
    
  } catch (error) {
    console.error('Error populating test data:', error);
    throw error;
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  populateTestData()
    .then(() => {
      console.log('Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

export { populateTestData, testSOCCodes, testSponsors };
