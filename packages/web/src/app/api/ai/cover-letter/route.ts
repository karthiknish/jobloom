import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/firebase/admin";
import { verifySessionFromRequest } from "@/lib/auth/session";
import { getAdminDb } from "@/firebase/admin";

export async function POST(request: NextRequest) {
  try {
    const decodedToken = await verifySessionFromRequest(request);

    if (!decodedToken?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is premium
    const db = getAdminDb();
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();

    if (!userData || userData.subscription?.tier === 'free') {
      return NextResponse.json({ 
        error: 'Premium subscription required for AI cover letter generation' 
      }, { status: 403 });
    }

    const {
      jobTitle,
      companyName,
      jobDescription,
      skills,
      experience,
      tone,
      length,
      atsOptimization,
      keywordFocus,
      deepResearch = false,
    } = await request.json();

    // Validate required fields
    if (!jobTitle || !companyName || !jobDescription) {
      return NextResponse.json({ 
        error: 'Missing required fields: jobTitle, companyName, jobDescription' 
      }, { status: 400 });
    }

    // Simulate AI processing (in production, this would call an AI service)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Extract keywords from job description (simplified)
    const normalizedSkills = Array.isArray(skills) ? skills : [];
    const keywords = extractKeywords(jobDescription, normalizedSkills);
    const researchInsights = deepResearch ? analyzeCompanyInsights(jobDescription, companyName) : [];
    
    // Generate cover letter content
    const content = generateCoverLetterContent({
      jobTitle,
      companyName,
      jobDescription,
      skills: normalizedSkills,
      experience,
      tone,
      length,
      keywords,
      deepResearch,
      insights: researchInsights,
    });

    // Calculate ATS score
    const atsScore = calculateATSScore(content, keywords, jobDescription, {
      atsOptimization: Boolean(atsOptimization),
      keywordFocus: Boolean(keywordFocus),
    });

    // Generate improvement suggestions
    const improvements = generateImprovements(
      content,
      keywords,
      atsScore,
      deepResearch,
      researchInsights,
      {
        atsOptimization: Boolean(atsOptimization),
        keywordFocus: Boolean(keywordFocus),
      }
    );

    const wordCount = content.split(/\s+/).length;

    const result = {
      content,
      atsScore,
      keywords: keywords.slice(0, 8), // Top 8 keywords
      improvements,
      tone,
      wordCount,
      deepResearch,
      researchInsights,
      generatedAt: new Date().toISOString()
    };

    // Store in user's cover letter history
    await db.collection('users').doc(decodedToken.uid).collection('coverLetters').add({
      ...result,
      jobTitle,
      companyName,
      createdAt: new Date().toISOString()
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Cover letter generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate cover letter' },
      { status: 500 }
    );
  }
}

function extractKeywords(jobDescription: string, userSkills: string[]): string[] {
  // Common ATS keywords for tech jobs
  const commonKeywords = [
    'leadership', 'communication', 'teamwork', 'problem-solving', 'analytical',
    'project management', 'collaboration', 'initiative', 'adaptability', 'creativity',
    'javascript', 'python', 'react', 'node.js', 'aws', 'docker', 'kubernetes',
    'agile', 'scrum', 'git', 'sql', 'nosql', 'mongodb', 'postgresql'
  ];

  const jobDescLower = jobDescription.toLowerCase();
  const userSkillsLower = userSkills.map(skill => skill.toLowerCase());

  // Find keywords in job description
  const foundKeywords = commonKeywords.filter(keyword => 
    jobDescLower.includes(keyword.toLowerCase())
  );

  // Add user skills that match
  const matchingSkills = userSkillsLower.filter(skill => 
    jobDescLower.includes(skill)
  );

  // Combine and remove duplicates
  const allKeywords = [...new Set([...foundKeywords, ...matchingSkills])];

  return allKeywords.slice(0, 12);
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
}: {
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  skills: string[];
  experience: string;
  tone: string;
  length: string;
  keywords: string[];
  deepResearch: boolean;
  insights: string[];
}): string {
  const toneMap = {
    professional: "Dear Hiring Manager,",
    friendly: "Hello Team,",
    enthusiastic: "Excited to apply!",
    formal: "To the Hiring Committee,"
  };

  const opening = toneMap[tone as keyof typeof toneMap] || toneMap.professional;

  // Generate content based on keywords and job description
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

function calculateATSScore(
  content: string,
  keywords: string[],
  jobDescription: string,
  options: { atsOptimization: boolean; keywordFocus: boolean }
): number {
  let score = 50; // Base score

  // Keyword matching
  const contentLower = content.toLowerCase();
  const keywordMatches = keywords.filter(keyword => 
    contentLower.includes(keyword.toLowerCase())
  );
  score += keywordMatches.length * 5;

  // Length optimization
  const wordCount = content.split(/\s+/).length;
  if (wordCount >= 150 && wordCount <= 400) {
    score += 10;
  } else if (wordCount >= 100 && wordCount <= 500) {
    score += 5;
  }

  // Structure analysis
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

  // Cap at 100
  return Math.min(score, 100);
}

function generateImprovements(
  content: string,
  keywords: string[],
  atsScore: number,
  deepResearch: boolean,
  insights: string[],
  options: { atsOptimization: boolean; keywordFocus: boolean }
): string[] {
  const improvements: string[] = [];

  if (atsScore < 70) {
    improvements.push("Add more keywords from the job description to improve ATS compatibility");
  }

  if (!content.includes('quantifiable') && !content.includes('numbers')) {
    improvements.push("Include specific metrics and quantifiable achievements");
  }

  if (keywords.length < 5) {
    improvements.push("Incorporate more relevant skills and keywords");
  }

  if (!deepResearch && (!content.includes('company') || !content.includes('mission'))) {
    improvements.push("Add more company-specific information to show research");
  }

  if (deepResearch && insights.length < 2) {
    improvements.push("Expand on specific company initiatives uncovered during research");
  }

  if (!options.keywordFocus) {
    improvements.push("Enable keyword focus to emphasize the most relevant skills");
  }

  if (!options.atsOptimization) {
    improvements.push("Turn on ATS optimization to better tailor the output for screening systems");
  }

  const wordCount = content.split(/\s+/).length;
  if (wordCount < 150) {
    improvements.push("Consider expanding your cover letter to provide more detail");
  } else if (wordCount > 500) {
    improvements.push("Consider making your cover letter more concise");
  }

  return improvements.slice(0, 4); // Return top 4 suggestions
}

function buildClosingStatement(length: string, keywords: string[], companyName: string): string {
  const primaryKeyword = keywords[0] ? keywords[0].toLowerCase() : "delivering impactful solutions";

  if (length === "concise") {
    return "Thank you for your consideration. I look forward to discussing this opportunity soon.";
  }

  if (length === "detailed") {
    return `I would love to walk you through my experience in ${primaryKeyword} and share how it can accelerate ${companyName}'s goals.`;
  }

  return "I would welcome the opportunity to discuss how my experience and skills align with your needs. Thank you for your time and consideration.";
}

function analyzeCompanyInsights(jobDescription: string, companyName: string): string[] {
  const sentences = jobDescription
    .split(/[.!?\n]/)
    .map(sentence => sentence.trim())
    .filter(sentence => sentence.length > 0);

  const focusKeywords = [
    'mission',
    'culture',
    'innovation',
    'diversity',
    'inclusion',
    'customers',
    'growth',
    'expansion',
    'sustainability',
    'impact',
    'product',
    'platform',
    'team',
    'technology',
    'research',
    'market',
    'global'
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
