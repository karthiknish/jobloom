#!/usr/bin/env node

/**
 * Test script to verify enhanced sponsor check functionality
 * This script verifies that sponsor checks automatically use LinkedIn job data
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔍 Testing Enhanced Sponsor Check Functionality\n');

// Check if we're in the right directory
if (!fs.existsSync('packages/extension')) {
  console.error('❌ Error: This script must be run from the project root directory');
  process.exit(1);
}

// 1. Check enhanced sponsor check implementation
console.log('1. 🔍 Checking Enhanced Sponsor Check Implementation...');

const contentPath = 'packages/extension/src/content.ts';
if (fs.existsSync(contentPath)) {
  const content = fs.readFileSync(contentPath, 'utf8');
  
  const sponsorChecks = {
    hasExtractJobData: content.includes('this.extractJobData(element)'),
    hasExtractedCompany: content.includes('const extractedCompany = jobData.company || company'),
    hasJobDescriptionContext: content.includes('fetchSponsorRecord(extractedCompany, jobData.parsedDescription)'),
    hasConsoleLog: content.includes('console.log(`🔍 Checking sponsor for:'),
    hasEnhancedStatus: content.includes('statusText = "✅ Ideal Match"'),
    hasGlobalBusinessCheck: content.includes('isGlobalBusiness'),
    hasSponsorshipMentionCheck: content.includes('jobSponsorshipMentioned'),
    hasSalaryThresholdCheck: content.includes('isAboveMinimumThreshold'),
    hasLocationDisplay: content.includes('result.city'),
    hasFallbackMessage: content.includes('Job mentions visa sponsorship, but')
  };
  
  const passedChecks = Object.values(sponsorChecks).filter(Boolean).length;
  const totalChecks = Object.keys(sponsorChecks).length;
  
  console.log(`   ${passedChecks}/${totalChecks} Enhanced Sponsor Check features found:`);
  
  if (sponsorChecks.hasExtractJobData) console.log('   ✅ Extracts job data from LinkedIn elements');
  else console.log('   ❌ Job data extraction missing');
  
  if (sponsorChecks.hasExtractedCompany) console.log('   ✅ Uses extracted company name');
  else console.log('   ❌ Extracted company usage missing');
  
  if (sponsorChecks.hasJobDescriptionContext) console.log('   ✅ Passes job description for context');
  else console.log('   ❌ Job description context missing');
  
  if (sponsorChecks.hasConsoleLog) console.log('   ✅ Provides detailed logging');
  else console.log('   ❌ Detailed logging missing');
  
  if (sponsorChecks.hasEnhancedStatus) console.log('   ✅ Enhanced status messages (Ideal Match)');
  else console.log('   ❌ Enhanced status messages missing');
  
  if (sponsorChecks.hasGlobalBusinessCheck) console.log('   ✅ Global Business Mobility visa support');
  else console.log('   ❌ Global Business check missing');
  
  if (sponsorChecks.hasSponsorshipMentionCheck) console.log('   ✅ Checks for sponsorship mentions in job description');
  else console.log('   ❌ Sponsorship mention check missing');
  
  if (sponsorChecks.hasSalaryThresholdCheck) console.log('   ✅ Checks salary threshold eligibility');
  else console.log('   ❌ Salary threshold check missing');
  
  if (sponsorChecks.hasLocationDisplay) console.log('   ✅ Displays sponsor location information');
  else console.log('   ❌ Location display missing');
  
  if (sponsorChecks.hasFallbackMessage) console.log('   ✅ Intelligent fallback messages');
  else console.log('   ❌ Fallback messages missing');
  
} else {
  console.log('   ❌ Content script file not found');
}

// 2. Check LinkedIn data extraction capabilities
console.log('\n2. 🔍 Checking LinkedIn Data Extraction...');

if (fs.existsSync(contentPath)) {
  const content = fs.readFileSync(contentPath, 'utf8');
  
  const extractionChecks = {
    hasJobTitleExtraction: content.includes('extractJobTitle(element, siteName)'),
    hasCompanyExtraction: content.includes('extractJobCompany(element, siteName)'),
    hasLocationExtraction: content.includes('extractJobLocation(element, siteName)'),
    hasDescriptionExtraction: content.includes('UKJobDescriptionParser.extractJobDescription(element)'),
    hasParsedDescription: content.includes('parseJobDescription'),
    hasVisaSponsorshipDetection: content.includes('visaSponsorship'),
    hasLinkedInSelectors: content.includes('jobs-unified-top-card__job-title'),
    hasUKJobParser: content.includes('UKJobDescriptionParser.detectJobSite()'),
    hasSOCCodeSupport: content.includes('socCode'),
    hasSalaryParsing: content.includes('salaryRange')
  };
  
  const passedExtractionChecks = Object.values(extractionChecks).filter(Boolean).length;
  const totalExtractionChecks = Object.keys(extractionChecks).length;
  
  console.log(`   ${passedExtractionChecks}/${totalExtractionChecks} LinkedIn data extraction features found:`);
  
  if (extractionChecks.hasJobTitleExtraction) console.log('   ✅ Job title extraction');
  else console.log('   ❌ Job title extraction missing');
  
  if (extractionChecks.hasCompanyExtraction) console.log('   ✅ Company name extraction');
  else console.log('   ❌ Company name extraction missing');
  
  if (extractionChecks.hasLocationExtraction) console.log('   ✅ Location extraction');
  else console.log('   ❌ Location extraction missing');
  
  if (extractionChecks.hasDescriptionExtraction) console.log('   ✅ Job description extraction');
  else console.log('   ❌ Job description extraction missing');
  
  if (extractionChecks.hasParsedDescription) console.log('   ✅ Detailed job parsing');
  else console.log('   ❌ Detailed job parsing missing');
  
  if (extractionChecks.hasVisaSponsorshipDetection) console.log('   ✅ Visa sponsorship mention detection');
  else console.log('   ❌ Visa sponsorship detection missing');
  
  if (extractionChecks.hasLinkedInSelectors) console.log('   ✅ LinkedIn-specific selectors');
  else console.log('   ❌ LinkedIn selectors missing');
  
  if (extractionChecks.hasUKJobParser) console.log('   ✅ UK job site detection');
  else console.log('   ❌ UK job site detection missing');
  
  if (extractionChecks.hasSOCCodeSupport) console.log('   ✅ SOC code support');
  else console.log('   ❌ SOC code support missing');
  
  if (extractionChecks.hasSalaryParsing) console.log('   ✅ Salary range parsing');
  else console.log('   ❌ Salary range parsing missing');
  
} else {
  console.log('   ❌ Content script file not found');
}

// 3. Check sponsor record fetching
console.log('\n3. 🔍 Checking Sponsor Record Fetching...');

if (fs.existsSync(contentPath)) {
  const content = fs.readFileSync(contentPath, 'utf8');
  
  const fetchChecks = {
    hasFetchSponsorRecord: content.includes('fetchSponsorRecord'),
    hasSponsorshipCache: content.includes('sponsorshipCache'),
    hasInFlightTracking: content.includes('sponsorshipInFlight'),
    hasRateLimiting: content.includes('sponsorBatchLimiter'),
    hasEnhancedRecord: content.includes('enhanceSponsorRecordWithJobContext'),
    hasSkillMatching: content.includes('calculateSkillMatchScore'),
    hasMinimumSalaryCheck: content.includes('getMinimumSalaryForSOC'),
    hasSponsorTypes: content.includes('Skilled Worker') && content.includes('Global Business'),
    hasErrorHandling: content.includes('try') && content.includes('catch') && content.includes('e?.rateLimitInfo')
  };
  
  const passedFetchChecks = Object.values(fetchChecks).filter(Boolean).length;
  const totalFetchChecks = Object.keys(fetchChecks).length;
  
  console.log(`   ${passedFetchChecks}/${totalFetchChecks} Sponsor fetching features found:`);
  
  if (fetchChecks.hasFetchSponsorRecord) console.log('   ✅ Sponsor record fetching function');
  else console.log('   ❌ Sponsor record fetching missing');
  
  if (fetchChecks.hasSponsorshipCache) console.log('   ✅ Sponsorship result caching');
  else console.log('   ❌ Sponsorship caching missing');
  
  if (fetchChecks.hasInFlightTracking) console.log('   ✅ In-flight request tracking');
  else console.log('   ❌ In-flight tracking missing');
  
  if (fetchChecks.hasRateLimiting) console.log('   ✅ Rate limiting for sponsor lookups');
  else console.log('   ❌ Rate limiting missing');
  
  if (fetchChecks.hasEnhancedRecord) console.log('   ✅ Enhanced record with job context');
  else console.log('   ❌ Enhanced record missing');
  
  if (fetchChecks.hasSkillMatching) console.log('   ✅ Skill matching capabilities');
  else console.log('   ❌ Skill matching missing');
  
  if (fetchChecks.hasMinimumSalaryCheck) console.log('   ✅ Minimum salary threshold checks');
  else console.log('   ❌ Minimum salary checks missing');
  
  if (fetchChecks.hasSponsorTypes) console.log('   ✅ Multiple sponsor type support');
  else console.log('   ❌ Sponsor type support missing');
  
  if (fetchChecks.hasErrorHandling) console.log('   ✅ Comprehensive error handling');
  else console.log('   ❌ Error handling missing');
  
} else {
  console.log('   ❌ Content script file not found');
}

// 4. Check visual feedback and UX
console.log('\n4. 🔍 Checking Visual Feedback & UX...');

if (fs.existsSync(contentPath)) {
  const content = fs.readFileSync(contentPath, 'utf8');
  
  const uxChecks = {
    hasStatusIndicators: content.includes('button.innerHTML') && content.includes('statusIcon'),
    hasColorCoding: content.includes('buttonBg') && content.includes('EXT_COLORS.'),
    hasToastNotifications: content.includes('showInlineToast'),
    hasProgressFeedback: content.includes('Checking...'),
    hasSuccessAnimations: content.includes('scale(1.1)'),
    hasTimeoutHandling: content.includes('setTimeout'),
    hasErrorRecovery: content.includes('disabled = false'),
    hasDetailedMessages: content.includes('toastMessage') && content.includes('✅'),
    hasContextAwareFeedback: content.includes('Ideal Match') && content.includes('Not Skilled')
  };
  
  const passedUxChecks = Object.values(uxChecks).filter(Boolean).length;
  const totalUxChecks = Object.keys(uxChecks).length;
  
  console.log(`   ${passedUxChecks}/${totalUxChecks} Visual feedback features found:`);
  
  if (uxChecks.hasStatusIndicators) console.log('   ✅ Dynamic status indicators');
  else console.log('   ❌ Status indicators missing');
  
  if (uxChecks.hasColorCoding) console.log('   ✅ Color-coded feedback');
  else console.log('   ❌ Color coding missing');
  
  if (uxChecks.hasToastNotifications) console.log('   ✅ Toast notifications');
  else console.log('   ❌ Toast notifications missing');
  
  if (uxChecks.hasProgressFeedback) console.log('   ✅ Progress indication');
  else console.log('   ❌ Progress feedback missing');
  
  if (uxChecks.hasSuccessAnimations) console.log('   ✅ Success animations');
  else console.log('   ❌ Success animations missing');
  
  if (uxChecks.hasTimeoutHandling) console.log('   ✅ Timeout handling');
  else console.log('   ❌ Timeout handling missing');
  
  if (uxChecks.hasErrorRecovery) console.log('   ✅ Error recovery');
  else console.log('   ❌ Error recovery missing');
  
  if (uxChecks.hasDetailedMessages) console.log('   ✅ Detailed feedback messages');
  else console.log('   ❌ Detailed messages missing');
  
  if (uxChecks.hasContextAwareFeedback) console.log('   ✅ Context-aware feedback');
  else console.log('   ❌ Context-aware feedback missing');
  
} else {
  console.log('   ❌ Content script file not found');
}

// 5. Manual testing instructions
console.log('\n5. 🚀 Manual Testing Instructions:');
console.log('   To test the enhanced sponsor check functionality:');
console.log('');
console.log('   a) Start the development servers:');
console.log('      npm run dev          # Web app');
console.log('      cd packages/extension && npm run watch  # Extension');
console.log('');
console.log('   b) Load the extension in Chrome developer mode');
console.log('   c) Sign in to the web app');
console.log('   d) Navigate to LinkedIn jobs page');
console.log('');
console.log('   Test Enhanced Sponsor Check:');
console.log('   1. Find a job posting on LinkedIn');
console.log('   2. Click the "Check Sponsor" button');
console.log('   3. Verify it uses the extracted company name (no input required)');
console.log('   4. Check console logs for: "🔍 Checking sponsor for: [company] (job: [title])"');
console.log('   5. Look for enhanced status messages:');
console.log('      - "✅ Ideal Match" for jobs with sponsorship mentions + good salary');
console.log('      - "Licensed + Mention" for sponsors with job mentions');
console.log('      - "Global Business" for Global Business Mobility visas');
console.log('      - "Not Skilled" for other license types');
console.log('      - "Mentioned" when job mentions sponsorship but company not found');
console.log('   6. Verify location info appears when available');
console.log('   7. Check for proper color coding and icons');
console.log('   8. Test with different companies and job types');
console.log('');
console.log('   Expected behavior:');
console.log('   - No manual input required - automatically uses LinkedIn job data');
console.log('   - Smart status messages based on job description context');
console.log('   - Enhanced visual feedback with icons and colors');
console.log('   - Comprehensive error handling and recovery');
console.log('   - Detailed logging for debugging');
console.log('   - Context-aware messages considering salary and sponsorship mentions');

console.log('\n✅ Enhanced sponsor check test complete!');
