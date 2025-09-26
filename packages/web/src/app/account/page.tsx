"use client";

import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  Settings,
  Briefcase,
  ClipboardList,
  CalendarCheck,
} from "lucide-react";

export default function AccountPage() {
  const { user, loading } = useFirebaseAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-muted mt-14">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted-foreground/20 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              <div className="h-32 bg-muted-foreground/20 rounded"></div>
              <div className="h-32 bg-muted-foreground/20 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center mt-14">
        <div className="text-center">
          <p className="mb-4">Please sign in to access your account.</p>
          <a className="underline" href="/sign-in">
            Sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted mt-14">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-gradient-to-r from-primary to-secondary shadow-lg py-8"
      >
        <div className="max-w-7xl mx-auto py-2 px-4 sm:px-6 lg:px-8">
          <div className="flex items-start sm:items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-white/10 ring-1 ring-white/20 flex items-center justify-center">
              <Settings className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                Account Settings
              </h1>
              <p className="mt-2 text-primary-foreground/80">
                Manage your account and preferences
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Profile Information */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            whileHover={{ scale: 1.01 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Your account details and information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">Name</p>
                    <p className="mt-1 text-sm text-foreground">
                      {user.displayName || user.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Email</p>
                    <p className="mt-1 text-sm text-foreground">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Member Since
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {user.metadata?.creationTime
                        ? format(
                            new Date(user.metadata.creationTime),
                            "MMMM d, yyyy"
                          )
                        : "—"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Usage Statistics */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Usage Statistics</CardTitle>
                <CardDescription>
                  Your activity and usage on Hireall
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    whileHover={{ y: -2 }}
                    className="text-center"
                  >
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Briefcase className="h-5 w-5 text-primary" />
                    </div>
                    <div className="mt-2 text-2xl font-bold text-primary">
                      0
                    </div>
                    <div className="text-sm text-muted-foreground">Jobs Tracked</div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    whileHover={{ y: -2 }}
                    className="text-center"
                  >
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
                      <ClipboardList className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="mt-2 text-2xl font-bold text-emerald-600">
                      0
                    </div>
                    <div className="text-sm text-muted-foreground">Applications</div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    whileHover={{ y: -2 }}
                    className="text-center"
                  >
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10">
                      <CalendarCheck className="h-5 w-5 text-secondary" />
                    </div>
                    <div className="mt-2 text-2xl font-bold text-secondary">
                      0
                    </div>
                    <div className="text-sm text-muted-foreground">Interviews</div>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
