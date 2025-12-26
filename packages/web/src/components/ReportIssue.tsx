"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bug, X, Send, AlertTriangle, CheckCircle, Loader2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { contactApi } from "@/utils/api/contact";
import { dispatchUpgradeIntent } from "@/utils/upgradeIntent";
import { analytics } from "@/firebase/analytics";

interface ReportIssueProps {
  /** Position of the floating button */
  position?: "bottom-right" | "bottom-left";
  /** Custom className for the container */
  className?: string;
}

type IssueType = "bug" | "feature" | "improvement" | "other";

interface FormData {
  name: string;
  email: string;
  issueType: IssueType;
  page: string;
  description: string;
}

const ISSUE_TYPES: { value: IssueType; label: string }[] = [
  { value: "bug", label: "Bug Report" },
  { value: "feature", label: "Feature Request" },
  { value: "improvement", label: "Improvement Suggestion" },
  { value: "other", label: "Other" },
];

export function ReportIssue({ position = "bottom-right", className = "" }: ReportIssueProps) {
  const { user } = useFirebaseAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  const getInitialFormData = (): FormData => ({
    name: user?.displayName || "",
    email: user?.email || "",
    issueType: "bug",
    page: typeof window !== "undefined" ? window.location.pathname : "",
    description: "",
  });

  const [formData, setFormData] = useState<FormData>(() => getInitialFormData());

  // Reset fields each time the modal opens so it doesn't feel "pre-filled"
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setSubmitStatus("idle");
    setFormData(getInitialFormData());
  }, [isOpen, user]); // Added user dependency so it gets fresh user data when modal opens

  // Removed: useEffect that pre-filled user data when user changes
  // This is handled by getInitialFormData which already reads from user
  // The modal reset effect above now has user as dependency


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description.trim()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      // Format the message with issue details
      const issueLabel = ISSUE_TYPES.find(t => t.value === formData.issueType)?.label || "Report";
      const message = `
[${issueLabel.toUpperCase()}]

Page: ${formData.page || "Not specified"}

Description:
${formData.description}

---
Submitted via Report Issue Feature
Browser: ${typeof navigator !== "undefined" ? navigator.userAgent : "Unknown"}
`.trim();

      await contactApi.submitContact({
        name: formData.name || "Anonymous User",
        email: formData.email || "noreply@hireall.app",
        subject: `[${issueLabel}] ${formData.page || "General"}`,
        message,
      });

      analytics.logGoalCompleted("support", "issue_report_submitted");

      setSubmitStatus("success");
      
      // Reset form after success
      setTimeout(() => {
        setFormData({
          name: user?.displayName || "",
          email: user?.email || "",
          issueType: "bug",
          page: typeof window !== "undefined" ? window.location.pathname : "",
          description: "",
        });
        setSubmitStatus("idle");
        setIsOpen(false);
      }, 2000);

    } catch (error) {
      console.error("Error submitting report:", error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpgradeClick = () => {
    analytics.logFeatureUsed("priority_support_upgrade_cta", "report_issue_header");
    const handled = dispatchUpgradeIntent({
      feature: "prioritySupport",
      title: "Get Priority Support",
      description: "Upgrade to Premium for 24h response times and dedicated support.",
      source: "report_issue_header",
    });

    if (!handled) {
      router.push("/upgrade");
    }
  };

  const positionClasses = {
    "bottom-right": "bottom-24 right-6 md:bottom-6",
    "bottom-left": "bottom-24 left-6 md:bottom-6",
  };

  return (
    <>
      {/* Floating Button */}
      <motion.div
        className={`fixed ${positionClasses[position]} z-50 ${className}`}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 200 }}
      >
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full h-14 w-14 shadow-lg hover:shadow-xl transition-shadow bg-primary hover:bg-primary/90"
          aria-label="Report an issue"
        >
          <Bug className="h-6 w-6" />
        </Button>
      </motion.div>

      {/* Modal Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/50 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSubmitting && setIsOpen(false)}
            />

            {/* Modal */}
            <motion.div
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-lg mx-auto"
              initial={{ opacity: 0, scale: 0.95, y: "-40%" }}
              animate={{ opacity: 1, scale: 1, y: "-50%" }}
              exit={{ opacity: 0, scale: 0.95, y: "-40%" }}
              transition={{ type: "spring", damping: 25 }}
            >
              <div className="bg-background rounded-xl shadow-2xl border overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Bug className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-lg">Report an Issue</h2>
                      <p className="text-sm text-muted-foreground">Help us improve Hireall</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="hidden sm:inline-flex items-center gap-2 bg-primary/5 border-primary/30 text-primary px-3 py-1 rounded-full">
                      <ShieldCheck className="h-4 w-4" />
                      <span className="text-xs font-semibold">Get Priority Support · 24h response guaranteed</span>
                    </Badge>
                    <Button
                      size="sm"
                      className="hidden sm:inline-flex"
                      variant="secondary"
                      onClick={handleUpgradeClick}
                    >
                      Upgrade
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsOpen(false)}
                      disabled={isSubmitting}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  {/* Success/Error State */}
                  {submitStatus === "success" && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 p-4 rounded-lg bg-success-soft text-success border border-success/20"
                    >
                      <CheckCircle className="h-5 w-5" />
                      <span>Thank you! Your report has been submitted.</span>
                    </motion.div>
                  )}

                  {submitStatus === "error" && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 p-4 rounded-lg bg-red-50 text-red-700 border border-red-200"
                    >
                      <AlertTriangle className="h-5 w-5" />
                      <span>Failed to submit. Please try again.</span>
                    </motion.div>
                  )}

                  {submitStatus === "idle" && (
                    <>
                      {/* Name & Email Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="report-name">Name</Label>
                          <Input
                            id="report-name"
                            placeholder="Your name"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="report-email">Email</Label>
                          <Input
                            id="report-email"
                            type="email"
                            placeholder="you@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          />
                        </div>
                      </div>

                      {/* Issue Type */}
                      <div className="space-y-2">
                        <Label htmlFor="report-type">Issue Type</Label>
                        <Select
                          value={formData.issueType}
                          onValueChange={(value: IssueType) => setFormData(prev => ({ ...prev, issueType: value }))}
                        >
                          <SelectTrigger id="report-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ISSUE_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Page */}
                      <div className="space-y-2">
                        <Label htmlFor="report-page">Page URL</Label>
                        <Input
                          id="report-page"
                          placeholder="/dashboard"
                          value={formData.page}
                          onChange={(e) => setFormData(prev => ({ ...prev, page: e.target.value }))}
                        />
                        <p className="text-xs text-muted-foreground">
                          The page where you encountered the issue
                        </p>
                      </div>

                      {/* Description */}
                      <div className="space-y-2">
                        <Label htmlFor="report-description">
                          Description <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                          id="report-description"
                          placeholder="Please describe the issue in detail. Include steps to reproduce if applicable..."
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          rows={4}
                          required
                        />
                      </div>
                    </>
                  )}

                  {/* Submit Button */}
                  {submitStatus === "idle" && (
                    <div className="flex justify-end gap-3 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsOpen(false)}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting || !formData.description.trim()}
                        className="min-w-[120px]"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Submit Report
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default ReportIssue;
