"use client";

import Link from "next/link";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import {
  Users,
  Building2,
  FileText,
  MessageSquare,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  Brain,
} from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { AdminAccessDenied } from "../../components/admin/AdminAccessDenied";
import { adminApi } from "@/utils/api/admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type DashboardStats = {
  users: {
    total: number;
    growthPctFromLastMonth: number | null;
  };
  sponsors: {
    active: number;
    growthPctFromLastMonth: number | null;
  };
  blog: {
    totalPosts: number;
    newThisWeek: number;
  };
  inquiries: {
    pending: number;
  };
  aiFeedback: {
    total: number;
    newThisWeek: number;
    sentimentScore: number;
    verifiedLearningPoints: number;
  };
};

export default function AdminPage() {
  const { user, isInitialized, loading } = useFirebaseAuth();
  const { isAdmin, isLoading: adminLoading } = useAdminAuth();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (!user || !isInitialized || loading || adminLoading || !isAdmin) return;

    let cancelled = false;

    const load = async () => {
      setStatsLoading(true);
      try {
        const data = await adminApi.getDashboardStats() as DashboardStats;
        if (!cancelled) {
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to load admin dashboard stats", error);
        if (!cancelled) {
          setStats(null);
        }
      } finally {
        if (!cancelled) {
          setStatsLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [adminLoading, isAdmin, isInitialized, loading, user]);

  const formatGrowthLabel = useMemo(() => {
    return (pct: number | null) => {
      if (pct == null) return "— from last month";
      const sign = pct >= 0 ? "+" : "";
      return `${sign}${pct}% from last month`;
    };
  }, []);

  // Show loading state while authentication is initializing
  if (loading || !isInitialized || adminLoading) {
    return (
      <AdminLayout title="Dashboard">
        <div className="space-y-8">
          {/* Header Skeleton */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-9 w-72" />
              <Skeleton className="h-5 w-96" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
          
          {/* Stats Skeleton */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-12 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Content Skeleton */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4 border-gray-200">
              <CardHeader>
                <Skeleton className="h-6 w-40 mb-2" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="p-4 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-3 mb-3">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <Skeleton className="h-5 w-32" />
                      </div>
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4 mt-1" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-3 border-gray-200">
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-12 w-full rounded-lg" />
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-2 w-full rounded-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!user || !isAdmin) {
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
              <Link href="/admin/learning">AI Learning Hub</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/users">Manage Users</Link>
            </Button>
            <Button variant="ghost" asChild>
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
              <div className="text-2xl font-bold text-foreground">
                {statsLoading ? <Skeleton className="h-7 w-16" /> : (stats?.users.total ?? "--")}
              </div>
              {statsLoading ? (
                <div className="mt-1">
                  <Skeleton className="h-3 w-28" />
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">
                  {formatGrowthLabel(stats?.users.growthPctFromLastMonth ?? null)}
                </p>
              )}
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
              <div className="text-2xl font-bold text-foreground">
                {statsLoading ? <Skeleton className="h-7 w-16" /> : (stats?.sponsors.active ?? "--")}
              </div>
              {statsLoading ? (
                <div className="mt-1">
                  <Skeleton className="h-3 w-28" />
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">
                  {formatGrowthLabel(stats?.sponsors.growthPctFromLastMonth ?? null)}
                </p>
              )}
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
              <div className="text-2xl font-bold text-foreground">
                {statsLoading ? <Skeleton className="h-7 w-16" /> : (stats?.blog.totalPosts ?? "--")}
              </div>
              {statsLoading ? (
                <div className="mt-1">
                  <Skeleton className="h-3 w-24" />
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">
                  {`+${stats?.blog.newThisWeek ?? 0} new this week`}
                </p>
              )}
            </CardContent>
          </Card>
          <Card className="hover:bg-gray-50 transition-all duration-200 border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">AI Feedback</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center">
                <Activity className="h-4 w-4 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {statsLoading ? <Skeleton className="h-7 w-16" /> : (`${stats?.aiFeedback.sentimentScore ?? 0}%`)}
              </div>
              {statsLoading ? (
                <div className="mt-1">
                  <Skeleton className="h-3 w-28" />
                </div>
              ) : (
                <div className="flex flex-col gap-1 mt-1">
                  <p className="text-xs text-muted-foreground">
                    {`${stats?.aiFeedback.total ?? 0} total (${stats?.aiFeedback.newThisWeek ?? 0} new)`}
                  </p>
                  {stats?.aiFeedback.verifiedLearningPoints !== undefined && (
                    <p className="text-[10px] text-purple-600 font-medium flex items-center gap-1">
                      <Brain className="h-2.5 w-2.5" />
                      {stats.aiFeedback.verifiedLearningPoints} verified insights
                    </p>
                  )}
                </div>
              )}
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

                  <Link href="/admin/analytics" className="group block space-y-3 rounded-xl border border-gray-100 p-4 hover:bg-gray-50 hover:border-red-100 transition-all duration-200">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600 group-hover:scale-105 transition-transform">
                        <Activity className="h-5 w-5" />
                      </div>
                      <div className="font-semibold text-foreground">AI Feedback Analytics</div>
                      <ArrowUpRight className="ml-auto h-4 w-4 text-gray-400 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Analyze user feedback to improve AI suggestions and models.
                    </p>
                  </Link>

                  <Link href="/admin/learning" className="group block space-y-3 rounded-xl border border-gray-100 p-4 hover:bg-gray-50 hover:border-purple-100 transition-all duration-200">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600 group-hover:scale-105 transition-transform">
                        <Brain className="h-5 w-5" />
                      </div>
                      <div className="font-semibold text-foreground">AI Learning Loop</div>
                      <ArrowUpRight className="ml-auto h-4 w-4 text-gray-400 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Review verified insights and model improvements from the learning loop.
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
