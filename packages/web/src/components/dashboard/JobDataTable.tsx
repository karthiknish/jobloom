"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import type { ColumnDef, Row } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

interface JobDataTableProps {
  applications: Application[];
  onEditApplication: (application: Application) => void;
  onDeleteApplication: (applicationId: string) => void;
  onViewApplication: (application: Application) => void;
  onChanged?: () => void;
}

export function JobDataTable({
  applications,
  onEditApplication,
  onDeleteApplication,
  onViewApplication,
  onChanged,
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
      case "interview":
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case "offered":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "applied":
        return "default";
      case "interview":
        return "secondary";
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
      accessorKey: "job.title",
      header: "Job Title",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-muted-foreground" />
          <div className="max-w-[200px]">
            <div className="font-medium truncate">{row.getValue("job.title")}</div>
            <div className="text-sm text-muted-foreground">
              {row.original.job?.company}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "job.location",
      header: "Location",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{row.getValue("job.location")}</span>
        </div>
      ),
    },
    {
      accessorKey: "job.salary",
      header: "Salary",
      cell: ({ row }) => {
        const salary = row.original.job?.salary;
        if (!salary) return null;
        return (
          <div className="flex items-center gap-1">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{salary}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "job.dateFound",
      header: "Date Applied",
      cell: ({ row }) => {
        const date = row.original.job?.dateFound;
        if (!date) return null;
        return (
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {format(new Date(date), "MMM d, yyyy")}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <div className="flex items-center gap-2">
            {getStatusIcon(status)}
            <Badge variant={getStatusVariant(status)}>
              {status}
            </Badge>
          </div>
        );
      },
      filterFn: (row: Row<Application>, id: string, value: string[]) => {
        const rowValue = row.getValue<string>(id);
        return value.includes(rowValue);
      },
    },
    {
      accessorKey: "job.isSponsored",
      header: "Sponsorship",
      cell: ({ row }) => {
        const isSponsored = row.original.job?.isSponsored;
        return (
          <div className="space-y-1">
            {isSponsored && (
              <Badge variant="outline" className="border-emerald-500 text-emerald-700 text-xs">
                🇬🇧 Sponsored
              </Badge>
            )}
            {row.original.job?.remoteWork && (
              <Badge variant="outline" className="border-blue-500 text-blue-700 text-xs">
                Remote
              </Badge>
            )}
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
        searchKey="job.title"
        searchPlaceholder="Search jobs by title, company, or location..."
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
