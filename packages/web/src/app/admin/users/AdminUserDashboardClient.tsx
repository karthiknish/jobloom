"use client";

import {
  UserStatsCards,
  UserVerificationSnapshot,
  UserQuickActions,
  RecentUsersTable,
  UserDistribution,
  UserFilters,
  DashboardUserTable,
  CreateUserDialog
} from "./components";
import { User, UserStats, VerificationStats } from "./types";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Users, UserPlus, RefreshCw, AlertCircle } from "lucide-react";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import {
  useAdminUserStats,
  useAdminUsers,
  useAdminCreateUser,
  useAdminUpdateUser,
  useAdminDeleteUser,
  useAdminSetAdmin,
  useAdminRemoveAdmin
} from "@/hooks/queries";
import { cn } from "@/lib/utils";
import { adminApi } from "@/utils/api/admin";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminAccessDenied } from "@/components/admin/AdminAccessDenied";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { showError, showSuccess, showWarning } from "@/components/ui/Toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { exportToCsv } from "@/utils/exportToCsv";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";

export default function AdminUserDashboardClient() {
  const { user } = useFirebaseAuth();
  const { isAdmin, isLoading: adminLoading, userRecord } = useAdminAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    variant: "default" | "destructive";
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => { },
    variant: "default",
  });

  const canFetchAdminData = isAdmin === true;

  // Fetch user stats
  const {
    data: userStats,
    refetch: refetchStats,
    error: statsError,
    isLoading: isStatsLoading
  } = useAdminUserStats(canFetchAdminData);

  // Fetch all users
  const {
    data: usersData,
    refetch: refetchUsers,
    error: usersError,
    isLoading: isUsersLoading
  } = useAdminUsers(canFetchAdminData);

  // Admin action mutations
  const { mutateAsync: setAdminUser } = useAdminSetAdmin();
  const { mutateAsync: removeAdminUser } = useAdminRemoveAdmin();
  const { mutateAsync: deleteUser } = useAdminDeleteUser();
  const { mutateAsync: createUser, isPending: isCreating } = useAdminCreateUser();
  const { mutateAsync: updateUser, isPending: isUpdating } = useAdminUpdateUser();

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

  const handleCreateUser = async (data: any) => {
    try {
      if (dialogMode === 'create') {
        await createUser(data);
        showSuccess("User created successfully");
      } else if (selectedUser) {
        await updateUser({ userId: selectedUser._id, data });
        showSuccess("User updated successfully");
      }
      setShowCreateUser(false);
      setSelectedUser(null);
    } catch (error: any) {
      showError(error.message || `Failed to ${dialogMode} user`);
    }
  };

  const openCreateDialog = () => {
    setDialogMode('create');
    setSelectedUser(null);
    setShowCreateUser(true);
  };

  const openEditDialog = (user: User) => {
    setDialogMode('edit');
    setSelectedUser(user);
    setShowCreateUser(true);
  };

  const handleSetAdmin = async (userId: string) => {
    try {
      if (!userRecord?._id) throw new Error("No admin context id");
      await setAdminUser({ userId, requesterId: userRecord._id });
      showSuccess("User granted admin privileges");
    } catch (error) {
      showError("Failed to grant admin privileges");
    }
  };

  const handleRemoveAdmin = async (userId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Remove Admin Privileges",
      description: "Are you sure you want to remove admin privileges from this user?",
      variant: "destructive",
      onConfirm: async () => {
        try {
          if (!userRecord?._id) throw new Error("No admin context id");
          await removeAdminUser({ userId, requesterId: userRecord._id });
          showSuccess("Admin privileges removed");
        } catch (error) {
          showError("Failed to remove admin privileges");
        }
      },
    });
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete User",
      description: `Are you sure you want to delete user ${userEmail}? This action cannot be undone.`,
      variant: "destructive",
      onConfirm: async () => {
        try {
          await deleteUser(userId);
          showSuccess("User deleted successfully");
        } catch (error) {
          showError("Failed to delete user");
        }
      },
    });
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

  if (adminLoading || isStatsLoading || isUsersLoading) {
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

            <Button onClick={openCreateDialog} className="w-full sm:w-auto">
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>
        </motion.div>

        {/* Global Error State for critical data */}
        {(statsError || usersError) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl bg-red-50 border border-red-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-red-900">Connection Error</h3>
                <p className="text-xs text-red-700">Some dashboard data failed to load. Please try refreshing.</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshData}
              disabled={isRefreshing}
              className="border-red-200 hover:bg-red-100 text-red-700 w-full sm:w-auto"
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
              Retry Everything
            </Button>
          </motion.div>
        )}

        {/* Stats Cards */}
        {userStats && <UserStatsCards userStats={userStats} />}

        {/* Subscription Plan Distribution & Verification */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"
        >
          {userStats && <UserDistribution userStats={userStats} />}
          <UserVerificationSnapshot verificationStats={verificationStats} />

          <UserQuickActions
            onCopyEmails={handleCopyEmails}
            onCopyAdminEmails={handleCopyAdminEmails}
            onCopyUnverifiedEmails={handleCopyUnverifiedEmails}
            onExportUsers={handleExportUsers}
            onRefreshData={handleRefreshData}
            isRefreshing={isRefreshing}
          />
        </motion.div>

        {/* Recent Activity */}
        {(recentUsers.length > 0 || recentAdmins.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="grid grid-cols-1 gap-6 xl:grid-cols-2"
          >
            <RecentUsersTable
              users={recentUsers}
              title="Recent Signups"
              description="Latest users added to the platform"
            />
            <RecentUsersTable
              users={recentAdmins}
              title="Recent Admin Approvals"
              description="Who recently gained admin access"
              isAdmin
            />
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
              <UserFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                planFilter={planFilter}
                onPlanFilterChange={setPlanFilter}
              />

              <DashboardUserTable
                users={filteredUsers}
                currentAdminId={userRecord?._id}
                onViewDetails={(u) => {
                  setSelectedUser(u);
                  setShowUserDetails(true);
                }}
                onEditUser={openEditDialog}
                onSetAdmin={handleSetAdmin}
                onRemoveAdmin={handleRemoveAdmin}
                onDeleteUser={handleDeleteUser}
                onRetry={refetchUsers}
                isLoading={isUsersLoading}
                error={usersError}
                searchTerm={searchTerm}
                statusFilter={statusFilter}
                planFilter={planFilter}
                getInitials={getInitials}
                getStatusBadge={getStatusBadge}
              />
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

        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          onOpenChange={(isOpen) => setConfirmDialog(prev => ({ ...prev, isOpen }))}
          title={confirmDialog.title}
          description={confirmDialog.description}
          onConfirm={confirmDialog.onConfirm}
          variant={confirmDialog.variant}
        />

        <CreateUserDialog
          open={showCreateUser}
          onOpenChange={(open) => {
            setShowCreateUser(open);
            if (!open) {
              setSelectedUser(null);
            }
          }}
          onSubmit={handleCreateUser}
          isSubmitting={isCreating || isUpdating}
          initialData={selectedUser}
          mode={dialogMode}
        />
      </div>
    </AdminLayout>
  );
}
