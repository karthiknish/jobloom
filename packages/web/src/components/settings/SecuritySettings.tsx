"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Download, Trash2, Shield, AlertTriangle, LogOut } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { getAuth, EmailAuthProvider, reauthenticateWithCredential, updatePassword, signOut as firebaseSignOut } from "firebase/auth";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";

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
  const { signOut } = useFirebaseAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await signOut();
      toast.success("Signed Out", "You have been successfully signed out.");
    } catch (error: any) {
      console.error("Logout error:", error);
      toast.error("Logout Failed", "There was an issue signing you out. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!user) {
      toast.error("Authentication Error", "You must be signed in to change your password.");
      return;
    }

    if (formData.security.newPassword !== formData.security.confirmPassword) {
      toast.error("Password Mismatch", "New passwords do not match.");
      return;
    }

    if (formData.security.newPassword.length < 6) {
      toast.error("Password Too Short", "Password must be at least 6 characters long.");
      return;
    }

    if (!formData.security.currentPassword) {
      toast.error("Current Password Required", "Please enter your current password.");
      return;
    }

    setIsLoading(true);
    try {
      const token = await user.getIdToken();
      
      // First verify the current password by trying to sign in with it
      const auth = getAuth();
      const credential = EmailAuthProvider.credential(user.email || "", formData.security.currentPassword);
      
      // Reauthenticate user
      await reauthenticateWithCredential(auth.currentUser!, credential);
      
      // Update password
      await updatePassword(auth.currentUser!, formData.security.newPassword);
      
      toast.success(
        "Password Changed",
        "Your password has been updated successfully."
      );
      
      onInputChange("security", "currentPassword", "");
      onInputChange("security", "newPassword", "");
      onInputChange("security", "confirmPassword", "");
    } catch (error: any) {
      console.error("Password change error:", error);
      let errorMessage = "Failed to update password. Please try again.";
      
      if (error.code === 'auth/wrong-password') {
        errorMessage = "Current password is incorrect.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "New password is too weak. Please choose a stronger password.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many attempts. Please try again later.";
      }
      
      toast.error("Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDataExport = async () => {
    if (!user) {
      toast.error("Authentication Error", "You must be signed in to export your data.");
      return;
    }

    setIsLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/settings/export", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to export data");
      }

      const responseData = await response.json();
      
      if (responseData.downloadUrl) {
        // Download the file from the signed URL
        const downloadResponse = await fetch(responseData.downloadUrl);
        const blob = await downloadResponse.blob();
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = responseData.filename || `hireall-data-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast.success(
          "Data Exported",
          `Your data has been exported successfully.`
        );
      } else {
        throw new Error("No download URL provided");
      }
    } catch (error: any) {
      console.error("Data export error:", error);
      toast.error("Export Failed", error.message || "Failed to export data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccountDeletion = async () => {
    // First show a prompt to get confirmation text
    const confirmation = prompt(
      "To permanently delete your account, type: DELETE_MY_ACCOUNT_PERMANENTLY\n\nThis action cannot be undone and will delete all your data."
    );
    
    if (confirmation !== "DELETE_MY_ACCOUNT_PERMANENTLY") {
      return;
    }

    // Second confirmation
    const reason = prompt("Optional: Please let us know why you're deleting your account (this helps us improve):");
    
    setIsLoading(true);
    try {
      const token = await user.getIdToken();
      
      const response = await fetch("/api/settings/delete-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          confirmation,
          reason: reason || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete account");
      }

      const result = await response.json();
      
      toast.success(
        "Account Deleted",
        result.message || "Your account has been permanently deleted."
      );
      
      // Sign out and redirect
      const auth = getAuth();
      await auth.signOut();
      router.push("/");
      
    } catch (error: any) {
      console.error("Account deletion error:", error);
      toast.error(
        "Deletion Failed",
        error.message || "Failed to delete account. Please try again or contact support."
      );
    } finally {
      setIsLoading(false);
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
                    disabled={isLoading}
                    className="btn-premium font-semibold"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {isLoading ? "Exporting..." : "Export Data"}
                  </Button>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="outline"
                    onClick={handleAccountDeletion}
                    disabled={isLoading}
                    className="btn-premium font-semibold border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {isLoading ? "Deleting..." : "Delete Account"}
                  </Button>
                </motion.div>
              </div>

              <Alert className="border-destructive/50 bg-destructive/5">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <AlertDescription className="text-destructive">
                  <strong>Warning:</strong> Account deletion is permanent and irreversible. All your data (applications, CV analyses, saved jobs, and personal information) will be permanently erased from our servers.
                </AlertDescription>
              </Alert>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <LogOut className="h-5 w-5 text-primary" />
              Session Management
            </h3>
            <div className="space-y-4">
              <Alert>
                <LogOut className="h-4 w-4" />
                <AlertDescription>
                  Sign out of your account on this device. You'll need to sign in again to access your account.
                </AlertDescription>
              </Alert>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  disabled={isLoading}
                  className="btn-premium font-semibold border-orange-500 text-orange-600 hover:bg-orange-50 hover:border-orange-600"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {isLoading ? "Signing Out..." : "Sign Out"}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
