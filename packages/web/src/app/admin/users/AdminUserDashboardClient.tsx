"use client";

import { useState, useEffect, useMemo } from "react";
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
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check admin status
  const { data: userRecord } = useApiQuery(
    () =>
      user && user.uid
        ? adminApi.getUserByFirebaseUid(user.uid)
        : Promise.reject(new Error("No user")),
    [user?.uid]
  );

  // Fetch user stats
  const { data: userStats, refetch: refetchStats } = useApiQuery(
    () => adminApi.getUserStats(),
    []
  );

  // Fetch all users with pagination
  const { data: usersData, refetch: refetchUsers } = useApiQuery(
    () => adminApi.getAllUsers(),
    []
  );

  useEffect(() => {
    if (userRecord) {
      setIsAdmin(userRecord.isAdmin === true);
    }
  }, [userRecord]);

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
    return adminApi.deleteUser(userId, userRecord._id);
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

  if (isAdmin === null) {
    return (
      <AdminLayout title="User Dashboard">
        <div>Checking admin permissions...</div>
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">User Dashboard</h1>
                <p className="text-muted-foreground">Manage users, permissions, and account statistics</p>
              </div>
            </div>

            <Button onClick={() => setShowCreateUser(true)}>
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
            <Card className="card-depth-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  +{userStats.newUsersThisMonth} this month
                </p>
              </CardContent>
            </Card>

            <Card className="card-depth-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats.activeUsers}</div>
                <p className="text-xs text-muted-foreground">
                  Recently active
                </p>
              </CardContent>
            </Card>

            <Card className="card-depth-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
                <Crown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats.adminUsers}</div>
                <p className="text-xs text-muted-foreground">
                  System administrators
                </p>
              </CardContent>
            </Card>

            <Card className="card-depth-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Logins</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats.recentLogins}</div>
                <p className="text-xs text-muted-foreground">
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
            <Card className="card-depth-2 xl:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Subscription Distribution
                </CardTitle>
                <CardDescription>User distribution by subscription plan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(userStats.usersByPlan).map(([plan, count]) => (
                    <div key={plan} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            plan === "free"
                              ? "bg-muted-foreground"
                              : plan === "premium"
                              ? "bg-primary"
                              : plan === "enterprise"
                              ? "bg-accent"
                              : "bg-secondary"
                          }`}
                        />
                        <span className="capitalize">{plan}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium">{count}</div>
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              plan === "free"
                                ? "bg-muted-foreground"
                                : plan === "premium"
                                ? "bg-primary"
                                : plan === "enterprise"
                                ? "bg-accent"
                                : "bg-secondary"
                            }`}
                            style={{
                              width: `${userStats.totalUsers
                                ? (count / userStats.totalUsers) * 100
                                : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="card-depth-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Verification Snapshot
                </CardTitle>
                <CardDescription>Email verification & health signals</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm font-medium">Verified</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {verificationStats.verified} users ({verificationStats.verificationRate}% )
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-medium">Unverified</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {verificationStats.unverified} users
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-slate-500" />
                    <span className="text-sm font-medium">Never logged in</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {verificationStats.neverLoggedIn}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium">Dormant (&gt; 30 days)</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {verificationStats.dormant}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Use these insights to re-engage users or trigger verification reminders.
                </div>
              </CardContent>
            </Card>

            <Card className="card-depth-2 xl:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Quick Actions
                </CardTitle>
                <CardDescription>Applies to the currently filtered users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={handleCopyEmails}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy all emails
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={handleCopyAdminEmails}
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Copy admin emails
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={handleCopyUnverifiedEmails}
                  >
                    <ShieldAlert className="h-4 w-4 mr-2" />
                    Copy unverified emails
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={handleExportUsers}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export filtered users
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={handleRefreshData}
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                    {isRefreshing ? "Refreshing..." : "Refresh metrics"}
                  </Button>
                  <div className="sm:col-span-2 lg:col-span-3 text-xs text-muted-foreground">
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
              <Card className="card-depth-2">
                <CardHeader>
                  <CardTitle>Recent Signups</CardTitle>
                  <CardDescription>Latest users added to the platform</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="hidden sm:table-cell">Status</TableHead>
                        <TableHead className="text-right">Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentUsers.map((recentUser) => (
                        <TableRow key={recentUser._id}>
                          <TableCell className="font-medium flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={`https://www.gravatar.com/avatar/${btoa(
                                  recentUser.email.trim().toLowerCase()
                                )}?d=identicon`}
                                alt={recentUser.name || recentUser.email}
                              />
                              <AvatarFallback>
                                {getInitials(recentUser.name, recentUser.email)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate">
                                {recentUser.name || "Unnamed User"}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                Joined {formatDistanceToNow(recentUser.createdAt, { addSuffix: true })}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
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
              <Card className="card-depth-2">
                <CardHeader>
                  <CardTitle>Recent Admin Approvals</CardTitle>
                  <CardDescription>Who recently gained admin access</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Admin</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-right">Added</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentAdmins.map((adminUser) => (
                        <TableRow key={adminUser._id}>
                          <TableCell className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src="" alt={adminUser.name || adminUser.email} />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {getInitials(adminUser.name, adminUser.email)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate font-medium">
                                {adminUser.name || "Unnamed Admin"}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                Admin since {formatDistanceToNow(adminUser.createdAt, { addSuffix: true })}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
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
          className="card-depth-2"
        >
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              Search, filter, and manage all user accounts ({filteredUsers.length} users)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
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
                <SelectTrigger className="w-[150px]">
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
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Verification
                    </TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="" />
                            <AvatarFallback className="text-xs">
                              {getInitials(user.name, user.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate">
                              {user.name || 'No name'}
                            </div>
                            <div className="text-sm text-muted-foreground truncate">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(user)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
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
                        <div className="text-sm">
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
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
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
                            <DropdownMenuSeparator />
                            {user._id !== userRecord?._id && (
                              <>
                                {user.isAdmin ? (
                                  <DropdownMenuItem
                                    onClick={() => handleRemoveAdmin(user._id)}
                                    className="text-red-600"
                                  >
                                    <UserX className="h-4 w-4 mr-2" />
                                    Remove Admin
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() => handleSetAdmin(user._id)}
                                    className="text-sky-600"
                                  >
                                    <Crown className="h-4 w-4 mr-2" />
                                    Make Admin
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeleteUser(user._id, user.email)}
                                  className="text-red-600"
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
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm || statusFilter !== "all" || planFilter !== "all"
                    ? "No users match your filters"
                    : "No users found"}
                </div>
              )}
            </div>
          </CardContent>
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
