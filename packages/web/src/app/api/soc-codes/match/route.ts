import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/firebase/admin';
import { verifySessionFromRequest } from '@/lib/auth/session';

/**
 * Fuzzy Matching utilities - Server-side implementation
 * Moved from extension's enhancedJobParser.ts for centralized SOC matching
 */
class FuzzyMatcher {
  /**
   * Calculate Levenshtein distance between two strings
   */
  static levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Calculate similarity ratio (0-1) between two strings
   */
  static similarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Extract meaningful words from text, removing stop words
   */
  static extractWords(text: string): string[] {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
      'with', 'by', 'as', 'from', 'is', 'was', 'are', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
      'may', 'might', 'must', 'can', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
      'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their',
      'this', 'that', 'these', 'those', 'who', 'which', 'what', 'when', 'where', 'why'
    ]);

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));
  }

  /**
   * Calculate word overlap (Jaccard similarity) between two texts
   */
  static wordOverlap(text1: string, text2: string): number {
    const words1 = new Set(this.extractWords(text1));
    const words2 = new Set(this.extractWords(text2));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }
}

/**
 * Job Title normalization utilities
 */
class JobTitleNormalizer {
  private static readonly TITLE_VARIATIONS: Record<string, string[]> = {
    'software engineer': ['software developer', 'software eng', 'sde', 'developer', 'programmer'],
    'senior software engineer': ['senior software developer', 'senior sde', 'lead developer', 'principal engineer'],
    'product manager': ['pm', 'product owner', 'product lead'],
    'data scientist': ['data analyst', 'data engineer', 'research scientist'],
    'ux designer': ['ui designer', 'user experience designer', 'product designer'],
    'project manager': ['pm', 'program manager', 'project lead'],
    'business analyst': ['ba', 'systems analyst', 'process analyst'],
    'devops engineer': ['devops', 'site reliability engineer', 'sre', 'platform engineer'],
    'frontend developer': ['front-end developer', 'ui developer', 'react developer'],
    'backend developer': ['back-end developer', 'server developer', 'api developer'],
    'full stack developer': ['fullstack developer', 'full-stack developer', 'full stack engineer'],
    'machine learning engineer': ['ml engineer', 'ai engineer', 'deep learning engineer'],
  };

  private static readonly SENIORITY_LEVELS: Record<string, string[]> = {
    'junior': ['jr', 'entry level', 'graduate', 'trainee', 'associate'],
    'mid-level': ['mid', 'intermediate', 'experienced'],
    'senior': ['sr', 'lead', 'principal', 'head', 'staff'],
    'manager': ['manager', 'lead', 'head of'],
    'director': ['director', 'vp', 'vice president', 'head of department'],
    'executive': ['ceo', 'cto', 'cfo', 'chief', 'executive', 'president'],
  };

  static normalizeTitle(title: string): { normalized: string; seniority: string; keywords: string[] } {
    const lowerTitle = title.toLowerCase();

    // Extract seniority
    let seniority = 'mid-level';
    for (const [level, variations] of Object.entries(this.SENIORITY_LEVELS)) {
      if (variations.some(variation => lowerTitle.includes(variation))) {
        seniority = level;
        break;
      }
    }

    // Normalize title variations
    let normalized = lowerTitle;
    for (const [standard, variations] of Object.entries(this.TITLE_VARIATIONS)) {
      for (const variation of variations) {
        if (lowerTitle.includes(variation)) {
          normalized = lowerTitle.replace(variation, standard);
          break;
        }
      }
    }

    // Extract keywords
    const keywords = FuzzyMatcher.extractWords(normalized);

    return { normalized: normalized.trim(), seniority, keywords };
  }
}

interface SocCodeDocument {
  id: string;
  code: string;
  jobType: string;
  relatedTitles?: string[];
  eligibility?: string;
  searchTerms?: string[];
}

interface SocCodeMatch {
  code: string;
  title: string;
  confidence: number;
  matchedKeywords: string[];
  relatedTitles: string[];
  eligibility: string;
}

interface MatchRequest {
  title: string;
  description?: string;
  keywords?: string[];
  department?: string;
  seniority?: string;
}

/**
 * Match job data to SOC codes using fuzzy matching
 */
async function matchToSocCode(
  db: ReturnType<typeof getAdminDb>,
  request: MatchRequest
): Promise<SocCodeMatch | null> {
  // Normalize the input title
  const { normalized: normalizedTitle, seniority, keywords: titleKeywords } = 
    JobTitleNormalizer.normalizeTitle(request.title);

  // Get all SOC codes (with reasonable limit for performance)
  const snapshot = await db.collection('socCodes').limit(500).get();
  const socCodes: SocCodeDocument[] = snapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Omit<SocCodeDocument, 'id'>),
  }));

  let bestMatch: SocCodeMatch | null = null;
  let bestScore = 0;

  // Merge keywords from request with extracted keywords
  const allKeywords = new Set([
    ...titleKeywords,
    ...(request.keywords || []).map(k => k.toLowerCase()),
  ]);

  for (const soc of socCodes) {
    let score = 0;
    const matchedKeywords: string[] = [];

    // 1. Exact title match (highest weight - 50%)
    const titleSimilarity = FuzzyMatcher.similarity(
      normalizedTitle,
      (soc.jobType || '').toLowerCase()
    );
    if (titleSimilarity > 0.7) {
      score += titleSimilarity * 0.5;
      matchedKeywords.push(soc.jobType);
    }

    // 2. Related titles match (40% weight)
    if (soc.relatedTitles && Array.isArray(soc.relatedTitles)) {
      for (const relatedTitle of soc.relatedTitles) {
        const relatedSimilarity = FuzzyMatcher.similarity(
          normalizedTitle,
          relatedTitle.toLowerCase()
        );
        if (relatedSimilarity > 0.6) {
          score += relatedSimilarity * 0.4;
          matchedKeywords.push(relatedTitle);
          break; // Only count best related title match
        }
      }
    }

    // 3. Word overlap with description (20% weight)
    if (request.description) {
      const descriptionOverlap = FuzzyMatcher.wordOverlap(
        `${request.title} ${request.description}`,
        soc.jobType || ''
      );
      if (descriptionOverlap > 0.2) {
        score += descriptionOverlap * 0.2;
      }
    }

    // 4. Keyword matching (10% bonus)
    for (const keyword of allKeywords) {
      if (
        (soc.jobType || '').toLowerCase().includes(keyword) ||
        soc.relatedTitles?.some(t => t.toLowerCase().includes(keyword)) ||
        soc.searchTerms?.includes(keyword)
      ) {
        score += 0.05;
        matchedKeywords.push(keyword);
      }
    }

    // 5. Department matching (5% bonus)
    if (request.department && (soc.jobType || '').toLowerCase().includes(request.department.toLowerCase())) {
      score += 0.05;
    }

    // 6. Seniority level bonus (5%)
    const effectiveSeniority = request.seniority || seniority;
    if ((soc.jobType || '').toLowerCase().includes(effectiveSeniority)) {
      score += 0.05;
    }

    // Update best match if score exceeds threshold (0.3)
    if (score > bestScore && score > 0.3) {
      bestScore = score;
      bestMatch = {
        code: soc.code,
        title: soc.jobType,
        confidence: Math.min(score, 1.0),
        matchedKeywords: [...new Set(matchedKeywords)],
        relatedTitles: soc.relatedTitles || [],
        eligibility: soc.eligibility || 'Unknown',
      };
    }
  }

  return bestMatch;
}

/**
 * POST /api/soc-codes/match
 * 
 * Match a job to SOC codes using fuzzy matching algorithm.
 * 
 * Request body:
 * {
 *   title: string (required)
 *   description?: string
 *   keywords?: string[]
 *   department?: string
 *   seniority?: string
 * }
 * 
 * Response:
 * {
 *   success: boolean
 *   match: SocCodeMatch | null
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify session (allow both authenticated users and development mock tokens)
    const isMockToken = process.env.NODE_ENV === 'development' &&
      request.headers.get('authorization')?.includes('bW9jay1zaWduYXR1cmUtZm9yLXRlc3Rpbmc');

    if (!isMockToken) {
      const decodedToken = await verifySessionFromRequest(request);
      if (!decodedToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Parse request body
    let body: MatchRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.title || typeof body.title !== 'string' || body.title.trim().length === 0) {
      return NextResponse.json(
        { error: 'title is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Initialize Firestore
    const db = getAdminDb();

    // Perform fuzzy matching
    const match = await matchToSocCode(db, {
      title: body.title.trim(),
      description: body.description?.trim(),
      keywords: body.keywords,
      department: body.department?.trim(),
      seniority: body.seniority?.trim(),
    });

    return NextResponse.json({
      success: true,
      match,
      query: {
        title: body.title,
        hasDescription: !!body.description,
        keywordCount: body.keywords?.length || 0,
      },
    });
  } catch (error) {
    console.error('Error matching SOC codes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/soc-codes/match
 * Returns information about the matching endpoint.
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/soc-codes/match',
    method: 'POST',
    description: 'Match a job title to UK SOC codes using fuzzy matching',
    body: {
      title: 'string (required) - Job title to match',
      description: 'string (optional) - Job description for improved matching',
      keywords: 'string[] (optional) - Additional keywords to consider',
      department: 'string (optional) - Department hint (e.g., "engineering")',
      seniority: 'string (optional) - Seniority level hint',
    },
    response: {
      success: 'boolean',
      match: {
        code: 'string - UK SOC code (e.g., "2136")',
        title: 'string - Official occupation title',
        confidence: 'number - Match confidence (0-1)',
        matchedKeywords: 'string[] - Keywords that contributed to match',
        relatedTitles: 'string[] - Related job titles for this SOC code',
        eligibility: 'string - Visa eligibility status',
      },
    },
  });
}
