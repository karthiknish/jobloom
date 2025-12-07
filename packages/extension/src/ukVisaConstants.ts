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
    NEW_ENTRANT: 30960,
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

// ============================================================================
// THRESHOLD TYPES
// ============================================================================
export type UkThresholdType =
    | 'general'
    | 'isl'
    | 'new_entrant'
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

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the applicable threshold based on occupation and applicant type
 */
export function getApplicableThreshold(options: {
    isOnISL?: boolean;
    isOnTSL?: boolean;
    isHealthCare?: boolean;
    isNewEntrant?: boolean;
    isTransitional?: boolean;
    goingRate?: number;
}): UkThresholdInfo {
    const { isOnISL, isOnTSL, isHealthCare, isNewEntrant, isTransitional } = options;

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
