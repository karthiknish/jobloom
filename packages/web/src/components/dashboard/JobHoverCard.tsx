"use client";

import React, { useMemo } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  Briefcase,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { Application } from "@/utils/api/dashboard";
import { getSalaryDisplay } from "@/utils/dashboard";

interface JobHoverCardProps {
  application: Application;
  children: React.ReactNode;
  onViewDetails?: (application: Application) => void;
}

// Memoized to prevent re-renders when parent list updates other items
export const JobHoverCard = React.memo(function JobHoverCard({ 
  application, 
  children, 
  onViewDetails 
}: JobHoverCardProps) {
  // Memoize status-dependent values
  const statusIcon = useMemo(() => {
    switch (application.status) {
      case "applied":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "offered":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  }, [application.status]);

  const statusVariant = useMemo((): "default" | "secondary" | "destructive" | "outline" => {
    switch (application.status) {
      case "applied":
        return "default";
      case "offered":
        return "default";
      case "rejected":
        return "destructive";
      default:
        return "outline";
    }
  }, [application.status]);


  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="space-y-4">
          {/* Header */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold leading-none">
              {application.job?.title || "Untitled Job"}
            </h4>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {application.job?.company || "Unknown Company"}
            </p>
          </div>

          {/* Key Details */}
          <div className="space-y-2">
            {application.job?.location && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                <span>{application.job.location}</span>
              </div>
            )}
            
            {application.job?.dateFound && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span>{format(new Date(application.job.dateFound), "MMM d, yyyy")}</span>
              </div>
            )}

            {application.job?.salary && (
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium">{getSalaryDisplay(application.job.salary)}</span>
              </div>
            )}

            {application.job?.jobType && (
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="h-3 w-3 text-muted-foreground" />
                <span>{application.job.jobType}</span>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            {statusIcon}
            <Badge variant={statusVariant} className="text-xs">
              {application.status}
            </Badge>
          </div>

          {/* Special Badges */}
          <div className="flex flex-wrap gap-1">
            {application.job?.isSponsored && (
              <Badge variant="outline" className="border-primary text-primary text-xs">
                Sponsored
              </Badge>
            )}
            {application.job?.isRecruitmentAgency && (
              <Badge variant="outline" className="border-blue-500 text-blue-700 text-xs">
                Agency
              </Badge>
            )}
            {application.job?.remoteWork && (
              <Badge variant="outline" className="border-teal-500 text-teal-700 text-xs">
                Remote
              </Badge>
            )}
          </div>

          {/* Skills Preview */}
          {application.job?.skills && application.job.skills.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Skills:</p>
              <div className="flex flex-wrap gap-1">
                {application.job.skills.slice(0, 4).map((skill: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {skill}
                  </Badge>
                ))}
                {application.job.skills.length > 4 && (
                  <Badge variant="outline" className="text-xs">
                    +{application.job.skills.length - 4}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Action */}
          {onViewDetails && (
            <div className="pt-2 border-t">
              <Button
                type="button"
                variant="link"
                onClick={() => onViewDetails(application)}
                className="h-auto gap-2 p-0 text-sm text-primary hover:text-primary/80"
              >
                <ExternalLink className="h-3 w-3" />
                View Details
              </Button>
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
});

