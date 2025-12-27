"use client";

import React from "react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";

interface ProfileSettingsProps {
  firebaseUser: any;
}

export function ProfileSettings({ firebaseUser }: ProfileSettingsProps) {
  const { control, watch } = useFormContext();
  const formData = watch();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <Card variant="premium" className="elevated border-0 bg-surface">
        <CardHeader>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <CardTitle className="text-2xl font-bold text-foreground">Profile Information</CardTitle>
            <CardDescription className="text-muted-foreground text-lg">
              Update your personal information
            </CardDescription>
          </motion.div>
        </CardHeader>
        <CardContent className="space-y-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex items-center gap-6"
          >
            <Avatar className="h-24 w-24">
              <AvatarImage src={formData.profile.avatar} alt="Profile" />
              <AvatarFallback className="text-xl bg-primary/10 text-primary">
                {formData.profile.firstName?.[0]}{formData.profile.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h3 className="text-lg font-medium text-foreground">
                {formData.profile.firstName} {formData.profile.lastName}
              </h3>
              <p className="text-sm text-muted-foreground">
                {formData.profile.email}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <FormField
              control={control}
              name="profile.firstName"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <Label className="text-sm font-semibold text-foreground">
                    First Name
                  </Label>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="First name"
                      className="input-premium"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="profile.lastName"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <Label className="text-sm font-semibold text-foreground">
                    Last Name
                  </Label>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Last name"
                      className="input-premium"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="profile.email"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <Label className="text-sm font-semibold text-foreground">
                    Email
                  </Label>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="Email address"
                      className="input-premium"
                      disabled={!!firebaseUser?.email}
                    />
                  </FormControl>
                  {firebaseUser?.email && (
                    <p className="text-sm text-muted-foreground">
                      Email cannot be changed. Contact support if needed.
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="profile.phone"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <Label className="text-sm font-semibold text-foreground">
                    Phone
                  </Label>
                  <FormControl>
                    <Input
                      {...field}
                      type="tel"
                      placeholder="Phone number"
                      className="input-premium"
                      disabled
                    />
                  </FormControl>
                  <p className="text-sm text-muted-foreground">
                    Phone number cannot be changed here.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
