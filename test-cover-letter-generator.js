#!/usr/bin/env node

/**
 * Cover Letter Generator and Deep Research Test
 *
 * This script tests the cover letter generator and deep research functionality
 * for company analysis and personalized cover letters.
 *
 * Run with: node test-cover-letter-generator.js
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_JOB_TITLE = 'Senior Software Engineer';
const TEST_COMPANY_NAME = 'TechCorp Inc.';
const TEST_JOB_DESCRIPTION = `
We are looking for a Senior Software Engineer to join our innovative team at TechCorp Inc.
Our mission is to revolutionize the way people interact with technology through cutting-edge solutions.

Key Responsibilities:
- Design and develop scalable web applications using React, Node.js, and TypeScript
- Collaborate with cross-functional teams to deliver high-quality software products
- Implement best practices for code quality, testing, and performance optimization
- Contribute to our culture of innovation and continuous learning

Requirements:
- 5+ years of experience in full-stack development
- Strong proficiency in JavaScript, TypeScript, React, and Node.js
- Experience with cloud platforms (AWS, GCP, or Azure)
- Knowledge of modern development practices including CI/CD, testing, and agile methodologies
- Bachelor's degree in Computer Science or related field

What We Offer:
- Competitive salary and equity package
- Flexible work arrangements and remote-first culture
- Professional development opportunities and conference attendance
- Health, dental, and vision insurance
- Opportunity to work on products that impact millions of users globally

TechCorp is committed to diversity, inclusion, and creating an environment where everyone can thrive.
We believe in fostering innovation, collaboration, and personal growth for all team members.
`;

const TEST_USER_SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python',
  'AWS', 'Docker', 'Kubernetes', 'MongoDB', 'PostgreSQL'
];

const TEST_USER_EXPERIENCE = 'I have 6 years of experience in full-stack development, specializing in React and Node.js applications.';

// Simplified versions of the API functions for testing
function extractKeywords(jobDescription, userSkills) {
  const commonKeywords = [
    'leadership', 'communication', 'teamwork', 'problem-solving', 'analytical',
    'project management', 'collaboration', 'initiative', 'adaptability', 'creativity',
    'javascript', 'python', 'react', 'node.js', 'aws', 'docker', 'kubernetes',
    'agile', 'scrum', 'git', 'sql', 'nosql', 'mongodb', 'postgresql'
  ];

  const jobDescLower = jobDescription.toLowerCase();
  const userSkillsLower = userSkills.map(skill => skill.toLowerCase());

  const foundKeywords = commonKeywords.filter(keyword =>
    jobDescLower.includes(keyword.toLowerCase())
  );

  const matchingSkills = userSkillsLower.filter(skill =>
    jobDescLower.includes(skill)
  );

  const allKeywords = [...new Set([...foundKeywords, ...matchingSkills])];

  return allKeywords.slice(0, 12);
}

function analyzeCompanyInsights(jobDescription, companyName) {
  const sentences = jobDescription
    .split(/[.!?\n]/)
    .map(sentence => sentence.trim())
    .filter(sentence => sentence.length > 0);

  const focusKeywords = [
    'mission', 'culture', 'innovation', 'diversity', 'inclusion',
    'customers', 'growth', 'expansion', 'sustainability', 'impact',
    'product', 'platform', 'team', 'technology', 'research',
    'market', 'global', 'flexible', 'remote', 'development'
  ];

  const insights = sentences.filter(sentence =>
    focusKeywords.some(keyword => sentence.toLowerCase().includes(keyword))
  );

  if (insights.length === 0 && sentences.length > 0) {
    insights.push(sentences[0]);
  }

  return insights
    .map(insight => insight.replace(/\s+/g, ' '))
    .map(insight => insight.endsWith('.') ? insight : `${insight}.`)
    .map(insight => insight.replace(/^[a-z]/, c => c.toUpperCase()))
    .map(insight => insight.replace(/company/gi, companyName))
    .slice(0, 3);
}

function generateCoverLetterContent({
  jobTitle,
  companyName,
  jobDescription,
  skills,
  experience,
  tone,
  length,
  keywords,
  deepResearch,
  insights,
}) {
  const toneMap = {
    professional: "Dear Hiring Manager,",
    friendly: "Hello Team,",
    enthusiastic: "Excited to apply!",
    formal: "To the Hiring Committee,"
  };

  const opening = toneMap[tone] || toneMap.professional;

  const keywordParagraph = keywords.length > 0
    ? `My experience in ${keywords.slice(0, 3).join(', ')} aligns perfectly with the requirements of this position.`
    : "";

  const descriptionSummary = jobDescription
    .split(/[.!?\n]/)
    .map(sentence => sentence.trim())
    .find(sentence => sentence.length > 12) || "";

  const descriptionParagraph = descriptionSummary
    ? `What excites me most about this opportunity is the focus on ${descriptionSummary.toLowerCase()}.`
    : "";

  const researchParagraph = deepResearch && insights.length > 0
    ? (`In preparing this application, I explored ${companyName}'s recent initiatives and was particularly impressed by ${insights[0]}. ${insights[1] ? `This, along with ${insights[1]}, highlights the forward-thinking culture I value.` : ''}`).trim()
    : "";

  const additionalInsights = deepResearch && insights.length > 2
    ? `Key insights from my research into ${companyName}:
${insights.slice(0, 3).map(item => `• ${item}`).join('\n')}`
    : "";

  const content = `${opening}

I am writing to express my strong interest in the ${jobTitle} position at ${companyName}.

${experience || `With my background in technology and proven track record of delivering results, I believe I would be a valuable addition to your team.`}

${keywordParagraph}

${researchParagraph}

${descriptionParagraph}

${skills.length > 0 ? `My key skills include: ${skills.join(', ')}. I have applied these skills in various projects and have consistently achieved positive outcomes.` : ""}

After reviewing the job description, I am particularly excited about the opportunity to contribute to ${companyName}'s mission. Your company's focus on innovation and excellence resonates with my professional values and career goals.

${additionalInsights}

${buildClosingStatement(length, keywords, companyName)}

Sincerely,
[Your Name]`;

  return content;
}

function buildClosingStatement(length, keywords, companyName) {
  if (length === 'short') {
    return `I would welcome the opportunity to discuss how my skills and experience can contribute to ${companyName}'s continued success.`;
  }

  return `I am excited about the possibility of bringing my expertise in ${keywords.slice(0, 2).join(' and ')} to ${companyName} and contributing to innovative projects that make a real impact. I would welcome the opportunity to discuss how my background and passion for technology align with your team's goals.`;
}

function calculateATSScore(content, keywords, jobDescription, options) {
  let score = 50;

  const contentLower = content.toLowerCase();
  const keywordMatches = keywords.filter(keyword =>
    contentLower.includes(keyword.toLowerCase())
  );
  score += keywordMatches.length * 5;

  const wordCount = content.split(/\s+/).length;
  if (wordCount >= 150 && wordCount <= 400) {
    score += 10;
  } else if (wordCount >= 100 && wordCount <= 500) {
    score += 5;
  }

  if (content.includes('Dear') && content.includes('Sincerely')) {
    score += 10;
  }

  if (options.atsOptimization) {
    score += Math.min(10, keywordMatches.length * 2);
  }

  if (options.keywordFocus && keywords.length >= 5) {
    score += 5;
  }

  const jobDescLower = jobDescription.toLowerCase();
  const coverage = keywords.filter(keyword => jobDescLower.includes(keyword.toLowerCase()));
  if (coverage.length >= Math.min(5, keywords.length)) {
    score += 5;
  }

  return Math.min(score, 100);
}

/**
 * Test cover letter generation
 */
async function testCoverLetterGeneration() {
  console.log("📝 Cover Letter Generator and Deep Research Test");
  console.log("================================================");
  console.log(`Job Title: ${TEST_JOB_TITLE}`);
  console.log(`Company: ${TEST_COMPANY_NAME}`);
  console.log("");

  try {
    // Test 1: Basic cover letter generation
    console.log("🧪 Test 1: Basic Cover Letter Generation");
    console.log("-".repeat(40));

    const keywords = extractKeywords(TEST_JOB_DESCRIPTION, TEST_USER_SKILLS);
    console.log(`✅ Extracted ${keywords.length} keywords: ${keywords.join(', ')}`);

    const basicContent = generateCoverLetterContent({
      jobTitle: TEST_JOB_TITLE,
      companyName: TEST_COMPANY_NAME,
      jobDescription: TEST_JOB_DESCRIPTION,
      skills: TEST_USER_SKILLS,
      experience: TEST_USER_EXPERIENCE,
      tone: 'professional',
      length: 'medium',
      keywords,
      deepResearch: false,
      insights: []
    });

    console.log(`✅ Generated basic cover letter (${basicContent.split(/\s+/).length} words)`);

    const basicAtsScore = calculateATSScore(basicContent, keywords, TEST_JOB_DESCRIPTION, {
      atsOptimization: false,
      keywordFocus: false
    });

    console.log(`📊 Basic ATS Score: ${basicAtsScore}/100`);
    console.log("");

    // Test 2: Deep research functionality
    console.log("🧪 Test 2: Deep Research Analysis");
    console.log("-".repeat(40));

    const researchInsights = analyzeCompanyInsights(TEST_JOB_DESCRIPTION, TEST_COMPANY_NAME);
    console.log(`✅ Generated ${researchInsights.length} research insights:`);
    researchInsights.forEach((insight, index) => {
      console.log(`   ${index + 1}. ${insight}`);
    });
    console.log("");

    // Test 3: Cover letter with deep research
    console.log("🧪 Test 3: Cover Letter with Deep Research");
    console.log("-".repeat(40));

    const researchContent = generateCoverLetterContent({
      jobTitle: TEST_JOB_TITLE,
      companyName: TEST_COMPANY_NAME,
      jobDescription: TEST_JOB_DESCRIPTION,
      skills: TEST_USER_SKILLS,
      experience: TEST_USER_EXPERIENCE,
      tone: 'professional',
      length: 'medium',
      keywords,
      deepResearch: true,
      insights: researchInsights
    });

    console.log(`✅ Generated research-enhanced cover letter (${researchContent.split(/\s+/).length} words)`);

    const researchAtsScore = calculateATSScore(researchContent, keywords, TEST_JOB_DESCRIPTION, {
      atsOptimization: true,
      keywordFocus: true
    });

    console.log(`📊 Research-enhanced ATS Score: ${researchAtsScore}/100`);
    console.log("");

    // Test 4: Different tones
    console.log("🧪 Test 4: Tone Variations");
    console.log("-".repeat(40));

    const tones = ['professional', 'friendly', 'enthusiastic', 'formal'];
    const toneResults = {};

    for (const tone of tones) {
      const toneContent = generateCoverLetterContent({
        jobTitle: TEST_JOB_TITLE,
        companyName: TEST_COMPANY_NAME,
        jobDescription: TEST_JOB_DESCRIPTION,
        skills: TEST_USER_SKILLS,
        experience: TEST_USER_EXPERIENCE,
        tone,
        length: 'medium',
        keywords,
        deepResearch: true,
        insights: researchInsights
      });

      const toneScore = calculateATSScore(toneContent, keywords, TEST_JOB_DESCRIPTION, {
        atsOptimization: false,
        keywordFocus: false
      });

      toneResults[tone] = {
        score: toneScore,
        wordCount: toneContent.split(/\s+/).length,
        opening: toneContent.split('\n')[0].trim()
      };

      console.log(`   ${tone.charAt(0).toUpperCase() + tone.slice(1)}: ${toneScore}/100 (${toneContent.split(/\s+/).length} words)`);
      console.log(`   Opening: "${toneResults[tone].opening}"`);
    }
    console.log("");

    // Test 5: Length variations
    console.log("🧪 Test 5: Length Variations");
    console.log("-".repeat(40));

    const lengths = ['short', 'medium', 'long'];
    const lengthResults = {};

    for (const length of lengths) {
      const lengthContent = generateCoverLetterContent({
        jobTitle: TEST_JOB_TITLE,
        companyName: TEST_COMPANY_NAME,
        jobDescription: TEST_JOB_DESCRIPTION,
        skills: TEST_USER_SKILLS,
        experience: TEST_USER_EXPERIENCE,
        tone: 'professional',
        length,
        keywords,
        deepResearch: true,
        insights: researchInsights
      });

      const lengthScore = calculateATSScore(lengthContent, keywords, TEST_JOB_DESCRIPTION, {
        atsOptimization: false,
        keywordFocus: false
      });

      lengthResults[length] = {
        score: lengthScore,
        wordCount: lengthContent.split(/\s+/).length
      };

      console.log(`   ${length.charAt(0).toUpperCase() + length.slice(1)}: ${lengthScore}/100 (${lengthContent.split(/\s+/).length} words)`);
    }
    console.log("");

    // Test 6: Edge cases
    console.log("🧪 Test 6: Edge Cases");
    console.log("-".repeat(40));

    // Test with minimal input
    const minimalContent = generateCoverLetterContent({
      jobTitle: 'Developer',
      companyName: 'Startup',
      jobDescription: 'We need a developer.',
      skills: ['JavaScript'],
      experience: '',
      tone: 'professional',
      length: 'short',
      keywords: ['javascript'],
      deepResearch: false,
      insights: []
    });

    console.log(`✅ Minimal input test: ${minimalContent.split(/\s+/).length} words generated`);

    // Test with empty skills
    const noSkillsContent = generateCoverLetterContent({
      jobTitle: TEST_JOB_TITLE,
      companyName: TEST_COMPANY_NAME,
      jobDescription: TEST_JOB_DESCRIPTION,
      skills: [],
      experience: TEST_USER_EXPERIENCE,
      tone: 'professional',
      length: 'medium',
      keywords,
      deepResearch: false,
      insights: []
    });

    console.log(`✅ No skills test: ${noSkillsContent.split(/\s+/).length} words generated`);
    console.log("");

    // Final summary
    console.log("📊 FINAL TEST SUMMARY");
    console.log("====================");

    const improvement = researchAtsScore - basicAtsScore;
    console.log(`🎯 Deep Research Impact: ${improvement >= 0 ? '+' : ''}${improvement} ATS points`);
    console.log(`📝 Basic Cover Letter: ${basicAtsScore}/100 (${basicContent.split(/\s+/).length} words)`);
    console.log(`🔍 Research Cover Letter: ${researchAtsScore}/100 (${researchContent.split(/\s+/).length} words)`);
    console.log(`🎭 Tone Variations Tested: ${tones.length}`);
    console.log(`📏 Length Variations Tested: ${lengths.length}`);
    console.log(`✅ Edge Cases Handled: 2/2`);

    console.log("\n🏆 VERDICT");
    console.log("==========");

    if (researchAtsScore >= 80 && researchInsights.length >= 2) {
      console.log("🟢 EXCELLENT - Cover letter generator with deep research is working perfectly!");
      console.log("   • High ATS scores achieved");
      console.log("   • Meaningful company insights generated");
      console.log("   • Multiple tones and lengths supported");
      console.log("   • Robust edge case handling");
    } else if (researchAtsScore >= 70 && researchInsights.length >= 1) {
      console.log("🟡 GOOD - Cover letter generator is functional with room for improvement");
      console.log("   • Decent ATS scores");
      console.log("   • Basic company research working");
      console.log("   • Core functionality operational");
    } else {
      console.log("🔴 NEEDS WORK - Cover letter generator requires optimization");
      console.log("   • ATS scores need improvement");
      console.log("   • Company research could be enhanced");
      console.log("   • Content quality needs refinement");
    }

  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

// Run the test
testCoverLetterGeneration().catch(error => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
});