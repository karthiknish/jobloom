"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Download, Trash2, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface SecuritySettingsProps {
  formData: {
    security: {
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
    };
  };
  onInputChange: (section: string, field: string, value: any) => void;
  user: any;
}

export function SecuritySettings({ formData, onInputChange, user }: SecuritySettingsProps) {
  const toast = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordChange = async () => {
    if (formData.security.newPassword !== formData.security.confirmPassword) {
      toast.error("Password Mismatch", "New passwords do not match.");
      return;
    }

    if (formData.security.newPassword.length < 6) {
      toast.error("Password Too Short", "Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);
    try {
      // Simulate password change
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(
        "Password Changed",
        "Your password has been updated successfully."
      );
      
      onInputChange("security", "currentPassword", "");
      onInputChange("security", "newPassword", "");
      onInputChange("security", "confirmPassword", "");
    } catch (error) {
      toast.error("Error", "Failed to update password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDataExport = async () => {
    try {
      // Simulate data export
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success(
        "Data Exported",
        "Your data has been exported successfully."
      );
    } catch (error) {
      toast.error("Error", "Failed to export data. Please try again.");
    }
  };

  const handleAccountDeletion = () => {
    if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      toast.success(
        "Account Deleted",
        "Your account has been deleted successfully."
      );
      router.push("/");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="space-y-6"
    >
      <Card className="card-premium-elevated border-0 bg-surface">
        <CardHeader>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <CardTitle className="text-2xl font-bold text-foreground">Security</CardTitle>
            <CardDescription className="text-muted-foreground text-lg">
              Manage your account security and data
            </CardDescription>
          </motion.div>
        </CardHeader>
        <CardContent className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Change Password
            </h3>
            <div className="space-y-4">
              <div className="space-y-3">
                <Label htmlFor="currentPassword" className="text-sm font-semibold text-foreground">
                  Current Password
                </Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={formData.security.currentPassword}
                  onChange={(e) => onInputChange("security", "currentPassword", e.target.value)}
                  placeholder="Enter current password"
                  className="input-premium"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="newPassword" className="text-sm font-semibold text-foreground">
                  New Password
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={formData.security.newPassword}
                  onChange={(e) => onInputChange("security", "newPassword", e.target.value)}
                  placeholder="Enter new password"
                  className="input-premium"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="confirmPassword" className="text-sm font-semibold text-foreground">
                  Confirm New Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.security.confirmPassword}
                  onChange={(e) => onInputChange("security", "confirmPassword", e.target.value)}
                  placeholder="Confirm new password"
                  className="input-premium"
                />
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={handlePasswordChange}
                  disabled={isLoading}
                  className="btn-premium gradient-primary font-semibold"
                >
                  {isLoading ? (
                    <>
                      <Lock className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Update Password
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Data Management
            </h3>
            <div className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Your data is stored securely and can be exported or deleted at any time.
                </AlertDescription>
              </Alert>

              <div className="flex flex-col sm:flex-row gap-4">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="outline"
                    onClick={handleDataExport}
                    className="btn-premium font-semibold"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Data
                  </Button>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="outline"
                    onClick={handleAccountDeletion}
                    className="btn-premium font-semibold border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
