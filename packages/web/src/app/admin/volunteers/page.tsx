"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Loader2,
  Search,
  MoreHorizontal,
  Eye,
  Download,
  Copy,
  RefreshCw,
  Mail,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useApiQuery, useApiMutation } from "@/hooks/useApi";
import { adminApi } from "@/utils/api/admin";
import { exportToCsv } from "@/utils/exportToCsv";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminAccessDenied } from "@/components/admin/AdminAccessDenied";
import { Button } from "@/components/ui/button";
import { LoadingSpinner, LoadingPage } from "@/components/ui/loading";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

import type { ContactSubmission } from "@/types/api";

// Volunteer applications come through the contact form with "VOLUNTEER APPLICATION" in the message
const isVolunteerApplication = (contact: ContactSubmission) => 
  contact.message.includes("VOLUNTEER APPLICATION");

const STATUS_LABELS: Record<ContactSubmission["status"], string> = {
  new: "New",
  read: "Reviewed",
  responded: "Contacted",
  archived: "Archived",
};

const STATUS_COLORS: Record<ContactSubmission["status"], string> = {
  new: "bg-blue-100 text-blue-700",
  read: "bg-yellow-100 text-yellow-700",
  responded: "bg-green-100 text-green-700",
  archived: "bg-gray-100 text-gray-600",
};

// Parse volunteer application message to extract structured data
const parseVolunteerData = (message: string) => {
  const lines = message.split("\n");
  const data: Record<string, string> = {};
  let currentSection = "";
  
  for (const line of lines) {
    if (line.startsWith("Skills:")) {
      data.skills = line.replace("Skills:", "").trim();
    } else if (line.startsWith("Availability:")) {
      data.availability = line.replace("Availability:", "").trim();
    } else if (line.startsWith("Portfolio/GitHub:")) {
      data.portfolio = line.replace("Portfolio/GitHub:", "").trim();
    } else if (line === "Experience:") {
      currentSection = "experience";
    } else if (line === "Motivation:") {
      currentSection = "motivation";
    } else if (currentSection === "experience" && line.trim()) {
      data.experience = (data.experience || "") + line + " ";
    } else if (currentSection === "motivation" && line.trim()) {
      data.motivation = (data.motivation || "") + line + " ";
    }
  }
  
  return data;
};

export default function AdminVolunteerDashboard() {
  const { toast } = useToast();
  const { isAdmin, isLoading: adminLoading, userRecord } = useAdminAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedVolunteer, setSelectedVolunteer] = useState<ContactSubmission | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const canFetchAdminData = isAdmin === true;

  const loadContacts = useCallback(
    () => adminApi.getAllContactSubmissions(),
    []
  );

  const {
    data: allContacts,
    loading: contactsLoading,
    error: contactsError,
    refetch: refetchContacts,
  } = useApiQuery(
    loadContacts,
    [userRecord?._id, isAdmin],
    { enabled: canFetchAdminData }
  );

  useEffect(() => {
    if (!contactsError) return;
    toast({
      title: "Error",
      description: contactsError.message || "Failed to load volunteers",
      variant: "destructive",
    });
  }, [contactsError, toast]);

  // Filter only volunteer applications
  const volunteers = useMemo(() => {
    const contacts = allContacts ?? [];
    return contacts.filter(isVolunteerApplication);
  }, [allContacts]);

  const { mutate: updateContact, loading: updateLoading } = useApiMutation(
    ({
      contactId,
      updates,
    }: {
      contactId: string;
      updates: Partial<
        Pick<ContactSubmission, "status" | "response" | "respondedAt" | "respondedBy">
      >;
    }) => adminApi.updateContactSubmission(contactId, updates)
  );

  const { mutate: deleteContact, loading: deleteLoading } = useApiMutation(
    ({ contactId }: { contactId: string }) => adminApi.deleteContactSubmission(contactId)
  );

  const filteredVolunteers = useMemo(() => {
    return volunteers.filter((volunteer) => {
      const matchesStatus = statusFilter === "all" || volunteer.status === statusFilter;
      if (!matchesStatus) return false;

      const normalizedSearch = searchTerm.trim().toLowerCase();
      if (!normalizedSearch) return true;

      const volunteerData = parseVolunteerData(volunteer.message);
      return (
        volunteer.name.toLowerCase().includes(normalizedSearch) ||
        volunteer.email.toLowerCase().includes(normalizedSearch) ||
        (volunteerData.skills || "").toLowerCase().includes(normalizedSearch)
      );
    });
  }, [volunteers, searchTerm, statusFilter]);

  const volunteerStats = useMemo(() => {
    const total = volunteers.length;
    const newApps = volunteers.filter((v) => v.status === "new").length;
    const reviewed = volunteers.filter((v) => v.status === "read").length;
    const contacted = volunteers.filter((v) => v.status === "responded").length;
    const archived = volunteers.filter((v) => v.status === "archived").length;

    return { total, newApps, reviewed, contacted, archived };
  }, [volunteers]);

  const getStatusBadge = (status: ContactSubmission["status"]) => (
    <Badge className={`capitalize ${STATUS_COLORS[status]}`}>{STATUS_LABELS[status]}</Badge>
  );

  const copyEmailsToClipboard = async (targetVolunteers: ContactSubmission[]) => {
    if (!targetVolunteers.length) {
      toast({
        title: "No emails",
        description: "No volunteer emails to copy.",
        variant: "destructive",
      });
      return;
    }

    const emails = targetVolunteers.map((v) => v.email).filter(Boolean).join(", ");

    try {
      await navigator.clipboard.writeText(emails);
      toast({
        title: "Copied",
        description: `Copied ${targetVolunteers.length} email(s) to clipboard`,
      });
    } catch (error) {
      console.error("Failed to copy emails", error);
      toast({
        title: "Error",
        description: "Unable to copy emails",
        variant: "destructive",
      });
    }
  };

  const handleExport = () => {
    if (!filteredVolunteers.length) {
      toast({
        title: "No data",
        description: "No volunteers to export.",
        variant: "destructive",
      });
      return;
    }

    const rows = filteredVolunteers.map((volunteer) => {
      const data = parseVolunteerData(volunteer.message);
      return {
        Name: volunteer.name,
        Email: volunteer.email,
        Skills: data.skills || "",
        Availability: data.availability || "",
        Portfolio: data.portfolio || "",
        Status: STATUS_LABELS[volunteer.status],
        "Applied At": new Date(volunteer.createdAt).toISOString(),
      };
    });

    exportToCsv(`volunteer-applications-${new Date().toISOString().slice(0, 10)}`, rows);
    toast({
      title: "Export Successful",
      description: `Exported ${filteredVolunteers.length} volunteer applications`,
    });
  };

  const handleUpdateStatus = async (
    volunteer: ContactSubmission,
    status: ContactSubmission["status"]
  ) => {
    try {
      await updateContact({
        contactId: volunteer._id,
        updates: {
          status,
          respondedBy: status === "responded" ? userRecord?.email ?? "" : volunteer.respondedBy,
          respondedAt: status === "responded" ? Date.now() : volunteer.respondedAt,
        },
      });
      toast({
        title: "Status Updated",
        description: `${volunteer.name} marked as ${STATUS_LABELS[status]}`,
      });
      refetchContacts();
    } catch (error) {
      console.error("Failed to update status", error);
      toast({
        title: "Error",
        description: "Unable to update status",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (volunteer: ContactSubmission) => {
    if (!confirm(`Delete application from ${volunteer.name}? This cannot be undone.`)) {
      return;
    }

    try {
      await deleteContact({ contactId: volunteer._id });
      toast({
        title: "Deleted",
        description: "Application deleted",
      });
      refetchContacts();
    } catch (error) {
      console.error("Failed to delete", error);
      toast({
        title: "Error",
        description: "Unable to delete application",
        variant: "destructive",
      });
    }
  };

  const handleEmailVolunteer = (volunteer: ContactSubmission) => {
    const mailto = `mailto:${encodeURIComponent(volunteer.email)}?subject=${encodeURIComponent(
      "RE: HireAll Volunteer Application"
    )}`;
    window.open(mailto, "_blank");
  };

  if (adminLoading) {
    return <LoadingPage label="Loading volunteers..." />;
  }

  if (!isAdmin) {
    return <AdminAccessDenied />;
  }

  return (
    <AdminLayout title="Volunteer Applications">
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Volunteer Applications</h1>
              <p className="text-muted-foreground">
                Manage volunteer program applications
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => refetchContacts()}
            disabled={contactsLoading}
            className="w-full sm:w-auto"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4"
        >
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Applications</CardTitle>
              <div className="p-2 rounded-full bg-blue-100">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{volunteerStats.total}</div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">New</CardTitle>
              <div className="p-2 rounded-full bg-yellow-100">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{volunteerStats.newApps}</div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Contacted</CardTitle>
              <div className="p-2 rounded-full bg-green-100">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{volunteerStats.contacted}</div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Archived</CardTitle>
              <div className="p-2 rounded-full bg-gray-100">
                <XCircle className="h-4 w-4 text-gray-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{volunteerStats.archived}</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => copyEmailsToClipboard(filteredVolunteers)}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy All Emails
              </Button>
              <Button
                variant="outline"
                onClick={() => copyEmailsToClipboard(filteredVolunteers.filter(v => v.status === "new"))}
              >
                <Mail className="h-4 w-4 mr-2" />
                Copy New Applicant Emails
              </Button>
              <Button variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export to CSV
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters & Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="border rounded-lg border-gray-200 bg-white shadow-sm"
        >
          <CardHeader>
            <CardTitle className="text-foreground">Applications</CardTitle>
            <CardDescription className="text-gray-500">
              {filteredVolunteers.length} applications match your filters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, or skills"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 border-gray-200"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px] border-gray-200">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="read">Reviewed</SelectItem>
                  <SelectItem value="responded">Contacted</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border border-gray-200 overflow-x-auto">
              <Table className="min-w-[860px]">
                <TableHeader className="bg-gray-50">
                  <TableRow className="border-gray-200">
                    <TableHead className="text-gray-600 font-medium">Name & Email</TableHead>
                    <TableHead className="text-gray-600 font-medium">Skills</TableHead>
                    <TableHead className="text-gray-600 font-medium">Availability</TableHead>
                    <TableHead className="text-gray-600 font-medium">Status</TableHead>
                    <TableHead className="text-gray-600 font-medium">Applied</TableHead>
                    <TableHead className="text-right text-gray-600 font-medium">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVolunteers.map((volunteer) => {
                    const data = parseVolunteerData(volunteer.message);
                    return (
                      <TableRow
                        key={volunteer._id}
                        className={`${volunteer.status === "new" ? "bg-blue-50/50" : ""} hover:bg-gray-50 transition-colors border-gray-200`}
                      >
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">{volunteer.name}</span>
                            <span className="text-sm text-gray-500 truncate">
                              {volunteer.email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-700 max-w-[200px] truncate">
                            {data.skills || "—"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-700">
                            {data.availability || "—"}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(volunteer.status)}</TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-500">
                            {formatDistanceToNow(volunteer.createdAt, { addSuffix: true })}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 text-gray-500 hover:text-foreground">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="border-gray-200">
                              <DropdownMenuLabel className="text-foreground">Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedVolunteer(volunteer);
                                  setShowDetails(true);
                                }}
                                className="text-gray-700"
                              >
                                <Eye className="h-4 w-4 mr-2" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleEmailVolunteer(volunteer)}
                                className="text-gray-700"
                              >
                                <Mail className="h-4 w-4 mr-2" /> Send Email
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-gray-200" />
                              {volunteer.status === "new" && (
                                <DropdownMenuItem
                                  onClick={() => handleUpdateStatus(volunteer, "read")}
                                  className="text-gray-700"
                                >
                                  <Eye className="h-4 w-4 mr-2" /> Mark Reviewed
                                </DropdownMenuItem>
                              )}
                              {volunteer.status !== "responded" && (
                                <DropdownMenuItem
                                  onClick={() => handleUpdateStatus(volunteer, "responded")}
                                  className="text-gray-700"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" /> Mark Contacted
                                </DropdownMenuItem>
                              )}
                              {volunteer.status !== "archived" && (
                                <DropdownMenuItem
                                  onClick={() => handleUpdateStatus(volunteer, "archived")}
                                  className="text-gray-700"
                                >
                                  <XCircle className="h-4 w-4 mr-2" /> Archive
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator className="bg-gray-200" />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDelete(volunteer)}
                                disabled={deleteLoading}
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {filteredVolunteers.length === 0 && !contactsLoading && (
                <div className="py-12 text-center text-gray-500">
                  {searchTerm || statusFilter !== "all"
                    ? "No volunteer applications match your filters."
                    : "No volunteer applications yet."}
                </div>
              )}

              {contactsLoading && (
                <div className="py-6 flex items-center justify-center">
                  <LoadingSpinner label="Loading applications..." />
                </div>
              )}
            </div>
          </CardContent>
        </motion.div>

        {/* Details Dialog */}
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-2xl" hideTitle={false}>
            <DialogHeader>
              <DialogTitle>Volunteer Application</DialogTitle>
              <DialogDescription>
                Application details for {selectedVolunteer?.name}
              </DialogDescription>
            </DialogHeader>

            {selectedVolunteer && (() => {
              const data = parseVolunteerData(selectedVolunteer.message);
              return (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold">{selectedVolunteer.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedVolunteer.email}</p>
                    </div>
                    {getStatusBadge(selectedVolunteer.status)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Skills</p>
                      <p className="mt-1 text-sm">{data.skills || "Not specified"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Availability</p>
                      <p className="mt-1 text-sm">{data.availability || "Not specified"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Portfolio/GitHub</p>
                      <p className="mt-1 text-sm">
                        {data.portfolio ? (
                          <a href={data.portfolio} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            {data.portfolio}
                          </a>
                        ) : (
                          "Not provided"
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Applied</p>
                      <p className="mt-1 text-sm">
                        {format(new Date(selectedVolunteer.createdAt), "PPpp")}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Experience</p>
                    <p className="mt-1 text-sm whitespace-pre-wrap">
                      {data.experience?.trim() || "No prior experience mentioned"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Motivation</p>
                    <p className="mt-1 text-sm whitespace-pre-wrap">
                      {data.motivation?.trim() || "Not provided"}
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4 border-t">
                    <Button onClick={() => handleEmailVolunteer(selectedVolunteer)}>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Email
                    </Button>
                    {selectedVolunteer.status !== "responded" && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          handleUpdateStatus(selectedVolunteer, "responded");
                          setShowDetails(false);
                        }}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark as Contacted
                      </Button>
                    )}
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
