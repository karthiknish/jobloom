/**
 * URL Normalizer - Strips tracking parameters from job URLs to prevent duplicates
 * 
 * Job URLs from LinkedIn, Indeed, and other sites often contain tracking parameters
 * that cause the same job to appear as different URLs, leading to duplicate entries.
 */

// Tracking and analytics parameters to strip
const TRACKING_PARAMS = new Set([
  // Google Analytics / UTM
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id',
  'utm_source_platform', 'utm_creative_format', 'utm_marketing_tactic',
  
  // Ad platform click IDs
  'fbclid', 'gclid', 'gclsrc', 'msclkid', 'dclid', 'twclid', 'li_fat_id',
  'wbraid', 'gbraid', 'ttclid', 'ScCid', 'click_id',
  
  // LinkedIn-specific
  'trk', 'trkInfo', 'trackingId', 'refId', 'eBP', 'midToken', 'midSig',
  'origin', 'originalReferer', 'originalSubdomain', 'lipi', 'licu',
  
  // Indeed-specific
  'from', 'fromage', 'vjk', 'advn', 'xpse', 'xgid', 'xpnl', 'tk',
  
  // General tracking
  '_ga', '_gl', '_hsenc', '_hsmi', 'mc_cid', 'mc_eid',
  'oly_enc_id', 'oly_anon_id', '__s', '__hstc', '__hsfp', 'hsCtaTracking',
  
  // Session/referral
  'ref', 'referer', 'referrer', 'source', 'src', 'si', 'feature',
  'position', 'savedSearchId', 'searchId', 'searchIndex',
  
  // Misc tracking
  'igshid', 'fbid', '_branch_match_id', '_branch_referrer',
  's_kwcid', 'ef_id', 'affiliate_id', 'campaign_id',
]);

// Parameters that are essential for identifying the job (should NOT be stripped)
const ESSENTIAL_PARAMS = new Set([
  // LinkedIn
  'currentJobId', 'jobId',
  // Indeed
  'jk',      // job key - required for Indeed job identification
  'clk',     // job identifier
  // Generic
  'id',
]);

/**
 * Normalizes a job URL by removing tracking parameters to enable accurate duplicate detection.
 * 
 * @param url - The URL to normalize (can be a string or URL object)
 * @returns The normalized URL string with tracking parameters removed
 * 
 * @example
 * normalizeJobUrl('https://linkedin.com/jobs/view/1234?trk=guest&utm_source=google')
 * // Returns: 'https://linkedin.com/jobs/view/1234'
 */
export function normalizeJobUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return url;
  }

  try {
    const parsedUrl = new URL(url);
    const paramsToDelete: string[] = [];

    // Identify tracking parameters to remove
    parsedUrl.searchParams.forEach((_, key) => {
      const lowerKey = key.toLowerCase();
      if (TRACKING_PARAMS.has(lowerKey) && !ESSENTIAL_PARAMS.has(lowerKey)) {
        paramsToDelete.push(key);
      }
    });

    // Remove identified tracking parameters
    paramsToDelete.forEach(key => parsedUrl.searchParams.delete(key));

    // Sort remaining parameters for consistent comparison
    const sortedParams = new URLSearchParams();
    const paramEntries = Array.from(parsedUrl.searchParams.entries());
    paramEntries.sort((a, b) => a[0].localeCompare(b[0]));
    paramEntries.forEach(([key, value]) => sortedParams.append(key, value));

    // Reconstruct URL with sorted parameters
    parsedUrl.search = sortedParams.toString();

    // Remove trailing hash if empty
    if (parsedUrl.hash === '#') {
      parsedUrl.hash = '';
    }

    // Remove trailing slash for consistency (except for root paths)
    let normalizedUrl = parsedUrl.toString();
    if (normalizedUrl.endsWith('/') && parsedUrl.pathname !== '/') {
      normalizedUrl = normalizedUrl.slice(0, -1);
    }

    return normalizedUrl;
  } catch (error) {
    // If URL parsing fails, return original URL
    console.warn('HireAll: Failed to normalize URL:', url, error);
    return url;
  }
}

/**
 * Extracts the job identifier from common job site URLs for more reliable duplicate detection.
 * Falls back to normalized URL if no specific identifier can be extracted.
 * 
 * @param url - The job URL
 * @returns A canonical identifier for the job
 */
export function extractJobIdentifier(url: string): string {
  if (!url || typeof url !== 'string') {
    return url;
  }

  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();

    // LinkedIn: /jobs/view/{jobId}
    if (hostname.includes('linkedin.com')) {
      const linkedInMatch = parsedUrl.pathname.match(/\/jobs\/view\/(\d+)/);
      if (linkedInMatch) {
        return `linkedin:${linkedInMatch[1]}`;
      }
      // Check for currentJobId parameter
      const currentJobId = parsedUrl.searchParams.get('currentJobId');
      if (currentJobId) {
        return `linkedin:${currentJobId}`;
      }
    }

    // Indeed: jk parameter or /viewjob?jk={jobKey}
    if (hostname.includes('indeed.com') || hostname.includes('indeed.co.uk')) {
      const jobKey = parsedUrl.searchParams.get('jk');
      if (jobKey) {
        return `indeed:${jobKey}`;
      }
      // Alternative: /viewjob endpoint with clk
      const clk = parsedUrl.searchParams.get('clk');
      if (clk) {
        return `indeed:${clk}`;
      }
    }

    // Reed: /jobs/{company}/{jobId}
    if (hostname.includes('reed.co.uk')) {
      const reedMatch = parsedUrl.pathname.match(/\/jobs\/[^\/]+\/(\d+)/);
      if (reedMatch) {
        return `reed:${reedMatch[1]}`;
      }
    }

    // Glassdoor: /job-listing/{jobId}
    if (hostname.includes('glassdoor.com') || hostname.includes('glassdoor.co.uk')) {
      const glassdoorMatch = parsedUrl.pathname.match(/\/job-listing\/[^\/]+\/(\d+)/);
      if (glassdoorMatch) {
        return `glassdoor:${glassdoorMatch[1]}`;
      }
    }

    // Totaljobs: /job/{jobId}
    if (hostname.includes('totaljobs.com')) {
      const totaljobsMatch = parsedUrl.pathname.match(/\/job\/(\d+)/);
      if (totaljobsMatch) {
        return `totaljobs:${totaljobsMatch[1]}`;
      }
    }

  } catch (error) {
    // Fall through to return normalized URL
  }

  // Fallback: return normalized URL
  return normalizeJobUrl(url);
}

/**
 * Checks if two URLs likely refer to the same job.
 * First tries to match by job identifier, then falls back to normalized URL comparison.
 * 
 * @param url1 - First URL to compare
 * @param url2 - Second URL to compare
 * @returns True if the URLs likely refer to the same job
 */
export function areSameJob(url1: string, url2: string): boolean {
  if (!url1 || !url2) {
    return false;
  }

  // Try identifier-based comparison first (most reliable)
  const id1 = extractJobIdentifier(url1);
  const id2 = extractJobIdentifier(url2);

  if (id1.startsWith('linkedin:') || id1.startsWith('indeed:') || 
      id1.startsWith('reed:') || id1.startsWith('glassdoor:') || 
      id1.startsWith('totaljobs:')) {
    return id1 === id2;
  }

  // Fall back to normalized URL comparison
  return normalizeJobUrl(url1) === normalizeJobUrl(url2);
}
