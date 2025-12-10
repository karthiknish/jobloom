"use client";

import Link from "next/link";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Building2,
  FileText,
  MessageSquare,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { useApiQuery } from "../../hooks/useApi";
import { adminApi } from "../../utils/api/admin";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { AdminAccessDenied } from "../../components/admin/AdminAccessDenied";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminPage() {
  const { user, isInitialized, loading } = useFirebaseAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // Check if user is admin
  const loadUserRecord = useCallback(() => {
    if (user && user.uid) {
      return adminApi.getUserByFirebaseUid(user.uid);
    }
    return Promise.reject(new Error("No user"));
  }, [user?.uid]);

  const { data: userRecord, loading: userRecordLoading, error: userRecordError } = useApiQuery(
    loadUserRecord,
    [user?.uid],
    { enabled: !!user?.uid },
    "admin-user-record"
  );

  // Check admin status
  useEffect(() => {
    if (userRecord !== undefined) {
      // userRecord is loaded - check if admin (null means user not found = not admin)
      setIsAdmin(userRecord?.isAdmin === true);
    } else if (userRecordError) {
      // Error loading user record - treat as not admin
      console.error('Error loading user record for admin check:', userRecordError);
      setIsAdmin(false);
    }
  }, [userRecord, userRecordError]);

  // Also handle case where query completed but userRecord is null
  useEffect(() => {
    if (!userRecordLoading && userRecord === null && isAdmin === null) {
      // Query completed, no user record found - not admin
      setIsAdmin(false);
    }
  }, [userRecordLoading, userRecord, isAdmin]);

  // Show loading state while authentication is initializing
  if (loading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AdminAccessDenied />;
  }

  // Show loading state while checking admin status
  if (isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Verifying permissions...</p>
        </div>
      </div>
    );
  }

  // Show access denied if user is not admin
  if (!isAdmin) {
    return <AdminAccessDenied />;
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <AdminLayout title="Dashboard">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-8"
      >
        {/* Welcome Section */}
        <motion.div variants={item} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Welcome back, {user.displayName?.split(' ')[0] || 'Admin'}</h2>
            <p className="text-muted-foreground">
              Here's what's happening with your platform today.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild>
              <Link href="/admin/users">Manage Users</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">View Site</Link>
            </Button>
          </div>
        </motion.div>

        {/* Quick Stats Grid */}
        <motion.div variants={item} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:bg-gray-50 transition-all duration-200 border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">--</div>
              <p className="text-xs text-muted-foreground mt-1">
                +0% from last month
              </p>
            </CardContent>
          </Card>
          <Card className="hover:bg-gray-50 transition-all duration-200 border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Sponsors</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">--</div>
              <p className="text-xs text-muted-foreground mt-1">
                +0% from last month
              </p>
            </CardContent>
          </Card>
          <Card className="hover:bg-gray-50 transition-all duration-200 border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Blog Posts</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center">
                <FileText className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">--</div>
              <p className="text-xs text-muted-foreground mt-1">
                +0 new this week
              </p>
            </CardContent>
          </Card>
          <Card className="hover:bg-gray-50 transition-all duration-200 border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Inquiries</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-orange-50 flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">--</div>
              <p className="text-xs text-muted-foreground mt-1">
                Requires attention
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          {/* Recent Activity / Overview */}
          <motion.div variants={item} className="col-span-4">
            <Card className="h-full border-gray-200">
              <CardHeader>
                <CardTitle>Platform Overview</CardTitle>
                <CardDescription>
                  Quick access to key management areas.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <Link href="/admin/users" className="group block space-y-3 rounded-xl border border-gray-100 p-4 hover:bg-gray-50 hover:border-blue-100 transition-all duration-200">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 group-hover:scale-105 transition-transform">
                        <Users className="h-5 w-5" />
                      </div>
                      <div className="font-semibold text-foreground">User Management</div>
                      <ArrowUpRight className="ml-auto h-4 w-4 text-gray-400 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Manage user accounts, roles, and permissions. View user growth and activity.
                    </p>
                  </Link>

                  <Link href="/admin/sponsors" className="group block space-y-3 rounded-xl border border-gray-100 p-4 hover:bg-gray-50 hover:border-green-100 transition-all duration-200">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600 group-hover:scale-105 transition-transform">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div className="font-semibold text-foreground">Sponsors</div>
                      <ArrowUpRight className="ml-auto h-4 w-4 text-gray-400 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Manage sponsored companies and track sponsorship performance.
                    </p>
                  </Link>

                  <Link href="/admin/blog" className="group block space-y-3 rounded-xl border border-gray-100 p-4 hover:bg-gray-50 hover:border-purple-100 transition-all duration-200">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600 group-hover:scale-105 transition-transform">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="font-semibold text-foreground">Blog Posts</div>
                      <ArrowUpRight className="ml-auto h-4 w-4 text-gray-400 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Create and edit blog content. Manage categories and tags.
                    </p>
                  </Link>

                  <Link href="/admin/contact" className="group block space-y-3 rounded-xl border border-gray-100 p-4 hover:bg-gray-50 hover:border-orange-100 transition-all duration-200">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600 group-hover:scale-105 transition-transform">
                        <MessageSquare className="h-5 w-5" />
                      </div>
                      <div className="font-semibold text-foreground">Inquiries</div>
                      <ArrowUpRight className="ml-auto h-4 w-4 text-gray-400 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      View and respond to contact form submissions.
                    </p>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* System Status / Recent Actions */}
          <motion.div variants={item} className="col-span-3">
            <Card className="h-full border-gray-200">
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>
                  Operational metrics and health checks.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                    <div className="flex items-center gap-3">
                      <div className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                      </div>
                      <span className="text-sm font-medium text-emerald-700">System Operational</span>
                    </div>
                    <span className="text-xs text-emerald-600">Updated just now</span>
                  </div>

                  <div className="space-y-5">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Database Connection</span>
                        <span className="text-emerald-600 font-medium text-xs bg-emerald-50 px-2 py-0.5 rounded-full">Healthy</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full w-full bg-emerald-500 rounded-full" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">API Latency</span>
                        <span className="text-emerald-600 font-medium text-xs bg-emerald-50 px-2 py-0.5 rounded-full">45ms</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full w-[95%] bg-emerald-500 rounded-full" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Storage Usage</span>
                        <span className="text-blue-600 font-medium text-xs bg-blue-50 px-2 py-0.5 rounded-full">24%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full w-[24%] bg-blue-500 rounded-full" />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-4 border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">Security Status</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      No security incidents reported in the last 24 hours. All systems are running normally.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </AdminLayout>
  );
}
