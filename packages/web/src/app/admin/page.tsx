"use client";

import Link from "next/link";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { useState, useEffect, useCallback } from "react";
import { useApiQuery } from "../../hooks/useApi";
import { adminApi } from "../../utils/api/admin";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { AdminAccessDenied } from "../../components/admin/AdminAccessDenied";

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

  const { data: userRecord, refetch: refetchUserRecord } = useApiQuery(
    loadUserRecord,
    [user?.uid],
    { enabled: !!user?.uid },
    "admin-user-record"
  );

  // Check admin status
  useEffect(() => {
    if (userRecord) {
      setIsAdmin(userRecord.isAdmin === true);
    }
  }, [userRecord]);

  const canLoadAdminData = !!user && isAdmin === true;

  // Show loading state while authentication is initializing
  if (loading || !isInitialized) {
    return (
      <AdminLayout title="Admin Panel">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading authentication...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!user) {
    return (
      <AdminLayout title="Admin Panel">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-red-500 text-5xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Authentication Required</h2>
          <p className="text-muted-foreground mb-6 text-center max-w-md">
            Please sign in to access the admin panel. You need administrator privileges to access this page.
          </p>
          <div className="space-y-3">
            <Link
              href="/sign-in?redirect_url=/admin"
              className="inline-block bg-primary text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors w-full text-center"
            >
              Sign In
            </Link>
            <Link
              href="/"
              className="inline-block bg-secondary text-secondary-foreground px-6 py-3 rounded-md text-sm font-medium hover:bg-secondary/90 transition-colors w-full text-center"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Show loading state while checking admin status
  if (isAdmin === null) {
    return (
      <AdminLayout title="Admin Panel">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Checking admin permissions...</p>
        </div>
      </AdminLayout>
    );
  }

  // Show access denied if user is not admin
  if (!isAdmin) {
    return <AdminAccessDenied />;
  }

  return (
    <AdminLayout title="Admin Panel">
      {/* Quick Access Links */}
      <div className="mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/admin/users"
            className="group block p-6 bg-card border border-border rounded-lg hover:border-primary/50 transition-all duration-200 hover:shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <svg className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">User Management</h3>
            <p className="text-sm text-muted-foreground">
              Manage user accounts, view analytics, and handle user permissions across the platform.
            </p>
          </Link>

          <Link
            href="/admin/sponsors"
            className="group block p-6 bg-card border border-border rounded-lg hover:border-primary/50 transition-all duration-200 hover:shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <svg className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Sponsor Management</h3>
            <p className="text-sm text-muted-foreground">
              Manage sponsored companies, view sponsorship analytics, and handle partnership data.
            </p>
          </Link>

          <Link
            href="/admin/blog"
            className="group block p-6 bg-card border border-border rounded-lg hover:border-primary/50 transition-all duration-200 hover:shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <svg className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Blog Management</h3>
            <p className="text-sm text-muted-foreground">
              Create, edit, and manage blog posts, articles, and content across the platform.
            </p>
          </Link>

          <Link
            href="/admin/contact"
            className="group block p-6 bg-card border border-border rounded-lg hover:border-primary/50 transition-all duration-200 hover:shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <svg className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Contact Management</h3>
            <p className="text-sm text-muted-foreground">
              View and manage contact form submissions, inquiries, and customer support messages.
            </p>
          </Link>

          <Link
            href="/admin/email-marketing"
            className="group block p-6 bg-card border border-border rounded-lg hover:border-primary/50 transition-all duration-200 hover:shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12l4-4m0 0l-4-4m4 4H12" />
                </svg>
              </div>
              <svg className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Email Marketing</h3>
            <p className="text-sm text-muted-foreground">
              Create and manage email campaigns, newsletters, and marketing automation workflows.
            </p>
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}