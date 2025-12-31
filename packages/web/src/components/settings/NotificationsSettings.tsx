"use client";

import React from "react";
import { motion } from "framer-motion";
import { Bell, Mail, Send, Smartphone, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormControl, FormLabel, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { HelpTooltip } from "@/components/ui/HelpTooltip";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function NotificationsSettings() {
  const { control } = useFormContext();
  const toast = useToast();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="space-y-6"
    >
      <Card variant="premium" className="overflow-hidden">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Notification Preferences</CardTitle>
              <CardDescription>
                Choose how and when you want to stay updated
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={control}
              name="preferences.emailNotifications"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between p-4 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Mail className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-semibold flex items-center gap-1.5">
                        Email Alerts
                        <HelpTooltip content="Critical updates about your account and job applications." />
                      </FormLabel>
                      <FormDescription className="text-xs">
                        Updates about your applications
                      </FormDescription>
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="preferences.pushNotifications"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between p-4 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-teal-500/10">
                      <Smartphone className="h-4 w-4 text-teal-600" />
                    </div>
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-semibold flex items-center gap-1.5">
                        Push Notifications
                        <HelpTooltip content="Real-time alerts in your browser even when Hireall is closed." />
                      </FormLabel>
                      <FormDescription className="text-xs">
                        Real-time browser alerts
                      </FormDescription>
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          if (typeof window !== "undefined" && "Notification" in window) {
                            void Notification.requestPermission().then((permission) => {
                              if (permission !== "granted") {
                                field.onChange(false);
                                toast.info(
                                  "Permission denied",
                                  "Please enable notifications in your browser settings."
                                );
                              } else {
                                // Register service worker for push
                                if ("serviceWorker" in navigator) {
                                  void navigator.serviceWorker.ready.then((registration) => {
                                    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
                                    if (!publicKey) {
                                      console.error("VAPID public key missing");
                                      return;
                                    }

                                    return registration.pushManager.subscribe({
                                      userVisibleOnly: true,
                                      applicationServerKey: urlBase64ToUint8Array(publicKey),
                                    });
                                  }).then((subscription) => {
                                    if (subscription) {
                                      // Send subscription to server
                                      return fetch("/api/settings/notifications/push", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ subscription }),
                                      });
                                    }
                                  }).then((res) => {
                                    if (res?.ok) {
                                      field.onChange(true);
                                      toast.success("Notifications enabled", "You will now receive real-time updates.");
                                    } else if (res) {
                                      throw new Error("Failed to save subscription");
                                    }
                                  }).catch((error) => {
                                    console.error("Push subscription failed:", error);
                                    toast.error("Bridge failed", "Could not connect to browser notification service.");
                                    field.onChange(false);
                                  });
                                } else {
                                  field.onChange(true);
                                }
                              }
                            });
                          } else {
                            toast.error("Browser unsupported");
                            field.onChange(false);
                          }
                        } else {
                          field.onChange(false);
                        }
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="preferences.newsletter"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between p-4 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <Send className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-semibold flex items-center gap-1.5">
                        Weekly Digest
                        <HelpTooltip content="A summary of new jobs matching your profile sent every Monday." />
                      </FormLabel>
                      <FormDescription className="text-xs">
                        Weekly job tips and trends
                      </FormDescription>
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="preferences.marketingEmails"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between p-4 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-500/10">
                      <Zap className="h-4 w-4 text-orange-600" />
                    </div>
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-semibold flex items-center gap-1.5">
                        Promotions
                        <HelpTooltip content="Special offers, new feature announcements, and partnership deals." />
                      </FormLabel>
                      <FormDescription className="text-xs">
                        New features and offers
                      </FormDescription>
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
