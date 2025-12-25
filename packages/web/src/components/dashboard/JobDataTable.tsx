"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import type { ColumnDef, Row } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { ApplicationStatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnActions } from "@/components/ui/data-table";
import { 
  Building2, 
  MapPin, 
  Calendar, 
  DollarSign,
  Briefcase,
  ExternalLink,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { Application } from "@/utils/api/dashboard";
import { UkVisaBadge } from "./UkVisaBadge";

interface JobDataTableProps {
  applications: Application[];
  onEditApplication: (application: Application) => void;
  onDeleteApplication: (applicationId: string) => void;
  onViewApplication: (application: Application) => void;
  onChanged?: () => void;
  selectedIds?: Set<string>;
  onToggleSelection?: (id: string) => void;
}

export function JobDataTable({
  applications,
  onEditApplication,
  onDeleteApplication,
  onViewApplication,
  onChanged,
  selectedIds,
  onToggleSelection,
}: JobDataTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        app.job?.title?.toLowerCase().includes(searchLower) ||
        app.job?.company?.toLowerCase().includes(searchLower) ||
        app.job?.location?.toLowerCase().includes(searchLower) ||
        app.status?.toLowerCase().includes(searchLower)
      );
    });
  }, [applications, searchTerm]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "applied":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "offered":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "applied":
        return "default";
      case "offered":
        return "default";
      case "rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  const columns: ColumnDef<Application>[] = [
    {
      id: "select",
      header: () => <span className="sr-only">Select</span>,
      cell: ({ row }) => {
        if (!onToggleSelection) return null;
        const id = row.original._id;
        const checked = !!selectedIds?.has(id);
        return (
          <div
            className="flex items-center"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Checkbox
              checked={checked}
              onCheckedChange={() => onToggleSelection(id)}
              aria-label="Select application"
            />
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "jobTitle",
      accessorFn: (row) => row.job?.title,
      header: "Job Title",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-muted-foreground" />
          <div className="max-w-[200px]">
            <div className="font-medium truncate">{row.original.job?.title || "Untitled"}</div>
            <div className="text-sm text-muted-foreground">
              {row.original.job?.company || "Unknown company"}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "jobLocation",
      accessorFn: (row) => row.job?.location,
      header: "Location",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{row.original.job?.location || "Not specified"}</span>
        </div>
      ),
    },
    {
      id: "jobSalary",
      accessorFn: (row) => row.job?.salary,
      header: "Salary",
      cell: ({ row }) => {
        const salary = row.original.job?.salary;
        if (!salary) return <span className="text-muted-foreground text-sm">-</span>;
        return (
          <div className="flex items-center gap-1">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{salary}</span>
          </div>
        );
      },
    },
    {
      id: "dateFound",
      accessorFn: (row) => row.job?.dateFound,
      header: "Date Applied",
      cell: ({ row }) => {
        const date = row.original.job?.dateFound;
        if (!date) return <span className="text-muted-foreground text-sm">-</span>;
        
        // Validate the date before formatting
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) {
          return <span className="text-muted-foreground text-sm">-</span>;
        }
        
        return (
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {format(dateObj, "MMM d, yyyy")}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status || "unknown";
        return (
          <div className="flex items-center gap-2">
            {getStatusIcon(status)}
            <ApplicationStatusBadge status={status} />
          </div>
        );
      },
      filterFn: (row: Row<Application>, id: string, value: string[]) => {
        const rowValue = row.getValue<string>(id);
        return value.includes(rowValue);
      },
    },
    {
      id: "sponsorship",
      accessorFn: (row) => row.job?.isSponsored,
      header: "Sponsorship & SOC",
      cell: ({ row }) => {
        const job = row.original.job;
        const isSponsored = job?.isSponsored;
        const sponsorshipType = job?.sponsorshipType;
        const socCode = job?.likelySocCode;
        const socConfidence = job?.socMatchConfidence;
        
        return (
          <div className="space-y-1">
            {isSponsored && (
              <Badge variant="outline" className="border-primary text-primary text-xs">
                Sponsored{sponsorshipType ? ` - ${sponsorshipType}` : ""}
              </Badge>
            )}
            {socCode && (
              <Badge variant="secondary" className="text-xs" title="UK SOC Code">
                SOC: {socCode}{socConfidence ? ` (${Math.round(socConfidence * 100)}%)` : ""}
              </Badge>
            )}
            {job?.remoteWork && (
              <Badge variant="outline" className="border-blue-500 text-blue-700 text-xs">
                Remote
              </Badge>
            )}
            {job && <UkVisaBadge job={job} compact />}
          </div>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const application = row.original;

        const actions = [
          {
            label: "View Details",
            onClick: () => onViewApplication(application),
          },
          {
            label: "Edit",
            onClick: () => onEditApplication(application),
          },
          {
            label: "Delete",
            onClick: () => onDeleteApplication(application._id),
            variant: "destructive" as const,
          },
        ];

        return (
          <DataTableColumnActions
            row={application}
            actions={actions}
          />
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={filteredApplications}
        searchKey="jobTitle"
        searchPlaceholder="Search jobs by title, company, or location..."
        onRowClick={onViewApplication}
      />
      
      {filteredApplications.length === 0 && applications.length > 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            No jobs found matching “{searchTerm}”
          </p>
          <Button
            variant="outline"
            onClick={() => setSearchTerm("")}
            className="mt-2"
          >
            Clear search
          </Button>
        </div>
      )}
      
      {applications.length === 0 && (
        <div className="text-center py-12">
          <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No job applications yet</h3>
          <p className="text-muted-foreground mb-4">
            Start tracking your job applications to see them here.
          </p>
          <Button onClick={() => onChanged?.()}>
            Add Your First Job
          </Button>
        </div>
      )}
    </div>
  );
}
