"use client";

import { useState } from "react";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { FeatureGate } from "../../components/UpgradePrompt";
import { motion } from "framer-motion";
import { Settings, Bell, User, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SettingsPage() {
  const { user } = useFirebaseAuth();
  const [activeTab, setActiveTab] = useState("profile");

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="mb-4">Please sign in to access settings.</p>
          <a className="underline" href="/sign-in">
            Sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-16">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <motion.div
                initial={{ scale: 0.9, rotate: -4, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 240, damping: 18 }}
                className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center"
              >
                <Settings className="h-5 w-5 text-primary" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-600">Manage your account and preferences</p>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">
                <User className="h-4 w-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="alerts">
                <Bell className="h-4 w-4 mr-2" />
                Alerts
              </TabsTrigger>
              <TabsTrigger value="security">
                <Shield className="h-4 w-4 mr-2" />
                Security
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your personal information and preferences.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Name</label>
                      <p className="text-sm text-gray-600 mt-1">
                        {user.displayName || "Not set"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Email</label>
                      <p className="text-sm text-gray-600 mt-1">{user.email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="alerts" className="space-y-6">
              <FeatureGate feature="customAlerts">
                <Card>
                  <CardHeader>
                    <CardTitle>Custom Job Alerts</CardTitle>
                    <CardDescription>
                      Set up intelligent job alerts based on your preferences and get notified
                      when relevant opportunities become available.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Job Keywords</label>
                          <p className="text-xs text-gray-500">
                            Enter keywords to match in job titles and descriptions
                          </p>
                          <input
                            type="text"
                            placeholder="e.g., React, Node.js, Senior"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Companies</label>
                          <p className="text-xs text-gray-500">
                            Specify companies you&apos;re interested in
                          </p>
                          <input
                            type="text"
                            placeholder="e.g., Google, Microsoft, Apple"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Location</label>
                          <p className="text-xs text-gray-500">
                            Preferred work location
                          </p>
                          <input
                            type="text"
                            placeholder="e.g., San Francisco, Remote"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Salary Range</label>
                          <p className="text-xs text-gray-500">
                            Minimum salary expectation
                          </p>
                          <input
                            type="number"
                            placeholder="80000"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4">
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="email-alerts" className="rounded" />
                          <label htmlFor="email-alerts" className="text-sm">
                            Email notifications
                          </label>
                        </div>
                        <button className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90">
                          Save Alerts
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </FeatureGate>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Account Security</CardTitle>
                  <CardDescription>
                    Manage your account security settings.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Two-Factor Authentication</p>
                        <p className="text-sm text-gray-600">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <button className="text-primary hover:underline">
                        Enable
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Password</p>
                        <p className="text-sm text-gray-600">
                          Last changed 30 days ago
                        </p>
                      </div>
                      <button className="text-primary hover:underline">
                        Change
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
