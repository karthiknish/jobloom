/**
 * UK Visa Calculator Functions
 */

import { UkThresholdType, UkThresholdInfo, UK_THRESHOLD_INFO } from './types';

/**
 * Get the applicable threshold based on occupation and applicant type
 */
export function getApplicableThreshold(options: {
  isOnISL?: boolean;
  isOnTSL?: boolean;
  isHealthCare?: boolean;
  isNewEntrant?: boolean;
  hasStemPhd?: boolean;
  hasNonStemPhd?: boolean;
  isTransitional?: boolean;
  goingRate?: number;
}): UkThresholdInfo {
  const { isOnISL, isOnTSL, isHealthCare, isNewEntrant, hasStemPhd, hasNonStemPhd, isTransitional } = options;

  // Priority order for discount categories
  if (isHealthCare) {
    return UK_THRESHOLD_INFO.health_care;
  }
  if (isOnTSL) {
    return UK_THRESHOLD_INFO.tsl;
  }
  if (isTransitional) {
    return UK_THRESHOLD_INFO.transitional;
  }
  if (isNewEntrant) {
    return UK_THRESHOLD_INFO.new_entrant;
  }
  if (hasStemPhd) {
    return UK_THRESHOLD_INFO.stem_phd;
  }
  if (hasNonStemPhd) {
    return UK_THRESHOLD_INFO.non_stem_phd;
  }
  if (isOnISL) {
    return UK_THRESHOLD_INFO.isl;
  }

  return UK_THRESHOLD_INFO.general;
}

/**
 * Calculate minimum salary requirement
 * Returns the higher of: applicable threshold OR occupation going rate
 */
export function calculateMinimumSalary(options: {
  thresholdType: UkThresholdType;
  goingRate?: number;
}): number {
  const threshold = UK_THRESHOLD_INFO[options.thresholdType];
  const goingRate = options.goingRate ?? 0;

  return Math.max(threshold.annualSalary, goingRate);
}

/**
 * Check if salary meets requirements
 */
export function meetsSalaryRequirement(options: {
  offeredSalary: number;
  thresholdType: UkThresholdType;
  goingRate?: number;
  weeklyHours?: number;
}): { meets: boolean; required: number; hourlyMet: boolean } {
  const minSalary = calculateMinimumSalary({
    thresholdType: options.thresholdType,
    goingRate: options.goingRate,
  });

  const threshold = UK_THRESHOLD_INFO[options.thresholdType];
  const hours = options.weeklyHours ?? 48;
  const annualHours = hours * 52;
  const impliedHourly = options.offeredSalary / annualHours;

  return {
    meets: options.offeredSalary >= minSalary,
    required: minSalary,
    hourlyMet: impliedHourly >= threshold.hourlyRate,
  };
}

/**
 * Format salary for display
 */
export function formatSalaryGBP(value: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
