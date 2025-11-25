"use client";

import React from "react";
import { motion } from "framer-motion";
import { User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface ProfileSettingsProps {
  formData: {
    profile: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      avatar: string;
    };
  };
  onInputChange: (section: string, field: string, value: any) => void;
  firebaseUser: any;
}

export function ProfileSettings({ formData, onInputChange, firebaseUser }: ProfileSettingsProps) {
  const toast = useToast();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <Card className="card-premium-elevated border-0 bg-surface">
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
            <div className="space-y-3">
              <Label htmlFor="firstName" className="text-sm font-semibold text-foreground">
                First Name
              </Label>
              <Input
                id="firstName"
                type="text"
                value={formData.profile.firstName}
                onChange={(e) => onInputChange("profile", "firstName", e.target.value)}
                placeholder="First name"
                className="input-premium"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="lastName" className="text-sm font-semibold text-foreground">
                Last Name
              </Label>
              <Input
                id="lastName"
                type="text"
                value={formData.profile.lastName}
                onChange={(e) => onInputChange("profile", "lastName", e.target.value)}
                placeholder="Last name"
                className="input-premium"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="email" className="text-sm font-semibold text-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.profile.email}
                onChange={(e) => onInputChange("profile", "email", e.target.value)}
                placeholder="Email address"
                className="input-premium"
                disabled={!!firebaseUser?.email}
              />
              {firebaseUser?.email && (
                <p className="text-sm text-muted-foreground">
                  Email cannot be changed. Contact support if needed.
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="phone" className="text-sm font-semibold text-foreground">
                Phone
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.profile.phone}
                onChange={(e) => onInputChange("profile", "phone", e.target.value)}
                placeholder="Phone number"
                className="input-premium"
                disabled
              />
              <p className="text-sm text-muted-foreground">
                Phone number cannot be changed here.
              </p>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
