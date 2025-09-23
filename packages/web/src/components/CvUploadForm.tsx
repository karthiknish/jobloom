"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { UploadCloud, CheckCircle2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CvUploadFormProps {
  userId: string;
}

export function CvUploadForm({ userId }: CvUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState("");
  const [industry, setIndustry] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [upgradePromptVisible, setUpgradePromptVisible] = useState(false);
  const [limitInfo, setLimitInfo] = useState<any>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast.error("Please select a CV file to upload");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", userId);
      formData.append("targetRole", targetRole);
      formData.append("industry", industry);

      const response = await fetch("/api/cv/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("CV uploaded successfully! Analysis in progress...");
        setFile(null);
        setTargetRole("");
        setIndustry("");
        // Reset file input
        const fileInput = document.getElementById(
          "file-upload"
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      } else if (result.upgradeRequired) {
        // Show upgrade prompt for limit reached
        setUpgradePromptVisible(true);
        setLimitInfo(result);
      } else {
        toast.error(result.error || "Failed to upload CV");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload CV");
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-2xl mx-auto"
    >
      <Card>
        <CardHeader>
          <CardTitle>Upload Your CV for Analysis</CardTitle>
          <CardDescription>
            Get AI-powered insights to improve your CV. Supported formats: PDF,
            TXT (max 5MB)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload Area */}
            <motion.div
              className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
                dragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              animate={{ scale: dragActive ? 1.01 : 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <div className="text-center">
                <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-muted">
                  <UploadCloud className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="mt-4">
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-foreground">
                      {file
                        ? file.name
                        : "Drop your CV here or click to browse"}
                    </span>
                    <Input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      accept=".pdf,.txt"
                      onChange={handleFileChange}
                    />
                  </Label>
                  {file && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatFileSize(file.size)} • {file.type}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    PDF or TXT up to 5MB
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Optional Context Fields */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="target-role">Target Role (Optional)</Label>
                <Input
                  id="target-role"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g., Software Engineer, Marketing Manager"
                />
                <p className="text-xs text-muted-foreground">
                  Helps provide more targeted feedback
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Industry (Optional)</Label>
                <Select value={industry} onValueChange={setIndustry}>
                  <SelectTrigger id="industry">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Education">Education</SelectItem>
                    <SelectItem value="Consulting">Consulting</SelectItem>
                    <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="Retail">Retail</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Industry-specific recommendations
                </p>
              </div>
            </div>

            {/* Tips */}
            <div className="rounded-lg border bg-blue-50 border-blue-200 p-4">
              <h4 className="flex items-center gap-2 text-sm font-medium text-blue-900 mb-2">
                💡 Tips for better analysis:
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5" />
                  <span>
                    Use a clean, well-formatted CV without complex layouts
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5" />
                  <span>
                    Include specific role and industry for targeted feedback
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5" />
                  <span>
                    Ensure your CV has clear sections (Experience, Skills,
                    Education)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5" />
                  <span>
                    Remove any sensitive personal information before uploading
                  </span>
                </li>
              </ul>
              <div className="mt-3 p-3 bg-yellow-50 rounded border border-yellow-200">
                <h5 className="flex items-center gap-2 text-xs font-medium text-yellow-900 mb-1">
                  🤖 ATS Optimization Tip:
                </h5>
                <p className="text-xs text-yellow-800">
                  For best results with Applicant Tracking Systems, use standard
                  section headings (Work Experience, Skills, Education) and
                  avoid graphics, tables, or columns.
                </p>
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-end">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              type="submit"
              disabled={!file || uploading}
              onClick={handleSubmit}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Analyze CV"
              )}
            </Button>
          </motion.div>
        </CardFooter>
      </Card>

      {/* Upgrade Prompt for CV Analysis Limits */}
      {upgradePromptVisible && limitInfo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <UpgradePrompt feature="cvAnalysesPerMonth" />
        </motion.div>
      )}
    </motion.div>
  );
}
