"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { PlusCircle, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  url?: string;
  description?: string;
  salary?: string;
  salaryRange?: {
    min?: number;
    max?: number;
    currency?: string;
  } | null;
  skills?: string[];
  requirements?: string[];
  benefits?: string[];
  jobType?: string;
  experienceLevel?: string;
  remoteWork?: boolean;
  companySize?: string;
  industry?: string;
  postedDate?: string;
  applicationDeadline?: string;
  isSponsored: boolean;
  isRecruitmentAgency?: boolean;
  sponsorshipType?: string;
  source: string;
  dateFound: number;
  userId: string;
}

interface Application {
  _id: string;
  jobId: string;
  userId: string;
  status: string;
  appliedDate?: number;
  notes?: string;
  followUpDate?: number;
  createdAt: number;
  updatedAt: number;
  job?: Job;
}

interface ApplicationFormProps {
  application?: Application;
  jobId?: string;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}

export function ApplicationForm({ 
  application, 
  jobId,
  onSubmit, 
  onCancel 
}: ApplicationFormProps) {
  const [formData, setFormData] = useState({
    status: application?.status || "interested",
    appliedDate: application?.appliedDate ? format(new Date(application.appliedDate), "yyyy-MM-dd") : "",
    notes: application?.notes || "",
    followUpDate: application?.followUpDate ? format(new Date(application.followUpDate), "yyyy-MM-dd") : "",
  });

  const statusOptions = [
    { value: "interested", label: "Interested" },
    { value: "applied", label: "Applied" },
    { value: "offered", label: "Offered" },
    { value: "rejected", label: "Rejected" },
    { value: "withdrawn", label: "Withdrawn" },
  ];

  const statusBadges: Record<
    | "interested"
    | "applied"
    | "offered"
    | "rejected"
    | "withdrawn",
    | "secondary"
    | "destructive"
    | "default"
    | "outline"
    | "green"
    | "orange"
    | "teal"
    | "yellow"
  > = {
    interested: "default",
    applied: "yellow",
    offered: "green",
    rejected: "destructive",
    withdrawn: "secondary",
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (value: string) => {
    setFormData(prev => ({ ...prev, status: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData: Record<string, unknown> = {
      status: formData.status,
      notes: formData.notes,
    };
    
    if (formData.appliedDate) {
      submitData.appliedDate = new Date(formData.appliedDate).getTime();
    }
    
    if (formData.followUpDate) {
      submitData.followUpDate = new Date(formData.followUpDate).getTime();
    }
    
    if (!application && jobId) {
      submitData.jobId = jobId;
    }
    
    await onSubmit(submitData);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto motion-card">
      <CardHeader>
        <CardTitle>{application ? "Edit Application" : "Add New Application"}</CardTitle>
        <CardDescription>Track your job application progress</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Job Information (if editing existing application) */}
          {application?.job && (
            <div className="bg-muted rounded-lg p-4 space-y-4 motion-fade-in-out">
              <h3 className="font-medium text-foreground">Job Details</h3>
              
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                <div>
                  <span className="font-medium">Title:</span> {application.job.title}
                </div>
                <div>
                  <span className="font-medium">Company:</span> {application.job.company}
                </div>
                <div>
                  <span className="font-medium">Location:</span> {application.job.location}
                </div>
              </div>
              
              {/* Additional Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                {application.job.salary && (
                  <div>
                    <span className="font-medium">Salary:</span> {application.job.salary}
                  </div>
                )}
                {application.job.jobType && (
                  <div>
                    <span className="font-medium">Job Type:</span> {application.job.jobType}
                  </div>
                )}
                {application.job.experienceLevel && (
                  <div>
                    <span className="font-medium">Experience:</span> {application.job.experienceLevel}
                  </div>
                )}
                {application.job.industry && (
                  <div>
                    <span className="font-medium">Industry:</span> {application.job.industry}
                  </div>
                )}
                {application.job.companySize && (
                  <div>
                    <span className="font-medium">Company Size:</span> {application.job.companySize}
                  </div>
                )}
                {application.job.remoteWork && (
                  <div>
                    <span className="font-medium">Remote:</span> Yes
                  </div>
                )}
              </div>
              
              {/* Skills */}
              {application.job.skills && application.job.skills.length > 0 && (
                <div>
                  <span className="font-medium text-sm">Skills:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {application.job.skills.map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-xs motion-fade-in-out">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Requirements */}
              {application.job.requirements && application.job.requirements.length > 0 && (
                <div>
                  <span className="font-medium text-sm">Requirements:</span>
                  <ul className="text-sm mt-1 space-y-1">
                    {application.job.requirements.slice(0, 3).map((req, index) => (
                      <li key={index} className="flex items-start gap-1 motion-fade-in-out">
                        <span className="text-muted-foreground">•</span>
                        {req}
                      </li>
                    ))}
                    {application.job.requirements.length > 3 && (
                      <li className="text-muted-foreground text-xs">
                        +{application.job.requirements.length - 3} more requirements
                      </li>
                    )}
                  </ul>
                </div>
              )}
              
              {/* Benefits */}
              {application.job.benefits && application.job.benefits.length > 0 && (
                <div>
                  <span className="font-medium text-sm">Benefits:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {application.job.benefits.slice(0, 5).map((benefit, index) => (
                      <Badge key={index} variant="secondary" className="text-xs motion-fade-in-out">
                        {benefit}
                      </Badge>
                    ))}
                    {application.job.benefits.length > 5 && (
                      <Badge variant="secondary" className="text-xs motion-fade-in-out">
                        +{application.job.benefits.length - 5}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
              
              {/* Status and Badges */}
              <div className="flex items-center gap-2 motion-fade-in-out">
                <span className="font-medium">Status:</span>
                <Badge variant={statusBadges[formData.status as keyof typeof statusBadges] || "secondary"}>
                  {statusOptions.find(opt => opt.value === formData.status)?.label || formData.status}
                </Badge>
                {application.job.isSponsored && (
                  <Badge variant="orange">Sponsored</Badge>
                )}
                {application.job.isRecruitmentAgency && (
                  <Badge variant="outline">Agency</Badge>
                )}
                {application.job.remoteWork && (
                  <Badge variant="outline">Remote</Badge>
                )}
              </div>
              
              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground motion-fade-in-out">
                <div>
                  <span className="font-medium">Posted:</span> {application.job.postedDate || "N/A"}
                </div>
                <div>
                  <span className="font-medium">Deadline:</span> {application.job.applicationDeadline || "N/A"}
                </div>
              </div>
            </div>
          )}
          
          <Separator />
          
          {/* Status */}
          <div className="space-y-2 motion-fade-in-out">
            <Label htmlFor="status">Application Status</Label>
            <Select value={formData.status} onValueChange={handleStatusChange}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Applied Date */}
          <div className="space-y-2 motion-fade-in-out">
            <Label htmlFor="appliedDate">Applied Date</Label>
            <Input
              id="appliedDate"
              name="appliedDate"
              type="date"
              value={formData.appliedDate}
              onChange={handleChange}
            />
          </div>
          
          {/* Follow-up Date */}
          <div className="space-y-2 motion-fade-in-out">
            <Label htmlFor="followUpDate">Follow-up Date</Label>
            <Input
              id="followUpDate"
              name="followUpDate"
              type="date"
              value={formData.followUpDate}
              onChange={handleChange}
            />
          </div>
          
          {/* Notes */}
          <div className="space-y-2 motion-fade-in-out">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              placeholder="Add any notes about this application..."
            />
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-end space-x-3">
        <Button variant="outline" className="motion-button" onClick={onCancel}>
          Cancel
        </Button>
        <Button className="motion-button" onClick={handleSubmit}>
          {application ? "Update Application" : "Create Application"}
        </Button>
      </CardFooter>
    </Card>
  );
}