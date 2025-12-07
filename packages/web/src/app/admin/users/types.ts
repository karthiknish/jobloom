/**
 * Admin Users Types
 * Shared types for admin user management
 */

export interface User {
    _id: string;
    email: string;
    name?: string;
    isAdmin?: boolean;
    createdAt: number;
    lastLoginAt?: number;
    emailVerified?: boolean;
    firebaseUid?: string;
    subscriptionStatus?: string;
    subscriptionPlan?: string;
}

export interface UserStats {
    totalUsers: number;
    activeUsers: number;
    adminUsers: number;
    newUsersThisMonth: number;
    usersByPlan: Record<string, number>;
    recentLogins: number;
}

export interface VerificationStats {
    total: number;
    verified: number;
    unverified: number;
    verificationRate: number;
    neverLoggedIn: number;
    dormant: number;
}
