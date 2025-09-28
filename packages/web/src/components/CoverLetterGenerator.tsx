"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Lightbulb,
  Download,
  Copy,
  RefreshCw,
  Target,
  CheckCircle,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { showSuccess, showError } from "@/components/ui/Toast";

import { ResumeData } from "@/types/resume";

interface CoverLetterData {
  jobTitle: string;
  companyName: string;
  companyLocation: string;
  hiringManager: string;
  jobDescription: string;
  keyRequirements: string[];
  companyValues: string[];
  applicationDate: string;
  customOpening?: string;
  customBody?: string;
  customClosing?: string;
}

interface CoverLetterGeneratorProps {
  resumeData: ResumeData;
  onGenerate?: (letter: string) => void;
}

const DEFAULT_LETTER_DATA: CoverLetterData = {
  jobTitle: "",
  companyName: "",
  companyLocation: "",
  hiringManager: "Hiring Team",
  jobDescription: "",
  keyRequirements: [""],
  companyValues: [""],
  applicationDate: new Date().toISOString().split("T")[0],
  customOpening: "",
  customBody: "",
  customClosing: "",
};

export const formatLetter = (
  data: CoverLetterData,
  resume: Partial<ResumeData>,
  opts: { includeAchievements?: boolean } = {},
): string => {
  const personalInfo: Partial<ResumeData['personalInfo']> = resume.personalInfo ?? {} as any;
  const name = personalInfo.fullName?.trim() || "Your Name";
  const email = personalInfo.email?.trim() || "your.email@example.com";
  const phone = personalInfo.phone?.trim() || "(555) 000-0000";
  const location = personalInfo.location?.trim() || "City, State";

  const jobTitle = data.jobTitle.trim() || "the role";
  const companyName = data.companyName.trim() || "your company";
  const companyLocation = data.companyLocation.trim();
  const hiringManager = data.hiringManager.trim() || "Hiring Team";

  const formattedDate = new Date(data.applicationDate || Date.now()).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  const defaultOpening =
    `I am excited to apply for the ${jobTitle} position at ${companyName}. ` +
    `With my background in ${resume.experience?.[0]?.position || "software development"} and ` +
    `${data.companyValues[0] ? `an alignment with ${data.companyValues[0]}` : "a passion for innovation"}, ` +
    "I am confident that I would be a valuable addition to your team.";

  const requirementsLine = data.keyRequirements
    .filter((req) => req.trim())
    .slice(0, 3)
    .join(", ");

  const valuesLine = data.companyValues
    .filter((value) => value.trim())
    .slice(0, 2)
    .join(" and ");

  const defaultBodyParts: string[] = [];

  if (requirementsLine) {
    defaultBodyParts.push(
      `In my recent role${resume.experience?.[0]?.position ? ` as ${resume.experience[0].position}` : ""}` +
        `${resume.experience?.[0]?.company ? ` at ${resume.experience[0].company}` : ""}, ` +
        `I consistently delivered on key priorities including ${requirementsLine}.`
    );
  }

  if (valuesLine) {
    defaultBodyParts.push(
      `I am particularly drawn to ${companyName}'s focus on ${valuesLine}, ` +
        "which resonates with my own professional values."
    );
  }

  if (data.jobDescription.trim()) {
    const firstSentence = data.jobDescription.split(".")[0]?.trim();
    if (firstSentence) {
      defaultBodyParts.push(
        `The opportunity to ${firstSentence.toLowerCase()} aligns strongly with my background and aspirations.`
      );
    }
  }

  const defaultBody = defaultBodyParts.join("\n\n");
  const closing = data.customClosing?.trim() || `Sincerely,\n${name}`;

  const achievementsBlock = opts.includeAchievements && resume.experience?.length
    ? resume.experience.slice(0,1).flatMap(exp => exp.achievements.slice(0,3)).filter(a => a.trim())
    : [];

  const bodyWithAchievements = [
    data.customBody?.trim() || defaultBody,
    achievementsBlock.length ? `Key Achievements:\n- ${achievementsBlock.join("\n- ")}` : undefined,
  ].filter(Boolean).join("\n\n");

  return [
    `${formattedDate}`,
    "",
    `${hiringManager}`,
    `${companyName}`,
    companyLocation ? `${companyLocation}` : undefined,
    "",
    `Dear ${hiringManager},`,
    "",
    data.customOpening?.trim() || defaultOpening,
    "",
    bodyWithAchievements,
    "",
    closing,
    "",
    `${name} | ${location} | ${email} | ${phone}`,
  ].filter(Boolean).join("\n");
};

// A lightweight implementation so the page can render and builds succeed.
// Enhancements (AI generation, richer editing) can be layered on later.
export const CoverLetterGenerator: React.FC<CoverLetterGeneratorProps> = ({
  resumeData,
  onGenerate,
}) => {
  const [formData, setFormData] = useState<CoverLetterData>(DEFAULT_LETTER_DATA);
  const [letter, setLetter] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [includeAchievements, setIncludeAchievements] = useState(true);

  const updateField = (field: keyof CoverLetterData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateArrayField = (
    field: keyof Pick<CoverLetterData, "keyRequirements" | "companyValues">,
    index: number,
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].map((v, i) => (i === index ? value : v)),
    }));
  };

  const addArrayItem = (
    field: keyof Pick<CoverLetterData, "keyRequirements" | "companyValues">,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: [...prev[field], ""] }));
  };

  const removeArrayItem = (
    field: keyof Pick<CoverLetterData, "keyRequirements" | "companyValues">,
    index: number,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const handleGenerate = () => {
    if (!formData.jobTitle.trim() || !formData.companyName.trim()) {
      showError("Enter at least a job title and company");
      return;
    }
    try {
      setGenerating(true);
      const generated = formatLetter(formData, resumeData, { includeAchievements });
      setLetter(generated);
      onGenerate?.(generated);
      showSuccess("Cover letter generated");
    } catch (e) {
      console.error(e);
      showError("Failed to generate cover letter");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(letter);
      showSuccess("Copied to clipboard");
    } catch {
      showError("Clipboard copy failed");
    }
  };

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Cover Letter Generator</CardTitle>
        <CardDescription>Create a tailored cover letter from your resume data</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="jobTitle">Job Title</Label>
            <Input
              id="jobTitle"
              value={formData.jobTitle}
              onChange={(e) => updateField("jobTitle", e.target.value)}
              placeholder="e.g. Frontend Engineer"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              value={formData.companyName}
              onChange={(e) => updateField("companyName", e.target.value)}
              placeholder="e.g. Acme Corp"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyLocation">Company Location</Label>
            <Input
              id="companyLocation"
              value={formData.companyLocation}
              onChange={(e) => updateField("companyLocation", e.target.value)}
              placeholder="e.g. Remote / New York, NY"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hiringManager">Hiring Manager</Label>
            <Input
              id="hiringManager"
              value={formData.hiringManager}
              onChange={(e) => updateField("hiringManager", e.target.value)}
              placeholder="Optional"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Key Requirements (top 3)</Label>
          {formData.keyRequirements.map((req, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <Input
                value={req}
                onChange={(e) => updateArrayField("keyRequirements", i, e.target.value)}
                placeholder="e.g. React, TypeScript, UI/UX"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => removeArrayItem("keyRequirements", i)}
                disabled={formData.keyRequirements.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="secondary" size="sm" onClick={() => addArrayItem("keyRequirements")}>Add Requirement</Button>
        </div>

        <div className="space-y-2">
          <Label>Company Values</Label>
          {formData.companyValues.map((val, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <Input
                value={val}
                onChange={(e) => updateArrayField("companyValues", i, e.target.value)}
                placeholder="e.g. Innovation"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => removeArrayItem("companyValues", i)}
                disabled={formData.companyValues.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="secondary" size="sm" onClick={() => addArrayItem("companyValues")}>Add Value</Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="jobDescription">Job Description (first paragraph)</Label>
          <Textarea
            id="jobDescription"
            value={formData.jobDescription}
            onChange={(e) => updateField("jobDescription", e.target.value)}
            rows={4}
          />
        </div>

        <div className="flex gap-3 items-center flex-wrap">
          <Button onClick={handleGenerate} disabled={generating}>
            {generating ? "Generating..." : "Generate Letter"}
          </Button>
          {letter && (
            <Button variant="outline" onClick={handleCopy}>
              Copy to Clipboard
            </Button>
          )}
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={includeAchievements}
              onChange={e => setIncludeAchievements(e.target.checked)}
            />
            Include achievements
          </label>
        </div>

        {letter && (
          <div className="space-y-2">
            <Label>Generated Letter</Label>
            <Textarea value={letter} readOnly rows={16} className="font-mono text-sm" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
