"use client";

import { useUser } from "@clerk/nextjs";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { motion } from "framer-motion";

export default function AccountPage() {
  const { user } = useUser();

  if (!user) {
    return <div>Please sign in to access your account.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 mt-14">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-gradient-to-r from-primary to-secondary shadow-lg py-8"
      >
        <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-white">Account Settings</h1>
          <p className="mt-2 text-primary-foreground/80">
            Manage your account and preferences
          </p>
        </div>
      </motion.div>

      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Profile Information */}
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
                  <p className="text-sm font-medium text-gray-700">Name</p>
                  <p className="mt-1 text-sm text-gray-900">{user.fullName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Email</p>
                  <p className="mt-1 text-sm text-gray-900">
                    {user.emailAddresses[0]?.emailAddress}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Member Since
                  </p>
                  <p className="mt-1 text-sm text-gray-900">
                    {format(new Date(user.createdAt!), "MMMM d, yyyy")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Usage Statistics</CardTitle>
              <CardDescription>
                Your activity and usage on Jobloom
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">0</div>
                  <div className="text-sm text-gray-500">Jobs Tracked</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">0</div>
                  <div className="text-sm text-gray-500">Applications</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-secondary">0</div>
                  <div className="text-sm text-gray-500">Interviews</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
