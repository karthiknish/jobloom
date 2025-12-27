/**
 * UK Visa Types
 */

import { UK_SALARY_THRESHOLDS, UK_HOURLY_RATES } from './constants';

// ============================================================================
// THRESHOLD TYPES
// ============================================================================
export type UkThresholdType =
  | 'general'
  | 'isl'
  | 'new_entrant'
  | 'stem_phd'
  | 'non_stem_phd'
  | 'health_care'
  | 'tsl'
  | 'transitional';

export interface UkThresholdInfo {
  type: UkThresholdType;
  annualSalary: number;
  hourlyRate: number;
  label: string;
  description: string;
}

export const UK_THRESHOLD_INFO: Record<UkThresholdType, UkThresholdInfo> = {
  general: {
    type: 'general',
    annualSalary: UK_SALARY_THRESHOLDS.GENERAL,
    hourlyRate: UK_HOURLY_RATES.STANDARD,
    label: 'General Rate',
    description: 'Standard Skilled Worker visa minimum salary',
  },
  isl: {
    type: 'isl',
    annualSalary: UK_SALARY_THRESHOLDS.ISL,
    hourlyRate: UK_HOURLY_RATES.STANDARD,
    label: 'Immigration Salary List',
    description: 'Discounted rate for occupations on the ISL',
  },
  new_entrant: {
    type: 'new_entrant',
    annualSalary: UK_SALARY_THRESHOLDS.NEW_ENTRANT,
    hourlyRate: UK_HOURLY_RATES.STANDARD,
    label: 'New Entrant',
    description: 'Reduced rate for applicants under 26, recent graduates, or in professional training',
  },
  stem_phd: {
    type: 'stem_phd',
    annualSalary: UK_SALARY_THRESHOLDS.STEM_PHD,
    hourlyRate: UK_HOURLY_RATES.STANDARD,
    label: 'STEM PhD',
    description: 'Reduced rate for applicants with a relevant STEM PhD',
  },
  non_stem_phd: {
    type: 'non_stem_phd',
    annualSalary: UK_SALARY_THRESHOLDS.NON_STEM_PHD,
    hourlyRate: UK_HOURLY_RATES.STANDARD,
    label: 'Non-STEM PhD',
    description: 'Reduced rate for applicants with a relevant non-STEM PhD',
  },
  health_care: {
    type: 'health_care',
    annualSalary: UK_SALARY_THRESHOLDS.HEALTH_CARE,
    hourlyRate: UK_HOURLY_RATES.TRANSITIONAL,
    label: 'Health & Care Worker',
    description: 'Special rate for eligible health and care roles',
  },
  tsl: {
    type: 'tsl',
    annualSalary: UK_SALARY_THRESHOLDS.TSL_FLOOR,
    hourlyRate: UK_HOURLY_RATES.TRANSITIONAL,
    label: 'Temporary Shortage List',
    description: 'Medium-skilled roles on TSL (expires Dec 2026)',
  },
  transitional: {
    type: 'transitional',
    annualSalary: UK_SALARY_THRESHOLDS.TRANSITIONAL,
    hourlyRate: UK_HOURLY_RATES.TRANSITIONAL,
    label: 'Transitional',
    description: 'Applies to those with CoS issued before April 2024',
  },
};
