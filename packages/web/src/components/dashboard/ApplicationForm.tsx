"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { Loader2, PlusCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Job, Application } from "@/types/dashboard";
import { getSalaryDisplay } from "@/utils/dashboard";
import { DatePicker } from "@/components/ui/date-picker";

interface ApplicationFormValues {
  status: "interested" | "applied" | "offered" | "rejected" | "withdrawn";
  appliedDate: string;
  notes: string;
  followUpDate: string;
}

const applicationSchema: z.ZodType<ApplicationFormValues> = z.object({
  status: z.enum(["interested", "applied", "offered", "rejected", "withdrawn"]),
  appliedDate: z.string(),
  notes: z.string(),
  followUpDate: z.string(),
});

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<ApplicationFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(applicationSchema as any),
    defaultValues: {
      status: (application?.status as any) || "interested",
      appliedDate: application?.appliedDate ? format(new Date(application.appliedDate), "yyyy-MM-dd") : "",
      notes: application?.notes || "",
      followUpDate: application?.followUpDate ? format(new Date(application.followUpDate), "yyyy-MM-dd") : "",
    },
  });

  const onFormSubmit = async (values: ApplicationFormValues) => {
    setIsSubmitting(true);
    setFormError(null);
    try {
      const submitData: Record<string, unknown> = {
        status: values.status,
        notes: values.notes,
      };

      if (values.appliedDate) {
        submitData.appliedDate = new Date(values.appliedDate).getTime();
      }
      
      if (values.followUpDate) {
        submitData.followUpDate = new Date(values.followUpDate).getTime();
      }
      
      if (!application && jobId) {
        submitData.jobId = jobId;
      }

      await onSubmit(submitData);
    } catch (error: any) {
      setFormError(error.message || "Failed to save application");
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusOptions = [
    { value: "interested", label: "Interested" },
    { value: "applied", label: "Applied" },
    { value: "offered", label: "Offered" },
    { value: "rejected", label: "Rejected" },
    { value: "withdrawn", label: "Withdrawn" },
  ];

  const statusBadges: Record<string, "secondary" | "destructive" | "default" | "outline" | "green" | "orange" | "teal" | "yellow"> = {
    interested: "default",
    applied: "yellow",
    offered: "green",
    rejected: "destructive",
    withdrawn: "secondary",
  };

  return (
    <Card className="w-full max-w-4xl mx-auto motion-card">
      <CardHeader>
        <CardTitle>{application ? "Edit Application" : "Add New Application"}</CardTitle>
        <CardDescription>Track your job application progress</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-6">
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
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Salary:</span> {getSalaryDisplay(application.job.salary)}
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
                      {(application.job.skills || []).map((skill: string, index: number) => (
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
                      {(application.job.requirements || []).slice(0, 3).map((req: string, index: number) => (
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
                
                {/* Status and Badges */}
                <div className="flex items-center gap-2 motion-fade-in-out">
                  <span className="font-medium">Status:</span>
                  <Badge variant={statusBadges[form.watch("status")] || "secondary"}>
                    {statusOptions.find((opt) => opt.value === form.watch("status"))?.label || form.watch("status")}
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
              </div>
            )}
            
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Application Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Applied Date */}
              <FormField
                control={form.control}
                name="appliedDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Applied Date</FormLabel>
                    <FormControl>
                      <DatePicker
                        date={field.value ? new Date(field.value) : undefined}
                        onDateChange={(date) => {
                          field.onChange(date ? format(date, "yyyy-MM-dd") : "");
                        }}
                        placeholder="Select date"
                        clearable
                        toDate={new Date()}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Follow-up Date */}
            <FormField
              control={form.control}
              name="followUpDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Follow-up Date</FormLabel>
                  <FormControl>
                    <DatePicker
                      date={field.value ? new Date(field.value) : undefined}
                      onDateChange={(date) => {
                        field.onChange(date ? format(date, "yyyy-MM-dd") : "");
                      }}
                      placeholder="Select follow-up date"
                      clearable
                      fromDate={new Date()}
                    />
                  </FormControl>
                  <FormDescription>When do you plan to follow up?</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      rows={4} 
                      placeholder="Add any notes about this application..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {formError && (
              <div className="bg-destructive/10 border border-destructive text-destructive text-sm p-3 rounded-md">
                {formError}
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" className="motion-button" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" className="motion-button" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {application ? "Update Application" : "Create Application"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}