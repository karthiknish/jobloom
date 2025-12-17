/**
 * URL Normalizer - Strips tracking parameters from job URLs to prevent duplicates
 * Server-side version for API routes
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

// Parameters essential for job identification (should NOT be stripped)
const ESSENTIAL_PARAMS = new Set([
  'currentJobId', 'jobId', 'jk', 'clk', 'id',
]);

/**
 * Normalizes a job URL by removing tracking parameters.
 */
export function normalizeJobUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return url;
  }

  try {
    const parsedUrl = new URL(url);
    const paramsToDelete: string[] = [];

    parsedUrl.searchParams.forEach((_, key) => {
      const lowerKey = key.toLowerCase();
      if (TRACKING_PARAMS.has(lowerKey) && !ESSENTIAL_PARAMS.has(lowerKey)) {
        paramsToDelete.push(key);
      }
    });

    paramsToDelete.forEach(key => parsedUrl.searchParams.delete(key));

    // Sort remaining parameters for consistent comparison
    const sortedParams = new URLSearchParams();
    const paramEntries = Array.from(parsedUrl.searchParams.entries());
    paramEntries.sort((a, b) => a[0].localeCompare(b[0]));
    paramEntries.forEach(([key, value]) => sortedParams.append(key, value));

    parsedUrl.search = sortedParams.toString();

    if (parsedUrl.hash === '#') {
      parsedUrl.hash = '';
    }

    let normalizedUrl = parsedUrl.toString();
    if (normalizedUrl.endsWith('/') && parsedUrl.pathname !== '/') {
      normalizedUrl = normalizedUrl.slice(0, -1);
    }

    return normalizedUrl;
  } catch (error) {
    console.warn('Failed to normalize URL:', url, error);
    return url;
  }
}

/**
 * Extracts a job identifier from URL for reliable duplicate detection.
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
      const match = parsedUrl.pathname.match(/\/jobs\/view\/(\d+)/);
      if (match) return `linkedin:${match[1]}`;
      const currentJobId = parsedUrl.searchParams.get('currentJobId');
      if (currentJobId) return `linkedin:${currentJobId}`;
    }

    // Indeed: jk parameter
    if (hostname.includes('indeed.com') || hostname.includes('indeed.co.uk')) {
      const jobKey = parsedUrl.searchParams.get('jk');
      if (jobKey) return `indeed:${jobKey}`;
      const clk = parsedUrl.searchParams.get('clk');
      if (clk) return `indeed:${clk}`;
    }

    // Reed: /jobs/{company}/{jobId}
    if (hostname.includes('reed.co.uk')) {
      const match = parsedUrl.pathname.match(/\/jobs\/[^\/]+\/(\d+)/);
      if (match) return `reed:${match[1]}`;
    }

    // Glassdoor
    if (hostname.includes('glassdoor.com') || hostname.includes('glassdoor.co.uk')) {
      const match = parsedUrl.pathname.match(/\/job-listing\/[^\/]+\/(\d+)/);
      if (match) return `glassdoor:${match[1]}`;
    }

    // Totaljobs
    if (hostname.includes('totaljobs.com')) {
      const match = parsedUrl.pathname.match(/\/job\/(\d+)/);
      if (match) return `totaljobs:${match[1]}`;
    }

  } catch {
    // Fall through
  }

  return normalizeJobUrl(url);
}
