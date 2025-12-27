/**
 * UK Visa Constants
 * Centralized salary thresholds and eligibility criteria for UK Skilled Worker visa
 * Updated: December 2024 (reflects July 2025 rules)
 */

// ============================================================================
// EFFECTIVE DATES
// ============================================================================
export const UK_VISA_DATES = {
  /** April 2024 changes went live */
  APRIL_2024_CHANGES: new Date('2024-04-04'),
  /** April 2025 minimum floor changes */
  APRIL_2025_CHANGES: new Date('2025-04-09'),
  /** July 2025 major threshold increase */
  JULY_2025_CHANGES: new Date('2025-07-22'),
  /** Transitional rules end */
  TRANSITIONAL_END: new Date('2030-04-04'),
  /** Temporary Shortage List expires */
  TSL_EXPIRES: new Date('2026-12-31'),
} as const;

// ============================================================================
// SALARY THRESHOLDS (July 2025)
// ============================================================================
export const UK_SALARY_THRESHOLDS = {
  /** General minimum for most Skilled Worker roles */
  GENERAL: 41700,
  /** Immigration Salary List discount for RQF 6+ roles */
  ISL: 33400,
  /** New entrant rate (under 26, recent graduate, professional training) */
  NEW_ENTRANT: 33400,
  /** STEM PhD rate (80% of going rate) */
  STEM_PHD: 33400,
  /** Non-STEM PhD rate (90% of going rate) */
  NON_STEM_PHD: 37500,
  /** Health and Care Worker visa minimum */
  HEALTH_CARE: 25000,
  /** Health and Care ISL options */
  HEALTH_CARE_ISL_STANDARD: 31300,
  HEALTH_CARE_ISL_REDUCED: 28200,
  /** Transitional rate (CoS issued before April 2024) */
  TRANSITIONAL: 31300,
  /** Absolute minimum for transitional applicants */
  TRANSITIONAL_FLOOR: 25000,
  /** Temporary Shortage List floor */
  TSL_FLOOR: 25000,
} as const;

// ============================================================================
// HOURLY RATES
// ============================================================================
export const UK_HOURLY_RATES = {
  /** Standard minimum hourly rate (based on 48hr week) */
  STANDARD: 17.13,
  /** Transitional/Health Care hourly rate */
  TRANSITIONAL: 12.82,
} as const;

// ============================================================================
// RQF LEVELS
// ============================================================================
export const UK_RQF_LEVELS = {
  /** Minimum RQF level for standard Skilled Worker (July 2025+) */
  MINIMUM_STANDARD: 6,
  /** Minimum RQF for TSL roles */
  MINIMUM_TSL: 3,
  /** Maximum RQF for TSL roles */
  MAXIMUM_TSL: 5,
} as const;
