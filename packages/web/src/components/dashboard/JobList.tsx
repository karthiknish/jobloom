"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { EyeIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  url?: string;
  description?: string;
  salary?: string;
  isSponsored: boolean;
  isRecruitmentAgency?: boolean;
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
  interviewDates?: number[];
  followUpDate?: number;
  createdAt: number;
  updatedAt: number;
  job?: Job;
}

interface JobListProps {
  applications: Application[];
  onEditApplication: (application: Application) => void;
  onDeleteApplication: (applicationId: string) => void;
  onViewApplication: (application: Application) => void;
}

export function JobList({ 
  applications, 
  onEditApplication, 
  onDeleteApplication,
  onViewApplication
}: JobListProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [showRecruitmentAgency, setShowRecruitmentAgency] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("dateFound");
  const [applicationToDelete, setApplicationToDelete] = useState<Application | null>(null);

  const statusVariants = {
    interested: "blue",
    applied: "yellow",
    interviewing: "purple",
    offered: "green",
    rejected: "destructive",
    withdrawn: "secondary",
  };

  const filteredAndSortedApplications = useMemo(() => {
    const filtered = applications.filter(app => {
      const matchesStatus = selectedStatus === "all" || app.status === selectedStatus;
      const matchesAgency = showRecruitmentAgency || !app.job?.isRecruitmentAgency;
      const matchesSearch = searchQuery === "" || 
        (app.job?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         app.job?.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         app.job?.location?.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return matchesStatus && matchesAgency && matchesSearch;
    });

    // Sort applications
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "title":
          return (a.job?.title || "").localeCompare(b.job?.title || "");
        case "company":
          return (a.job?.company || "").localeCompare(b.job?.company || "");
        case "dateFound":
        default:
          return (b.job?.dateFound || 0) - (a.job?.dateFound || 0);
      }
    });

    return filtered;
  }, [applications, selectedStatus, showRecruitmentAgency, searchQuery, sortBy]);

  const handleDeleteClick = (application: Application) => {
    setApplicationToDelete(application);
  };

  const confirmDelete = () => {
    if (applicationToDelete) {
      onDeleteApplication(applicationToDelete._id);
      setApplicationToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Job Filters</CardTitle>
          <CardDescription>Filter and sort your job applications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2 space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="interested">Interested</SelectItem>
                  <SelectItem value="applied">Applied</SelectItem>
                  <SelectItem value="interviewing">Interviewing</SelectItem>
                  <SelectItem value="offered">Offered</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="withdrawn">Withdrawn</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sort">Sort By</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger id="sort">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dateFound">Date Found</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
                id="show-agency"
                checked={showRecruitmentAgency}
                onCheckedChange={(checked) => setShowRecruitmentAgency(checked === true)}
              />
            <Label htmlFor="show-agency">Show Recruitment Agency Jobs</Label>
          </div>
        </CardContent>
      </Card>

      {/* Job List */}
      {filteredAndSortedApplications.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {filteredAndSortedApplications.map((application) => (
                <motion.li
                  key={application._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-6 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground truncate">
                            {application.job?.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {application.job?.company} • {application.job?.location}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {application.job?.isSponsored && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="orange">Sponsored</Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>This job is sponsored by the company</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          <Badge variant={statusVariants[application.status as keyof typeof statusVariants] || "secondary"}>
                            {application.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="mt-2 flex flex-wrap items-center text-sm text-muted-foreground gap-4">
                        <span>
                          Found: {format(new Date(application.job?.dateFound || 0), "MMM d, yyyy")}
                        </span>
                        {application.appliedDate && (
                          <span>
                            Applied: {format(new Date(application.appliedDate), "MMM d, yyyy")}
                          </span>
                        )}
                        {application.job?.salary && (
                          <span>
                            Salary: {application.job.salary}
                          </span>
                        )}
                        <span className="capitalize">
                          Source: {application.job?.source}
                        </span>
                      </div>
                      
                      {application.notes && (
                        <p className="mt-2 text-sm text-foreground line-clamp-2">
                          {application.notes}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onViewApplication(application)}
                            >
                              <EyeIcon className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View Details</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onEditApplication(application)}
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit Application</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteClick(application)}
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the application
                                    for "{application.job?.title}" at {application.job?.company}.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Delete Application</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </motion.li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              No jobs found
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery || selectedStatus !== "all" 
                ? "Try adjusting your filters or search terms" 
                : "Start by installing the Chrome extension to track jobs automatically"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}