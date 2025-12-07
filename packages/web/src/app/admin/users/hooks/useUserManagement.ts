"use client";

import { useState, useCallback, useMemo } from "react";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { useApiQuery, useApiMutation } from "@/hooks/useApi";
import { adminApi } from "@/utils/api/admin";
import { showError, showSuccess, showWarning } from "@/components/ui/Toast";
import { exportToCsv } from "@/utils/exportToCsv";
import type { User, UserStats, VerificationStats } from "../types";

export function useUserManagement() {
    const { user } = useFirebaseAuth();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

    // Check admin status
    const loadUserRecord = useCallback(() => {
        if (user && user.uid) {
            return adminApi.getUserByFirebaseUid(user.uid);
        }
        return Promise.reject(new Error("No user"));
    }, [user?.uid]);

    const { data: userRecord } = useApiQuery(
        loadUserRecord,
        [user?.uid],
        { enabled: !!user?.uid }
    );

    const canFetchAdminData = userRecord?.isAdmin === true;

    // Fetch user stats
    const loadUserStats = useCallback(() => adminApi.getUserStats(), []);
    const { data: userStats, refetch: refetchStats } = useApiQuery(
        loadUserStats,
        [userRecord?._id, userRecord?.isAdmin],
        { enabled: canFetchAdminData }
    );

    // Fetch all users
    const loadAllUsers = useCallback(() => adminApi.getAllUsers(), []);
    const { data: usersData, refetch: refetchUsers } = useApiQuery(
        loadAllUsers,
        [userRecord?._id, userRecord?.isAdmin],
        { enabled: canFetchAdminData }
    );

    // Admin action mutations
    const { mutate: setAdminUser } = useApiMutation((userId: string) => {
        if (!userRecord?._id) return Promise.reject(new Error("No admin context id"));
        return adminApi.setAdminUser(userId, userRecord._id);
    });

    const { mutate: removeAdminUser } = useApiMutation((userId: string) => {
        if (!userRecord?._id) return Promise.reject(new Error("No admin context id"));
        return adminApi.removeAdminUser(userId, userRecord._id);
    });

    const { mutate: deleteUserMutation } = useApiMutation((userId: string) => {
        if (!userRecord?._id) return Promise.reject(new Error("No admin context id"));
        return adminApi.deleteUser(userId);
    });

    // Computed values
    const users = (usersData?.users as User[] | undefined) ?? [];

    const recentUsers = useMemo(() => {
        return [...users]
            .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
            .slice(0, 5);
    }, [users]);

    const recentAdmins = useMemo(() => {
        return users
            .filter((u) => u.isAdmin)
            .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
            .slice(0, 5);
    }, [users]);

    const verificationStats: VerificationStats = useMemo(() => {
        if (!users.length) {
            return {
                total: 0,
                verified: 0,
                unverified: 0,
                verificationRate: 0,
                neverLoggedIn: 0,
                dormant: 0,
            };
        }

        const verified = users.filter((u) => u.emailVerified).length;
        const unverified = users.length - verified;
        const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
        const neverLoggedIn = users.filter((u) => !u.lastLoginAt).length;
        const dormant = users.filter(
            (u) => u.lastLoginAt && Date.now() - u.lastLoginAt > THIRTY_DAYS
        ).length;

        return {
            total: users.length,
            verified,
            unverified,
            verificationRate: users.length
                ? Math.round((verified / users.length) * 100)
                : 0,
            neverLoggedIn,
            dormant,
        };
    }, [users]);

    // Actions
    const copyEmailsToClipboard = async (
        targetUsers: User[],
        emptyMessage: string,
        successMessage: (count: number) => string
    ) => {
        if (!targetUsers.length) {
            showWarning(emptyMessage);
            return;
        }

        const emails = targetUsers.map((u) => u.email).filter(Boolean).join(", ");

        try {
            if (typeof navigator !== "undefined" && navigator.clipboard) {
                await navigator.clipboard.writeText(emails);
            } else if (typeof document !== "undefined") {
                const textarea = document.createElement("textarea");
                textarea.value = emails;
                textarea.style.position = "fixed";
                textarea.style.opacity = "0";
                document.body.appendChild(textarea);
                textarea.focus();
                textarea.select();
                document.execCommand("copy");
                document.body.removeChild(textarea);
            } else {
                throw new Error("Clipboard APIs are not available");
            }

            showSuccess(successMessage(targetUsers.length));
        } catch (error) {
            console.error("Failed to copy email addresses", error);
            showError("Unable to copy email addresses", "Try again from a secure context.");
        }
    };

    const handleExportUsers = (filteredUsers: User[]) => {
        if (!filteredUsers.length) {
            showWarning("No users match the current filters.");
            return;
        }

        const rows = filteredUsers.map((u) => ({
            ID: u._id,
            Name: u.name || "",
            Email: u.email,
            "Admin?": u.isAdmin ? "Yes" : "No",
            "Email Verified": u.emailVerified ? "Yes" : "No",
            "Subscription Plan": u.subscriptionPlan || "free",
            "Created At": new Date(u.createdAt).toISOString(),
            "Last Login": u.lastLoginAt ? new Date(u.lastLoginAt).toISOString() : "",
        }));

        exportToCsv(`hireall-users-${new Date().toISOString().slice(0, 10)}`, rows);
        showSuccess(`Exported ${filteredUsers.length} users to CSV`);
    };

    const handleRefreshData = async () => {
        if (isRefreshing) return;
        setIsRefreshing(true);
        try {
            adminApi.invalidateCache("admin-users");
            await Promise.allSettled([refetchUsers(), refetchStats()]);
            showSuccess("User dashboard refreshed");
        } catch (error) {
            console.error("Failed to refresh user data", error);
            showError("Unable to refresh user data");
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleSetAdmin = async (userId: string) => {
        try {
            await setAdminUser(userId);
            showSuccess("User granted admin privileges");
            adminApi.invalidateCache("admin-users");
            refetchUsers();
            refetchStats();
        } catch {
            showError("Failed to grant admin privileges");
        }
    };

    const handleRemoveAdmin = async (userId: string) => {
        if (!confirm("Are you sure you want to remove admin privileges from this user?")) return;

        try {
            await removeAdminUser(userId);
            showSuccess("Admin privileges removed");
            adminApi.invalidateCache("admin-users");
            refetchUsers();
            refetchStats();
        } catch {
            showError("Failed to remove admin privileges");
        }
    };

    const handleDeleteUser = async (userId: string, userEmail: string) => {
        if (!confirm(`Are you sure you want to delete user ${userEmail}? This action cannot be undone.`)) return;

        try {
            await deleteUserMutation(userId);
            showSuccess("User deleted successfully");
            adminApi.invalidateCache("admin-users");
            refetchUsers();
            refetchStats();
        } catch {
            showError("Failed to delete user");
        }
    };

    return {
        // Auth state
        user,
        userRecord,
        isAdmin,
        setIsAdmin,

        // Data
        users,
        userStats: userStats as UserStats | undefined,
        recentUsers,
        recentAdmins,
        verificationStats,

        // Actions
        copyEmailsToClipboard,
        handleExportUsers,
        handleRefreshData,
        handleSetAdmin,
        handleRemoveAdmin,
        handleDeleteUser,
        isRefreshing,
    };
}
