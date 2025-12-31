"use client";

import React from "react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { Camera, Loader2 } from "lucide-react";
import { uploadProfilePicture } from "@/firebase/storage";
import { useToast } from "@/hooks/use-toast";

interface ProfileSettingsProps {
  firebaseUser: any;
}

export function ProfileSettings({ firebaseUser }: ProfileSettingsProps) {
  const { control, watch, setValue } = useFormContext();
  const formData = watch();
  const toast = useToast();
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !firebaseUser?.uid) return;

    try {
      setIsUploading(true);
      const result = await uploadProfilePicture(file, firebaseUser.uid);
      setValue("profile.avatar", result.downloadURL, { shouldDirty: true });
      toast.success("Avatar uploaded", "Click 'Save Changes' to apply your new profile picture.");
    } catch (error: any) {
      console.error("Avatar upload failed:", error);
      toast.error("Upload failed", error.message || "Could not upload profile picture.");
    } finally {
      setIsUploading(false);
      // Reset input value so same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

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
            <div 
              className="relative group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-full" 
              onClick={handleAvatarClick}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleAvatarClick();
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="Change profile picture"
            >
              <Avatar className={`h-24 w-24 border-2 transition-all ${isUploading ? 'opacity-50' : 'group-hover:border-primary/50'}`}>
                <AvatarImage src={formData.profile.avatar} alt="Profile" />
                <AvatarFallback className="text-xl bg-primary/10 text-primary">
                  {formData.profile.firstName?.[0]}{formData.profile.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                {isUploading ? (
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                ) : (
                  <Camera className="h-6 w-6 text-white" />
                )}
              </div>
              
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleFileChange}
                disabled={isUploading}
              />
            </div>

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
