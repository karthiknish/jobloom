"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Search,
  MoreHorizontal,
  UserPlus,
  Trash2,
  Crown,
  Activity,
  BarChart3,
  TrendingUp,
  UserX,
  Eye,
  Download,
  Copy,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  Clock3,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { useApiQuery, useApiMutation } from "@/hooks/useApi";
import { adminApi } from "@/utils/api/admin";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminAccessDenied } from "@/components/admin/AdminAccessDenied";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { showError, showSuccess, showWarning } from "@/components/ui/Toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { exportToCsv } from "@/utils/exportToCsv";

// Mirror of UserRecord (plus optional UI-only props) from adminApi
interface User {
  _id: string;
  email: string;
  name?: string;
  isAdmin?: boolean;
  createdAt: number; // stored as timestamp (ms)
  lastLoginAt?: number;
  emailVerified?: boolean;
  firebaseUid?: string;
  subscriptionStatus?: string;
  subscriptionPlan?: string;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  adminUsers: number;
  newUsersThisMonth: number;
  usersByPlan: Record<string, number>;
  recentLogins: number;
}

export default function AdminUserDashboardClient() {
  const { user } = useFirebaseAuth();
  const { isAdmin, isLoading: adminLoading, userRecord } = useAdminAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const canFetchAdminData = isAdmin === true;

  // Fetch user stats
  const loadUserStats = useCallback(
    () => adminApi.getUserStats(),
    []
  );

  const { data: userStats, refetch: refetchStats } = useApiQuery(
    loadUserStats,
    [userRecord?._id, isAdmin],
    { enabled: canFetchAdminData }
  );

  // Fetch all users with pagination
  const loadAllUsers = useCallback(
    () => adminApi.getAllUsers(),
    []
  );

  const { data: usersData, refetch: refetchUsers } = useApiQuery(
    loadAllUsers,
    [userRecord?._id, isAdmin],
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

  const { mutate: deleteUser } = useApiMutation((userId: string) => {
    if (!userRecord?._id) return Promise.reject(new Error("No admin context id"));
    return adminApi.deleteUser(userId);
  });

  // Filter users based on search and filters
  const filteredUsers: User[] = (usersData?.users as User[] | undefined)?.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "admin" && user.isAdmin) ||
      (statusFilter === "user" && !user.isAdmin) ||
      (statusFilter === "verified" && user.emailVerified) ||
      (statusFilter === "unverified" && !user.emailVerified);

    const matchesPlan =
      planFilter === "all" || user.subscriptionPlan === planFilter;

    return matchesSearch && matchesStatus && matchesPlan;
  }) || [];

  const recentUsers = useMemo(() => {
    const users = (usersData?.users as User[] | undefined) ?? [];
    return [...users]
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
      .slice(0, 5);
  }, [usersData?.users]);

  const recentAdmins = useMemo(() => {
    const users = (usersData?.users as User[] | undefined) ?? [];
    return users
      .filter((user) => user.isAdmin)
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
      .slice(0, 5);
  }, [usersData?.users]);

  const verificationStats = useMemo(() => {
    const users = (usersData?.users as User[] | undefined) ?? [];
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
  }, [usersData?.users]);

  const copyEmailsToClipboard = async (
    users: User[],
    emptyMessage: string,
    successMessage: (count: number) => string
  ) => {
    if (!users.length) {
      showWarning(emptyMessage);
      return;
    }

    const emails = users
      .map((user) => user.email)
      .filter(Boolean)
      .join(", ");

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

      showSuccess(successMessage(users.length));
    } catch (error) {
      console.error("Failed to copy email addresses", error);
      showError(
        "Unable to copy email addresses",
        "Try again from a secure context."
      );
    }
  };

  const handleExportUsers = () => {
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

    exportToCsv(
      `hireall-users-${new Date().toISOString().slice(0, 10)}`,
      rows
    );
    showSuccess(`Exported ${filteredUsers.length} users to CSV`);
  };

  const handleCopyEmails = () =>
    copyEmailsToClipboard(
      filteredUsers,
      "No user emails available to copy.",
      (count) =>
        `Copied ${count} email address${count === 1 ? "" : "es"} to your clipboard`
    );

  const handleCopyAdminEmails = () =>
    copyEmailsToClipboard(
      filteredUsers.filter((user) => user.isAdmin),
      "No admin emails in the current view.",
      (count) =>
        `Copied ${count} admin email${count === 1 ? "" : "s"} to your clipboard`
    );

  const handleCopyUnverifiedEmails = () =>
    copyEmailsToClipboard(
      filteredUsers.filter((user) => !user.emailVerified),
      "No unverified users in the current view.",
      (count) =>
        `Copied ${count} unverified email${count === 1 ? "" : "s"} to your clipboard`
    );

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
    } catch (error) {
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
    } catch (error) {
      showError("Failed to remove admin privileges");
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete user ${userEmail}? This action cannot be undone.`)) return;

    try {
      await deleteUser(userId);
      showSuccess("User deleted successfully");
      adminApi.invalidateCache("admin-users");
      refetchUsers();
      refetchStats();
    } catch (error) {
      showError("Failed to delete user");
    }
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email?.[0]?.toUpperCase() || 'U';
  };

  const getStatusBadge = (user: User) => {
    if (user.isAdmin) {
      return <Badge variant="default" className="bg-primary/10 text-primary">Admin</Badge>;
    }
    if (user.emailVerified) {
      return <Badge variant="default" className="bg-secondary/10 text-secondary">Verified</Badge>;
    }
    return <Badge variant="secondary">Unverified</Badge>;
  };

  if (!user) {
    return (
      <AdminLayout title="User Dashboard">
        <div>Please sign in to access the admin panel.</div>
      </AdminLayout>
    );
  }

  if (adminLoading) {
    return (
      <AdminLayout title="User Dashboard">
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-72" />
              </div>
            </div>
            <Skeleton className="h-10 w-28" />
          </div>

          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Distribution & Verification Skeleton */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <Card className="xl:col-span-2 border-gray-200">
              <CardHeader>
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-3 h-3 rounded-full" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-8" />
                      <Skeleton className="w-24 h-2 rounded-full" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardHeader>
                <Skeleton className="h-6 w-40 mb-2" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center justify-between p-2">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Users Table Skeleton */}
          <Card className="border-gray-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <Skeleton className="h-6 w-24 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-64" />
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-10 w-32" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-6 w-16 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return <AdminAccessDenied />;
  }

  return (
    <AdminLayout title="User Dashboard">
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">User Dashboard</h1>
                <p className="text-muted-foreground">Manage users, permissions, and account statistics</p>
              </div>
            </div>

            <Button onClick={() => setShowCreateUser(true)} className="w-full sm:w-auto">
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        {userStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            <Card className="hover:bg-gray-50 transition-all duration-200 border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{userStats.totalUsers}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  +{userStats.newUsersThisMonth} this month
                </p>
              </CardContent>
            </Card>

            <Card className="hover:bg-gray-50 transition-all duration-200 border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Active Users</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{userStats.activeUsers}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Recently active
                </p>
              </CardContent>
            </Card>

            <Card className="hover:bg-gray-50 transition-all duration-200 border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Admin Users</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center">
                  <Crown className="h-4 w-4 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{userStats.adminUsers}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  System administrators
                </p>
              </CardContent>
            </Card>

            <Card className="hover:bg-gray-50 transition-all duration-200 border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Recent Logins</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-orange-50 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{userStats.recentLogins}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Last 7 days
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Subscription Plan Distribution */}
        {userStats?.usersByPlan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 gap-6 xl:grid-cols-3"
          >
            <Card className="xl:col-span-2 border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-gray-500" />
                  Subscription Distribution
                </CardTitle>
                <CardDescription>User distribution by subscription plan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(userStats.usersByPlan || {}).map(([plan, count]: [string, unknown]) => (
                    <div key={plan} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            plan === "free"
                              ? "bg-gray-400"
                              : plan === "premium"
                              ? "bg-blue-500"
                              : plan === "enterprise"
                              ? "bg-purple-500"
                              : "bg-gray-300"
                          }`}
                        />
                        <span className="capitalize text-sm font-medium text-gray-700">{plan}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium text-foreground">{count as number}</div>
                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                                plan === "free"
                                  ? "bg-gray-400"
                                  : plan === "premium"
                                  ? "bg-blue-500"
                                  : plan === "enterprise"
                                  ? "bg-purple-500"
                                  : "bg-gray-300"
                              }`}
                            style={{
                              width: `${Math.min(
                                ((count as number) / (userStats.totalUsers || 1)) * 100,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  Verification Snapshot
                </CardTitle>
                <CardDescription>Email verification & health signals</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center">
                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Verified</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {verificationStats.verified} <span className="text-muted-foreground font-normal">({verificationStats.verificationRate}%)</span>
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-amber-50 flex items-center justify-center">
                        <ShieldAlert className="h-4 w-4 text-amber-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Unverified</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {verificationStats.unverified}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center">
                        <Clock3 className="h-4 w-4 text-slate-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Never logged in</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {verificationStats.neverLoggedIn}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-orange-50 flex items-center justify-center">
                        <Clock3 className="h-4 w-4 text-orange-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Dormant (&gt; 30 days)</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {verificationStats.dormant}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="xl:col-span-3 border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  Quick Actions
                </CardTitle>
                <CardDescription>Applies to the currently filtered users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Button
                    variant="outline"
                    className="justify-start hover:bg-gray-50 border-gray-200"
                    onClick={handleCopyEmails}
                  >
                    <Copy className="h-4 w-4 mr-2 text-gray-500" />
                    Copy all emails
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start hover:bg-gray-50 border-gray-200"
                    onClick={handleCopyAdminEmails}
                  >
                    <Crown className="h-4 w-4 mr-2 text-purple-500" />
                    Copy admin emails
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start hover:bg-gray-50 border-gray-200"
                    onClick={handleCopyUnverifiedEmails}
                  >
                    <ShieldAlert className="h-4 w-4 mr-2 text-amber-500" />
                    Copy unverified emails
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start hover:bg-gray-50 border-gray-200"
                    onClick={handleExportUsers}
                  >
                    <Download className="h-4 w-4 mr-2 text-blue-500" />
                    Export filtered users
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start hover:bg-gray-50 border-gray-200"
                    onClick={handleRefreshData}
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""} text-green-500`} />
                    {isRefreshing ? "Refreshing..." : "Refresh metrics"}
                  </Button>
                  <div className="sm:col-span-2 lg:col-span-3 text-xs text-muted-foreground flex items-center">
                    Tip: Apply search and filters to narrow your actions.
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {(recentUsers.length > 0 || recentAdmins.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="grid grid-cols-1 gap-6 xl:grid-cols-2"
          >
            {recentUsers.length > 0 && (
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle>Recent Signups</CardTitle>
                  <CardDescription>Latest users added to the platform</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-gray-100">
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="hidden sm:table-cell">Status</TableHead>
                        <TableHead className="text-right">Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentUsers.map((recentUser) => (
                        <TableRow key={recentUser._id} className="hover:bg-gray-50 border-gray-100">
                          <TableCell className="font-medium flex items-center gap-2">
                            <Avatar className="h-8 w-8 border border-gray-200">
                              <AvatarImage
                                src={`https://www.gravatar.com/avatar/${btoa(
                                  recentUser.email.trim().toLowerCase()
                                )}?d=identicon`}
                                alt={recentUser.name || recentUser.email}
                              />
                              <AvatarFallback className="bg-gray-100 text-gray-600">
                                {getInitials(recentUser.name, recentUser.email)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-foreground">
                                {recentUser.name || "Unnamed User"}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                Joined {formatDistanceToNow(recentUser.createdAt, { addSuffix: true })}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {recentUser.email}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {getStatusBadge(recentUser)}
                          </TableCell>
                          <TableCell className="text-right text-sm text-muted-foreground">
                            {format(new Date(recentUser.createdAt), "PP")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {recentAdmins.length > 0 && (
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle>Recent Admin Approvals</CardTitle>
                  <CardDescription>Who recently gained admin access</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-gray-100">
                        <TableHead>Admin</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-right">Added</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentAdmins.map((adminUser) => (
                        <TableRow key={adminUser._id} className="hover:bg-gray-50 border-gray-100">
                          <TableCell className="flex items-center gap-2">
                            <Avatar className="h-8 w-8 border border-gray-200">
                              <AvatarImage src="" alt={adminUser.name || adminUser.email} />
                              <AvatarFallback className="bg-purple-50 text-purple-600">
                                {getInitials(adminUser.name, adminUser.email)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-sm text-foreground">
                                {adminUser.name || "Unnamed Admin"}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                Admin since {formatDistanceToNow(adminUser.createdAt, { addSuffix: true })}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {adminUser.email}
                          </TableCell>
                          <TableCell className="text-right text-sm text-muted-foreground">
                            {format(new Date(adminUser.createdAt), "PP")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="border-none"
        >
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Search, filter, and manage all user accounts ({filteredUsers.length} users)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 border-gray-200 focus:ring-blue-500"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[150px] border-gray-200">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="admin">Admins Only</SelectItem>
                    <SelectItem value="user">Regular Users</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="unverified">Unverified</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={planFilter} onValueChange={setPlanFilter}>
                  <SelectTrigger className="w-full sm:w-[150px] border-gray-200">
                    <SelectValue placeholder="Filter by plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Plans</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Users Table */}
              <div className="rounded-lg border border-gray-200 overflow-x-auto">
                <Table className="min-w-[980px]">
                  <TableHeader className="bg-gray-50">
                    <TableRow className="border-gray-200">
                      <TableHead className="font-semibold text-gray-600">User</TableHead>
                      <TableHead className="font-semibold text-gray-600">Status</TableHead>
                      <TableHead className="font-semibold text-gray-600">Plan</TableHead>
                      <TableHead className="hidden lg:table-cell font-semibold text-gray-600">
                        Verification
                      </TableHead>
                      <TableHead className="font-semibold text-gray-600">Joined</TableHead>
                      <TableHead className="font-semibold text-gray-600">Last Login</TableHead>
                      <TableHead className="text-right font-semibold text-gray-600">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user._id} className="hover:bg-gray-50 transition-colors border-gray-100">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border border-gray-200">
                              <AvatarImage src="" />
                              <AvatarFallback className="bg-blue-50 text-blue-600 text-xs font-medium">
                                {getInitials(user.name, user.email)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium truncate text-foreground">
                                {user.name || 'No name'}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(user)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize font-normal border-gray-200 text-gray-600">
                            {user.subscriptionPlan || "free"}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {user.emailVerified ? (
                            <div className="flex items-center gap-2 text-emerald-600">
                              <ShieldCheck className="h-4 w-4" />
                              <span className="text-sm font-medium">Verified</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-amber-600">
                              <ShieldAlert className="h-4 w-4" />
                              <span className="text-sm font-medium">Pending</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(user.createdAt), "PP")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {user.lastLoginAt
                              ? format(new Date(user.lastLoginAt), "PP")
                              : "Never"}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100">
                                <MoreHorizontal className="h-4 w-4 text-gray-500" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="border-gray-200">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowUserDetails(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-gray-100" />
                              {user._id !== userRecord?._id && (
                                <>
                                  {user.isAdmin ? (
                                    <DropdownMenuItem
                                      onClick={() => handleRemoveAdmin(user._id)}
                                      className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                    >
                                      <UserX className="h-4 w-4 mr-2" />
                                      Remove Admin
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem
                                      onClick={() => handleSetAdmin(user._id)}
                                      className="text-blue-600 focus:text-blue-600 focus:bg-blue-50"
                                    >
                                      <Crown className="h-4 w-4 mr-2" />
                                      Make Admin
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator className="bg-gray-100" />
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteUser(user._id, user.email)}
                                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete User
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {filteredUsers.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground bg-gray-50/50">
                    {searchTerm || statusFilter !== "all" || planFilter !== "all"
                      ? "No users match your filters"
                      : "No users found"}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* User Details Dialog */}
        <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
              <DialogDescription>
                Detailed information about {selectedUser?.email}
              </DialogDescription>
            </DialogHeader>

            {selectedUser && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-lg">
                      {getInitials(selectedUser.name, selectedUser.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">
                      {selectedUser.name || 'No name provided'}
                    </h3>
                    <p className="text-muted-foreground">{selectedUser.email}</p>
                    <div className="flex gap-2 mt-2">
                      {getStatusBadge(selectedUser)}
                      <Badge variant="outline" className="capitalize">
                        {selectedUser.subscriptionPlan || 'free'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">User ID</Label>
                    <p className="text-sm text-muted-foreground font-mono">
                      {selectedUser._id}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Auth UID</Label>
                    <p className="text-sm text-muted-foreground font-mono">
                      {selectedUser.firebaseUid?.slice(0, 20)}...
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Joined</Label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedUser.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Last Login</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedUser.lastLoginAt
                        ? new Date(selectedUser.lastLoginAt).toLocaleDateString()
                        : 'Never'
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUserDetails(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
