/**
 * Utils index - Re-exports all utility functions
 */

export {
  normalizeCompanyName,
  stripLegalSuffixes,
  isLikelyPlaceholderCompany,
  buildCompanyQueryCandidates,
} from './company-name';

export {
  normalizeJobUrl,
  extractJobIdentifier,
} from './url';
