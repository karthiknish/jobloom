"use client";

import React from "react";
import { motion } from "framer-motion";
import { Camera, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface ProfileSettingsProps {
  formData: {
    profile: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      location: string;
      title: string;
      company: string;
      bio: string;
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
            <div className="space-y-3">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="outline"
                  onClick={() => {
                    toast.success(
                      "Avatar uploaded",
                      "Your profile picture has been updated."
                    );
                  }}
                  className="btn-premium gap-2"
                >
                  <Camera className="h-4 w-4" />
                  Change Avatar
                </Button>
              </motion.div>
              <p className="text-sm text-muted-foreground">
                JPG, PNG or GIF. Max size 2MB
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
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="location" className="text-sm font-semibold text-foreground">
                Location
              </Label>
              <Input
                id="location"
                type="text"
                value={formData.profile.location}
                onChange={(e) => onInputChange("profile", "location", e.target.value)}
                placeholder="City, Country"
                className="input-premium"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="title" className="text-sm font-semibold text-foreground">
                Professional Title
              </Label>
              <Input
                id="title"
                type="text"
                value={formData.profile.title}
                onChange={(e) => onInputChange("profile", "title", e.target.value)}
                placeholder="e.g. Software Engineer"
                className="input-premium"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="company" className="text-sm font-semibold text-foreground">
                Company
              </Label>
              <Input
                id="company"
                type="text"
                value={formData.profile.company}
                onChange={(e) => onInputChange("profile", "company", e.target.value)}
                placeholder="Company name"
                className="input-premium"
              />
            </div>

            <div className="space-y-3 md:col-span-2">
              <Label htmlFor="bio" className="text-sm font-semibold text-foreground">
                Bio
              </Label>
              <Textarea
                id="bio"
                value={formData.profile.bio}
                onChange={(e) => onInputChange("profile", "bio", e.target.value)}
                placeholder="Tell us about yourself..."
                rows={4}
                className="input-premium resize-none"
              />
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
