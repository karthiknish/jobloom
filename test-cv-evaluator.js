#!/usr/bin/env node

/**
 * CV Evaluator and ATS Score Test
 *
 * This script tests the CV evaluator and ATS scoring functionality
 * using the resume PDF available in the project.
 *
 * Run with: node test-cv-evaluator.js
 */

const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

// Test configuration
const RESUME_PATH = path.join(__dirname, 'Karthik Nishanth Resume 2025 (1).pdf');
const TARGET_ROLE = 'software engineer';
const INDUSTRY = 'technology';

// Simplified ATS evaluation (based on the actual implementation)
function evaluateAtsCompatibilityFromText({ text, targetRole, industry }) {
  const safeText = text || "";
  const lowerText = safeText.toLowerCase();
  const words = safeText.split(/\s+/).filter(word => word.length > 0);
  const wordCount = words.length || 1;

  // Role and industry keywords
  const roleKeywords = {
    "software engineer": [
      "JavaScript", "TypeScript", "React", "Node.js", "Python", "APIs", "SQL", "Git",
      "Agile", "Unit Testing", "Next.js", "CSS", "Tailwind", "HTML", "REST", "GraphQL",
      "Docker", "AWS", "MongoDB", "PostgreSQL"
    ],
    "frontend developer": [
      "React", "TypeScript", "Next.js", "CSS", "Tailwind", "Accessibility", "Design Systems",
      "Performance Optimization", "Testing", "JavaScript", "Vue.js", "Angular", "HTML5"
    ],
    "backend engineer": [
      "Node.js", "TypeScript", "Databases", "API Design", "Microservices", "Testing",
      "CI/CD", "Cloud", "Security", "Scalability", "Python", "Java", "Go", "Rust"
    ]
  };

  const industryKeywords = {
    "technology": [
      "Software", "Development", "Engineering", "Programming", "Code", "Application",
      "System", "Platform", "Digital", "Tech", "IT", "Computer Science"
    ]
  };

  const targetKeywords = [
    ...(roleKeywords[targetRole] || []),
    ...(industryKeywords[industry] || [])
  ];

  // Find matched and missing keywords
  const matchedKeywords = targetKeywords.filter(keyword =>
    lowerText.includes(keyword.toLowerCase())
  );
  const missingKeywords = targetKeywords.filter(keyword =>
    !lowerText.includes(keyword.toLowerCase())
  );

  // Calculate keyword density
  const keywordOccurrences = matchedKeywords.reduce((count, keyword) => {
    const regex = new RegExp(`\\b${keyword.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`, "gi");
    const matches = safeText.match(regex);
    return count + (matches ? matches.length : 0);
  }, 0);

  const keywordDensity = Number(((keywordOccurrences / wordCount) * 100).toFixed(2));

  // Structure analysis
  const sections = ['experience', 'education', 'skills', 'projects', 'contact'];
  const foundSections = sections.filter(section =>
    lowerText.includes(section.toLowerCase())
  );
  const structureScore = Math.min(foundSections.length * 5, 25);

  // Contact information
  let contactScore = 0;
  const issues = [];
  const recommendations = [];
  const strengths = [];

  if (/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(safeText)) {
    contactScore += 7;
    strengths.push("Professional email address included");
  } else {
    issues.push("Add a professional email address to your header");
    recommendations.push("Include your email address in a clear, professional format");
  }

  if (/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/.test(safeText)) {
    contactScore += 5;
    strengths.push("Phone number included in ATS-friendly format");
  } else {
    issues.push("Include a phone number in an ATS-friendly format (e.g., 123-456-7890)");
    recommendations.push("Add your phone number using a standard format like (123) 456-7890");
  }

  // Keyword scoring
  const keywordScore = Math.min(matchedKeywords.length * 1.5, 25);

  // Readability scoring (simple heuristic)
  const sentences = safeText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgSentenceLength = sentences.length ? wordCount / sentences.length : wordCount;
  const readabilityScore = Math.max(0, Math.min(13, 13 - Math.floor(avgSentenceLength / 20)));

  // Overall score calculation
  const overallScore = Math.min(100, keywordScore + structureScore + contactScore + readabilityScore);

  // Generate recommendations based on analysis
  if (missingKeywords.length > 0) {
    recommendations.push(`Add ${Math.min(5, missingKeywords.length)} more relevant keywords: ${missingKeywords.slice(0, 3).join(', ')}`);
  }

  if (keywordDensity < 2) {
    recommendations.push("Increase keyword density by incorporating more industry-specific terms");
  } else if (keywordDensity > 8) {
    recommendations.push("Reduce keyword density to avoid appearing spammy to ATS systems");
  } else {
    strengths.push("Optimal keyword density for ATS compatibility");
  }

  if (structureScore < 15) {
    recommendations.push("Improve resume structure by clearly defining sections (Experience, Education, Skills)");
  } else {
    strengths.push("Well-structured resume with clear sections");
  }

  return {
    overallScore: Math.round(overallScore),
    keywordScore: Math.round(keywordScore),
    structureScore,
    contactScore,
    readabilityScore,
    keywordDensity,
    matchedKeywords,
    missingKeywords,
    issues,
    recommendations,
    strengths,
    wordCount,
    foundSections
  };
}

/**
 * Extract text from PDF file
 */
async function extractTextFromPDF(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw error;
  }
}

/**
 * Format ATS evaluation results for display
 */
function formatAtsResults(results) {
  const {
    overallScore,
    keywordScore,
    structureScore,
    contactScore,
    readabilityScore,
    keywordDensity,
    matchedKeywords,
    missingKeywords,
    issues,
    recommendations,
    strengths,
    wordCount,
    foundSections
  } = results;

  return {
    summary: {
      'Overall ATS Score': `${overallScore}/100`,
      'Keyword Score': `${keywordScore}/25`,
      'Structure Score': `${structureScore}/25`,
      'Contact Score': `${contactScore}/12`,
      'Readability Score': `${readabilityScore}/13`,
      'Keyword Density': `${keywordDensity}%`
    },
    keywords: {
      'Matched Keywords': matchedKeywords.length,
      'Missing Keywords': missingKeywords.length,
      'Top Matched': matchedKeywords.slice(0, 10),
      'Top Missing': missingKeywords.slice(0, 10)
    },
    issues: issues.slice(0, 5),
    recommendations: recommendations.slice(0, 5),
    strengths: strengths.slice(0, 5),
    stats: {
      'Word Count': wordCount,
      'Found Sections': foundSections.length
    }
  };
}

/**
 * Run CV evaluation test
 */
async function testCvEvaluator() {
  console.log("🔍 CV Evaluator and ATS Score Test");
  console.log("=====================================");
  console.log(`Target Role: ${TARGET_ROLE}`);
  console.log(`Industry: ${INDUSTRY}`);
  console.log(`Resume: ${path.basename(RESUME_PATH)}`);
  console.log("");

  try {
    // Step 1: Extract text from PDF
    console.log("📄 Extracting text from resume PDF...");
    const resumeText = await extractTextFromPDF(RESUME_PATH);
    console.log(`✅ Extracted ${resumeText.length} characters of text`);
    console.log("");

    // Show first 500 characters as preview
    console.log("📋 Resume Text Preview (first 500 chars):");
    console.log("-".repeat(50));
    console.log(resumeText.substring(0, 500) + (resumeText.length > 500 ? "..." : ""));
    console.log("-".repeat(50));
    console.log("");

    // Step 2: Run ATS evaluation
    console.log("🤖 Running ATS evaluation...");
    const atsResults = evaluateAtsCompatibilityFromText({
      text: resumeText,
      targetRole: TARGET_ROLE,
      industry: INDUSTRY
    });

    console.log("✅ ATS evaluation completed");
    console.log("");

    // Step 3: Format and display results
    const formattedResults = formatAtsResults(atsResults);

    console.log("📊 ATS EVALUATION RESULTS");
    console.log("========================");

    console.log("\n🎯 OVERALL SCORES:");
    Object.entries(formattedResults.summary).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });

    console.log("\n📈 STATISTICS:");
    Object.entries(formattedResults.stats).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });

    console.log("\n🔑 KEYWORD ANALYSIS:");
    Object.entries(formattedResults.keywords).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        console.log(`   ${key}: ${value.join(', ')}`);
      } else {
        console.log(`   ${key}: ${value}`);
      }
    });

    console.log("\n⚠️  TOP ISSUES:");
    formattedResults.issues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue}`);
    });

    console.log("\n💡 RECOMMENDATIONS:");
    formattedResults.recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });

    console.log("\n✅ STRENGTHS:");
    formattedResults.strengths.forEach((strength, index) => {
      console.log(`   ${index + 1}. ${strength}`);
    });

    console.log("\n" + "=".repeat(50));
    console.log("🏆 FINAL VERDICT");
    console.log("=".repeat(50));

    const overallScore = atsResults.overallScore;
    let verdict = "";
    let color = "";

    if (overallScore >= 85) {
      verdict = "EXCELLENT - Your resume should perform very well in ATS systems!";
      color = "🟢";
    } else if (overallScore >= 70) {
      verdict = "GOOD - Your resume is ATS-friendly with room for improvement.";
      color = "🟡";
    } else if (overallScore >= 55) {
      verdict = "FAIR - Your resume needs significant ATS optimization.";
      color = "🟠";
    } else {
      verdict = "POOR - Your resume requires major revisions for ATS compatibility.";
      color = "🔴";
    }

    console.log(`${color} Overall Score: ${overallScore}/100`);
    console.log(`Verdict: ${verdict}`);

  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

// Run the test
testCvEvaluator().catch(error => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
});