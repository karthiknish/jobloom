"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  User,
  Briefcase,
  MapPin,
  Mail,
  Phone,
  GraduationCap,
  Link,
  Save,
  Download,
  Upload,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";

export interface AutofillProfile {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  professional: {
    currentTitle: string;
    experience: string;
    education: string;
    skills: string;
    linkedinUrl: string;
    portfolioUrl: string;
    githubUrl: string;
  };
  preferences: {
    salaryExpectation: string;
    availableStartDate: string;
    workAuthorization: string;
    relocate: boolean;
    coverLetter: string;
  };
}

interface AutofillSettingsProps {
  initialData?: Partial<AutofillProfile>;
  onSave?: (data: AutofillProfile) => void;
}

export function AutofillSettings({ initialData, onSave }: AutofillSettingsProps) {
  const { user } = useFirebaseAuth();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<AutofillProfile>({
    personalInfo: {
      firstName: "",
      lastName: "",
      email: user?.email || "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "United Kingdom",
    },
    professional: {
      currentTitle: "",
      experience: "",
      education: "",
      skills: "",
      linkedinUrl: "",
      portfolioUrl: "",
      githubUrl: "",
    },
    preferences: {
      salaryExpectation: "",
      availableStartDate: "",
      workAuthorization: "",
      relocate: false,
      coverLetter: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        personalInfo: { ...prev.personalInfo, ...initialData.personalInfo },
        professional: { ...prev.professional, ...initialData.professional },
        preferences: { ...prev.preferences, ...initialData.preferences },
      }));
    }
  }, [initialData]);

  const handleInputChange = (
    section: keyof AutofillProfile,
    field: string,
    value: string | boolean
  ) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    if (!user) {
      toast.error("Authentication required", "Please sign in to save your autofill profile.");
      return;
    }

    setIsLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/user/autofill-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save autofill profile");
      }

      const result = await response.json();
      toast.success("Autofill profile saved", "Your autofill profile has been updated successfully.");
      
      if (onSave) {
        onSave(result.data);
      }
    } catch (error) {
      console.error("Error saving autofill profile:", error);
      toast.error("Save failed", error instanceof Error ? error.message : "Failed to save autofill profile.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoad = async () => {
    if (!user) {
      toast.error("Authentication required", "Please sign in to load your autofill profile.");
      return;
    }

    setIsLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/user/autofill-profile", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to load autofill profile");
      }

      const result = await response.json();
      if (result.data) {
        setFormData(result.data);
        toast.success("Profile loaded", "Your autofill profile has been loaded successfully.");
      } else {
        toast.info("No profile found", "No autofill profile found. Please create one.");
      }
    } catch (error) {
      console.error("Error loading autofill profile:", error);
      toast.error("Load failed", error instanceof Error ? error.message : "Failed to load autofill profile.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(formData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `hireall-autofill-profile-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Profile exported", "Your autofill profile has been exported successfully.");
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        setFormData(prev => ({
          ...prev,
          ...importedData,
          personalInfo: { ...prev.personalInfo, ...importedData.personalInfo },
          professional: { ...prev.professional, ...importedData.professional },
          preferences: { ...prev.preferences, ...importedData.preferences },
        }));
        toast.success("Profile imported", "Your autofill profile has been imported successfully.");
      } catch (error) {
        toast.error("Import failed", "Invalid file format. Please select a valid JSON file.");
      }
    };
    reader.readAsText(file);
  };

  const handleClear = () => {
    if (confirm("Are you sure you want to clear all autofill data? This action cannot be undone.")) {
      setFormData({
        personalInfo: {
          firstName: "",
          lastName: "",
          email: user?.email || "",
          phone: "",
          address: "",
          city: "",
          state: "",
          zipCode: "",
          country: "United Kingdom",
        },
        professional: {
          currentTitle: "",
          experience: "",
          education: "",
          skills: "",
          linkedinUrl: "",
          portfolioUrl: "",
          githubUrl: "",
        },
        preferences: {
          salaryExpectation: "",
          availableStartDate: "",
          workAuthorization: "",
          relocate: false,
          coverLetter: "",
        },
      });
      toast.success("Profile cleared", "All autofill data has been cleared.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="h-6 w-6" />
                Autofill Profile
              </CardTitle>
              <CardDescription className="text-gray-600 mt-1">
                Configure your personal information for automatic job application form filling
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleLoad}
                disabled={isLoading}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Load Profile
              </Button>
              <Button
                variant="outline"
                onClick={handleExport}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Export
              </Button>
              <label className="cursor-pointer">
                <Button variant="outline" className="gap-2" asChild>
                  <span>
                    <Upload className="h-4 w-4" />
                    Import
                  </span>
                </Button>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
              <Button
                variant="outline"
                onClick={handleClear}
                className="gap-2 text-red-600 hover:text-red-700 hover:border-red-300"
              >
                <Trash2 className="h-4 w-4" />
                Clear
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Alert */}
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          This information will be used by our Chrome extension to automatically fill job application forms. 
          Your data is encrypted and stored securely. Only fill in information you're comfortable sharing with potential employers.
        </AlertDescription>
      </Alert>

      {/* Personal Information */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
          <CardDescription className="text-gray-600">
            Basic personal details for application forms
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.personalInfo.firstName}
                onChange={(e) => handleInputChange("personalInfo", "firstName", e.target.value)}
                placeholder="Enter your first name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.personalInfo.lastName}
                onChange={(e) => handleInputChange("personalInfo", "lastName", e.target.value)}
                placeholder="Enter your last name"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.personalInfo.email}
                onChange={(e) => handleInputChange("personalInfo", "email", e.target.value)}
                placeholder="your.email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.personalInfo.phone}
                onChange={(e) => handleInputChange("personalInfo", "phone", e.target.value)}
                placeholder="+44 20 7123 4567"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Address
            </Label>
            <Input
              id="address"
              value={formData.personalInfo.address}
              onChange={(e) => handleInputChange("personalInfo", "address", e.target.value)}
              placeholder="123 Street Name"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.personalInfo.city}
                onChange={(e) => handleInputChange("personalInfo", "city", e.target.value)}
                placeholder="London"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State/County</Label>
              <Input
                id="state"
                value={formData.personalInfo.state}
                onChange={(e) => handleInputChange("personalInfo", "state", e.target.value)}
                placeholder="Greater London"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zipCode">Postal Code</Label>
              <Input
                id="zipCode"
                value={formData.personalInfo.zipCode}
                onChange={(e) => handleInputChange("personalInfo", "zipCode", e.target.value)}
                placeholder="SW1A 0AA"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.personalInfo.country}
                onChange={(e) => handleInputChange("personalInfo", "country", e.target.value)}
                placeholder="United Kingdom"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Professional Information */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Professional Information
          </CardTitle>
          <CardDescription className="text-gray-600">
            Your professional background and experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="currentTitle">Current Job Title</Label>
              <Input
                id="currentTitle"
                value={formData.professional.currentTitle}
                onChange={(e) => handleInputChange("professional", "currentTitle", e.target.value)}
                placeholder="Software Engineer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="experience">Years of Experience</Label>
              <Input
                id="experience"
                value={formData.professional.experience}
                onChange={(e) => handleInputChange("professional", "experience", e.target.value)}
                placeholder="5+ years of software development experience"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="education" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Education
            </Label>
            <Input
              id="education"
              value={formData.professional.education}
              onChange={(e) => handleInputChange("professional", "education", e.target.value)}
              placeholder="Bachelor of Science in Computer Science"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="skills">Skills</Label>
            <Textarea
              id="skills"
              value={formData.professional.skills}
              onChange={(e) => handleInputChange("professional", "skills", e.target.value)}
              placeholder="JavaScript, React, Node.js, Python, AWS, Docker, Git..."
              rows={3}
            />
            <p className="text-sm text-gray-500">
              List your key skills separated by commas
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="linkedinUrl" className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                LinkedIn URL
              </Label>
              <Input
                id="linkedinUrl"
                type="url"
                value={formData.professional.linkedinUrl}
                onChange={(e) => handleInputChange("professional", "linkedinUrl", e.target.value)}
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="portfolioUrl">Portfolio URL</Label>
              <Input
                id="portfolioUrl"
                type="url"
                value={formData.professional.portfolioUrl}
                onChange={(e) => handleInputChange("professional", "portfolioUrl", e.target.value)}
                placeholder="https://yourportfolio.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="githubUrl">GitHub URL</Label>
              <Input
                id="githubUrl"
                type="url"
                value={formData.professional.githubUrl}
                onChange={(e) => handleInputChange("professional", "githubUrl", e.target.value)}
                placeholder="https://github.com/yourusername"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Application Preferences */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-gray-900">Application Preferences</CardTitle>
          <CardDescription className="text-gray-600">
            Default values for job applications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="salaryExpectation">Salary Expectation</Label>
              <Input
                id="salaryExpectation"
                value={formData.preferences.salaryExpectation}
                onChange={(e) => handleInputChange("preferences", "salaryExpectation", e.target.value)}
                placeholder="£50,000 - £60,000 per year"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="availableStartDate">Available Start Date</Label>
              <Input
                id="availableStartDate"
                type="date"
                value={formData.preferences.availableStartDate}
                onChange={(e) => handleInputChange("preferences", "availableStartDate", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="workAuthorization">Work Authorization Status</Label>
            <Input
              id="workAuthorization"
              value={formData.preferences.workAuthorization}
              onChange={(e) => handleInputChange("preferences", "workAuthorization", e.target.value)}
              placeholder="UK Skilled Worker Visa eligible, EU citizen, etc."
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="relocate">Willing to Relocate</Label>
              <p className="text-sm text-gray-500">
                Open to relocating for the right opportunity
              </p>
            </div>
            <Switch
              id="relocate"
              checked={formData.preferences.relocate}
              onCheckedChange={(checked) => handleInputChange("preferences", "relocate", checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="coverLetter">Default Cover Letter</Label>
            <Textarea
              id="coverLetter"
              value={formData.preferences.coverLetter}
              onChange={(e) => handleInputChange("preferences", "coverLetter", e.target.value)}
              placeholder="I am excited to apply for this opportunity..."
              rows={6}
            />
            <p className="text-sm text-gray-500">
              A generic cover letter that can be customized for specific applications
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
        >
          {isLoading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Autofill Profile
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
