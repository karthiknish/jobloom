"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Settings,
  Shield,
  CreditCard,
  Save,
  Camera,
  Lock,
  Key,
  Download,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
// Mock hooks for demo - replace with actual implementations
const useToast = () => ({
  toast: ({ title, description, variant }: any) => {
    console.log(`${variant || 'info'}: ${title} - ${description}`);
  }
});

const useUser = () => ({
  user: {
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    phone: "",
    location: "",
    title: "",
    company: "",
    bio: "",
    avatar: "",
    emailNotifications: true,
    pushNotifications: false,
    newsletter: true,
    marketingEmails: false,
    theme: "light",
    createdAt: new Date().toISOString()
  },
  loading: false
});
import { getAuth, signOut as firebaseSignOut } from "firebase/auth";
import { useRouter } from "next/navigation";

const tabs = [
  {
    id: "profile",
    label: "Profile",
    icon: User,
    description: "Personal information",
  },
  {
    id: "preferences",
    label: "Preferences",
    icon: Settings,
    description: "App settings",
  },
  {
    id: "security",
    label: "Security",
    icon: Shield,
    description: "Password & privacy",
  },
];

export default function SettingsPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [formData, setFormData] = useState({
    profile: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      location: "",
      title: "",
      company: "",
      bio: "",
      avatar: "",
    },
    preferences: {
      emailNotifications: true,
      pushNotifications: false,
      newsletter: true,
      marketingEmails: false,
      theme: "light",
    },
    security: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const [originalData, setOriginalData] = useState(formData);

  useEffect(() => {
    if (!userLoading && user) {
      const userData = {
        profile: {
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          email: user.email || "",
          phone: user.phone || "",
          location: user.location || "",
          title: user.title || "",
          company: user.company || "",
          bio: user.bio || "",
          avatar: user.avatar || "",
        },
        preferences: {
          emailNotifications: user.emailNotifications ?? true,
          pushNotifications: user.pushNotifications ?? false,
          newsletter: user.newsletter ?? true,
          marketingEmails: user.marketingEmails ?? false,
          theme: user.theme || "light",
        },
        security: {
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        },
      };
      setFormData(userData);
      setOriginalData(userData);
    }
  }, [user, userLoading]);

  const handleInputChange = (section: string, field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setOriginalData(formData);
      setHasChanges(false);
      toast({
        title: "Settings saved",
        description: "Your changes have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error saving settings",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData(originalData);
    setHasChanges(false);
  };

  const handleSignOut = async () => {
    try {
      const auth = getAuth();
      await firebaseSignOut(auth);
      router.push("/");
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/dashboard")}
                className="gap-2"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </div>
            <div className="flex items-center gap-3">
              {hasChanges && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                    disabled={isLoading}
                  >
                    Reset
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-80">
            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user?.avatar} alt={user?.firstName} />
                    <AvatarFallback className="text-lg bg-blue-100 text-blue-600">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </div>
                    <div className="text-sm text-gray-600">{user?.email}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <Separator className="mb-6" />
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2"
                    onClick={() => router.push("/billing")}
                  >
                    <CreditCard className="h-4 w-4" />
                    Billing & Plans
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2"
                    onClick={handleSignOut}
                  >
                    <Key className="h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="bg-white p-1 grid w-full grid-cols-3 shadow-sm">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  >
                    <tab.icon className="h-4 w-4 mr-2" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile">
                <Card className="bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold text-gray-900">Profile Information</CardTitle>
                    <CardDescription className="text-gray-600">
                      Update your personal information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <div className="flex items-center gap-6">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={formData.profile.avatar} alt="Profile" />
                        <AvatarFallback className="text-xl bg-blue-100 text-blue-600">
                          {formData.profile.firstName?.[0]}{formData.profile.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-3">
                        <Button
                          variant="outline"
                          onClick={() => {
                            toast({
                              title: "Avatar uploaded",
                              description: "Your profile picture has been updated.",
                            });
                          }}
                          className="gap-2"
                        >
                          <Camera className="h-4 w-4" />
                          Change Avatar
                        </Button>
                        <p className="text-sm text-gray-600">
                          JPG, PNG or GIF. Max size 2MB
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                          First Name
                        </Label>
                        <Input
                          id="firstName"
                          value={formData.profile.firstName}
                          onChange={(e) => handleInputChange("profile", "firstName", e.target.value)}
                          placeholder="Enter your first name"
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                          Last Name
                        </Label>
                        <Input
                          id="lastName"
                          value={formData.profile.lastName}
                          onChange={(e) => handleInputChange("profile", "lastName", e.target.value)}
                          placeholder="Enter your last name"
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.profile.email}
                        onChange={(e) => handleInputChange("profile", "email", e.target.value)}
                        placeholder="Enter your email"
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                          Phone Number
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.profile.phone}
                          onChange={(e) => handleInputChange("profile", "phone", e.target.value)}
                          placeholder="Enter your phone number"
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="location" className="text-sm font-medium text-gray-700">
                          Location
                        </Label>
                        <Input
                          id="location"
                          value={formData.profile.location}
                          onChange={(e) => handleInputChange("profile", "location", e.target.value)}
                          placeholder="City, Country"
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                          Job Title
                        </Label>
                        <Input
                          id="title"
                          value={formData.profile.title}
                          onChange={(e) => handleInputChange("profile", "title", e.target.value)}
                          placeholder="Your current job title"
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="company" className="text-sm font-medium text-gray-700">
                          Company
                        </Label>
                        <Input
                          id="company"
                          value={formData.profile.company}
                          onChange={(e) => handleInputChange("profile", "company", e.target.value)}
                          placeholder="Your current company"
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="bio" className="text-sm font-medium text-gray-700">
                        Bio
                      </Label>
                      <Textarea
                        id="bio"
                        value={formData.profile.bio}
                        onChange={(e) => handleInputChange("profile", "bio", e.target.value)}
                        placeholder="Tell us about yourself..."
                        rows={4}
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Preferences Tab */}
              <TabsContent value="preferences">
                <div className="space-y-6">
                  <Card className="bg-white shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-xl font-bold text-gray-900">Notifications</CardTitle>
                      <CardDescription className="text-gray-600">
                        Manage how you receive updates
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label htmlFor="emailNotifications" className="text-sm font-medium text-gray-700">
                            Email Notifications
                          </Label>
                          <p className="text-sm text-gray-500">
                            Receive job alerts and updates via email
                          </p>
                        </div>
                        <Switch
                          id="emailNotifications"
                          checked={formData.preferences.emailNotifications}
                          onCheckedChange={(checked) => handleInputChange("preferences", "emailNotifications", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label htmlFor="pushNotifications" className="text-sm font-medium text-gray-700">
                            Push Notifications
                          </Label>
                          <p className="text-sm text-gray-500">
                            Receive browser push notifications
                          </p>
                        </div>
                        <Switch
                          id="pushNotifications"
                          checked={formData.preferences.pushNotifications}
                          onCheckedChange={(checked) => handleInputChange("preferences", "pushNotifications", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label htmlFor="newsletter" className="text-sm font-medium text-gray-700">
                            Newsletter
                          </Label>
                          <p className="text-sm text-gray-500">
                            Weekly job tips and opportunities
                          </p>
                        </div>
                        <Switch
                          id="newsletter"
                          checked={formData.preferences.newsletter}
                          onCheckedChange={(checked) => handleInputChange("preferences", "newsletter", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label htmlFor="marketingEmails" className="text-sm font-medium text-gray-700">
                            Marketing Emails
                          </Label>
                          <p className="text-sm text-gray-500">
                            Special offers and promotions
                          </p>
                        </div>
                        <Switch
                          id="marketingEmails"
                          checked={formData.preferences.marketingEmails}
                          onCheckedChange={(checked) => handleInputChange("preferences", "marketingEmails", checked)}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-xl font-bold text-gray-900">Appearance</CardTitle>
                      <CardDescription className="text-gray-600">
                        Customize your app experience
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label htmlFor="theme" className="text-sm font-medium text-gray-700">
                            Theme
                          </Label>
                          <p className="text-sm text-gray-500">
                            Choose your preferred theme
                          </p>
                        </div>
                        <select
                          id="theme"
                          value={formData.preferences.theme}
                          onChange={(e) => handleInputChange("preferences", "theme", e.target.value)}
                          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="light">Light</option>
                          <option value="dark">Dark</option>
                          <option value="system">System</option>
                        </select>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security">
                <div className="space-y-6">
                  <Card className="bg-white shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-xl font-bold text-gray-900">Change Password</CardTitle>
                      <CardDescription className="text-gray-600">
                        Update your account password
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-3">
                        <Label htmlFor="currentPassword" className="text-sm font-medium text-gray-700">
                          Current Password
                        </Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          value={formData.security.currentPassword}
                          onChange={(e) => handleInputChange("security", "currentPassword", e.target.value)}
                          placeholder="Enter current password"
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                          New Password
                        </Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={formData.security.newPassword}
                          onChange={(e) => handleInputChange("security", "newPassword", e.target.value)}
                          placeholder="Enter new password"
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                          Confirm New Password
                        </Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={formData.security.confirmPassword}
                          onChange={(e) => handleInputChange("security", "confirmPassword", e.target.value)}
                          placeholder="Confirm new password"
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>

                      <Button
                        onClick={() => {
                          toast({
                            title: "Password changed",
                            description: "Your password has been updated successfully.",
                          });
                          setFormData(prev => ({
                            ...prev,
                            security: {
                              ...prev.security,
                              currentPassword: "",
                              newPassword: "",
                              confirmPassword: "",
                            },
                          }));
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Lock className="h-4 w-4 mr-2" />
                        Update Password
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="bg-white shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-xl font-bold text-gray-900">Data Management</CardTitle>
                      <CardDescription className="text-gray-600">
                        Export or delete your data
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          toast({
                            title: "Data exported",
                            description: "Your data has been exported successfully.",
                          });
                        }}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Export Data
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
                            toast({
                              title: "Account deleted",
                              description: "Your account has been deleted successfully.",
                              variant: "destructive",
                            });
                            router.push("/");
                          }
                        }}
                        className="gap-2 text-red-600 hover:text-red-700 hover:border-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Account
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}