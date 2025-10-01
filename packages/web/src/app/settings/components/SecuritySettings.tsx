"use client";

import { Shield, Key, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";

interface PasswordForm {
  current: string;
  next: string;
  confirm: string;
}

interface Session {
  id: string;
  device: string;
  browser: string;
  lastActive: string;
  isCurrent: boolean;
}

interface UserPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  jobAlertsEnabled: boolean;
  jobKeywords: string[];
  preferredCompanies: string[];
  preferredLocations: string[];
  salaryRange: { min?: number; max?: number };
  jobTypes: string[];
  experienceLevels: string[];
  industries: string[];
  analyticsTracking: boolean;
  dataSharing: boolean;
  marketingEmails: boolean;
}

interface SecuritySettingsProps {
  preferences: UserPreferences;
  showChangePasswordForm: boolean;
  passwordForm: PasswordForm;
  changePasswordLoading: boolean;
  changePasswordError: string | null;
  viewingSessions: boolean;
  sessions: Session[];
  sessionsError: string | null;
  revokingSessions: boolean;
  updatePreference: (key: keyof UserPreferences, value: boolean) => void;
  setShowChangePasswordForm: (show: boolean) => void;
  setPasswordForm: (form: PasswordForm) => void;
  setChangePasswordError: (error: string | null) => void;
  handleChangePassword: () => void;
  handleViewSessions: () => void;
  handleRevokeSessions: () => void;
}

export function SecuritySettings({
  preferences,
  showChangePasswordForm,
  passwordForm,
  changePasswordLoading,
  changePasswordError,
  viewingSessions,
  sessions,
  sessionsError,
  revokingSessions,
  updatePreference,
  setShowChangePasswordForm,
  setPasswordForm,
  setChangePasswordError,
  handleChangePassword,
  handleViewSessions,
  handleRevokeSessions
}: SecuritySettingsProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Account Security
            </CardTitle>
            <CardDescription>
              Manage your account security settings and authentication.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Password</p>
                <p className="text-sm text-muted-foreground">
                  Keep your account secure by using a strong, unique password.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowChangePasswordForm(!showChangePasswordForm);
                    setChangePasswordError(null);
                  }}
                >
                  {showChangePasswordForm ? "Cancel" : "Change Password"}
                </Button>
              </div>
            </div>

            {showChangePasswordForm && (
              <Card className="border border-border/60 bg-muted/30">
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      placeholder="Enter current password"
                      value={passwordForm.current}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, current: e.target.value })
                      }
                      disabled={changePasswordLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="Enter new password"
                      value={passwordForm.next}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, next: e.target.value })
                      }
                      disabled={changePasswordLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm new password"
                      value={passwordForm.confirm}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, confirm: e.target.value })
                      }
                      disabled={changePasswordLoading}
                    />
                  </div>

                  {changePasswordError && (
                    <Alert variant="destructive">
                      <AlertTitle>Password update failed</AlertTitle>
                      <AlertDescription>{changePasswordError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setShowChangePasswordForm(false);
                        setPasswordForm({ current: "", next: "", confirm: "" });
                        setChangePasswordError(null);
                      }}
                      disabled={changePasswordLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleChangePassword}
                      disabled={changePasswordLoading}
                    >
                      {changePasswordLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update Password"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Active Sessions</p>
                <p className="text-sm text-muted-foreground">
                  Manage your active login sessions
                </p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" onClick={handleViewSessions}>
                    {viewingSessions ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Loading...
                      </>
                    ) : (
                      "View Sessions"
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Active Sessions</DialogTitle>
                    <DialogDescription>
                      Manage your active login sessions across devices
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    {sessionsError ? (
                      <Alert variant="destructive">
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{sessionsError}</AlertDescription>
                      </Alert>
                    ) : sessions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No active sessions found.</p>
                    ) : (
                      <div className="space-y-3">
                        {sessions.map((session) => (
                          <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm">{session.device}</p>
                                {session.isCurrent && (
                                  <Badge variant="secondary" className="text-xs">Current</Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {session.browser}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Last active: {new Date(session.lastActive).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                        {sessions.length > 0 && (
                          <div className="pt-2 border-t">
                            <p className="text-xs text-muted-foreground mb-3">
                              Note: Due to Firebase Auth limitations, only the current session is shown. Use "Revoke All Sessions" to sign out from all devices.
                            </p>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={handleRevokeSessions}
                              disabled={revokingSessions}
                              className="w-full"
                            >
                              {revokingSessions ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  Revoking...
                                </>
                              ) : (
                                "Revoke All Sessions"
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Privacy & Data
            </CardTitle>
            <CardDescription>
              Control your privacy settings and data sharing preferences.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Analytics Tracking</Label>
                <p className="text-sm text-muted-foreground">
                  Help improve the app with usage data
                </p>
              </div>
              <Switch
                checked={preferences.analyticsTracking}
                onCheckedChange={(checked) => updatePreference('analyticsTracking', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Data Sharing</Label>
                <p className="text-sm text-muted-foreground">
                  Share anonymized data for research
                </p>
              </div>
              <Switch
                checked={preferences.dataSharing}
                onCheckedChange={(checked) => updatePreference('dataSharing', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Marketing Emails</Label>
                <p className="text-sm text-muted-foreground">
                  Receive product updates and offers
                </p>
              </div>
              <Switch
                checked={preferences.marketingEmails}
                onCheckedChange={(checked) => updatePreference('marketingEmails', checked)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}