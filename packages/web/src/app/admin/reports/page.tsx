"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Bug,
  Loader2,
  Search,
  MoreHorizontal,
  Eye,
  Download,
  RefreshCw,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  Sparkles,
  Lightbulb,
  FileText,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";

import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { useApiQuery, useApiMutation } from "@/hooks/useApi";
import { adminApi } from "@/utils/api/admin";
import { exportToCsv } from "@/utils/exportToCsv";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminAccessDenied } from "@/components/admin/AdminAccessDenied";
import { Button } from "@/components/ui/button";
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

import type { ContactSubmission } from "@/types/api";

type IssueType = "bug" | "feature" | "improvement" | "other" | "all";

const ISSUE_TYPE_INFO: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  bug: { label: "Bug Report", icon: <Bug className="h-4 w-4" />, color: "bg-red-100 text-red-700" },
  feature: { label: "Feature Request", icon: <Sparkles className="h-4 w-4" />, color: "bg-purple-100 text-purple-700" },
  improvement: { label: "Improvement", icon: <Lightbulb className="h-4 w-4" />, color: "bg-amber-100 text-amber-700" },
  other: { label: "Other", icon: <FileText className="h-4 w-4" />, color: "bg-gray-100 text-gray-700" },
};

const STATUS_LABELS: Record<ContactSubmission["status"], string> = {
  new: "New",
  read: "In Review",
  responded: "Resolved",
  archived: "Closed",
};

const STATUS_COLORS: Record<ContactSubmission["status"], string> = {
  new: "bg-blue-100 text-blue-700",
  read: "bg-amber-100 text-amber-700",
  responded: "bg-green-100 text-green-700",
  archived: "bg-gray-100 text-gray-700",
};

function extractIssueType(subject?: string): string {
  if (!subject) return "other";
  const lower = subject.toLowerCase();
  if (lower.includes("[bug")) return "bug";
  if (lower.includes("[feature")) return "feature";
  if (lower.includes("[improvement")) return "improvement";
  return "other";
}

function isIssueReport(contact: ContactSubmission): boolean {
  const subject = contact.subject?.toLowerCase() || "";
  return (
    subject.includes("[bug") ||
    subject.includes("[feature") ||
    subject.includes("[improvement") ||
    contact.message?.includes("Submitted via Report Issue Feature")
  );
}

export default function AdminReportsPage() {
  const { user } = useFirebaseAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<IssueType>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedReport, setSelectedReport] = useState<ContactSubmission | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const loadUserRecord = useCallback(() => {
    if (user && user.uid) {
      return adminApi.getUserByFirebaseUid(user.uid);
    }
    return Promise.reject(new Error("No user"));
  }, [user?.uid]);

  const { data: userRecord } = useApiQuery(loadUserRecord, [user?.uid], {
    enabled: !!user?.uid,
  });

  const canFetchAdminData = userRecord?.isAdmin === true;

  const loadContacts = useCallback(
    () => adminApi.getAllContactSubmissions(),
    []
  );

  const {
    data: contacts,
    loading: contactsLoading,
    error: contactsError,
    refetch: refetchContacts,
  } = useApiQuery(loadContacts, [userRecord?._id, userRecord?.isAdmin], {
    enabled: canFetchAdminData,
  });

  useEffect(() => {
    if (userRecord) {
      setIsAdmin(userRecord.isAdmin === true);
    }
  }, [userRecord]);

  const { mutate: updateContact, loading: updateLoading } = useApiMutation(
    ({
      contactId,
      updates,
    }: {
      contactId: string;
      updates: Partial<Pick<ContactSubmission, "status" | "response" | "respondedAt" | "respondedBy">>;
    }) => adminApi.updateContactSubmission(contactId, updates)
  );

  const { mutate: deleteContact, loading: deleteLoading } = useApiMutation(
    ({ contactId }: { contactId: string }) => adminApi.deleteContactSubmission(contactId)
  );

  // Filter to only show issue reports
  const issueReports = useMemo(() => {
    const all = contacts ?? [];
    return all.filter(isIssueReport);
  }, [contacts]);

  const filteredReports = useMemo(() => {
    return issueReports.filter((report) => {
      // Type filter
      if (typeFilter !== "all") {
        const issueType = extractIssueType(report.subject);
        if (issueType !== typeFilter) return false;
      }

      // Status filter
      if (statusFilter !== "all" && report.status !== statusFilter) return false;

      // Search
      const normalizedSearch = searchTerm.trim().toLowerCase();
      if (!normalizedSearch) return true;

      return (
        report.name.toLowerCase().includes(normalizedSearch) ||
        report.email.toLowerCase().includes(normalizedSearch) ||
        (report.subject ?? "").toLowerCase().includes(normalizedSearch) ||
        report.message.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [issueReports, searchTerm, typeFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = issueReports.length;
    const open = issueReports.filter((r) => r.status === "new" || r.status === "read").length;
    const resolved = issueReports.filter((r) => r.status === "responded").length;
    const bugs = issueReports.filter((r) => extractIssueType(r.subject) === "bug").length;
    const features = issueReports.filter((r) => extractIssueType(r.subject) === "feature").length;

    return { total, open, resolved, bugs, features };
  }, [issueReports]);

  const handleRefresh = async () => {
    await Promise.resolve(refetchContacts());
    toast.success("Reports refreshed");
  };

  const handleUpdateStatus = async (
    report: ContactSubmission,
    status: ContactSubmission["status"]
  ) => {
    try {
      await updateContact({
        contactId: report._id,
        updates: {
          status,
          respondedBy: status === "responded" ? userRecord?.email ?? "" : report.respondedBy,
          respondedAt: status === "responded" ? Date.now() : report.respondedAt,
        },
      });
      toast.success(`Marked as ${STATUS_LABELS[status]}`);
      refetchContacts();
    } catch (error) {
      console.error("Failed to update status", error);
      toast.error("Unable to update status");
    }
  };

  const handleDelete = async (report: ContactSubmission) => {
    if (!confirm(`Delete this report from ${report.name}? This cannot be undone.`)) {
      return;
    }

    try {
      await deleteContact({ contactId: report._id });
      toast.success("Report deleted");
      refetchContacts();
    } catch (error) {
      console.error("Failed to delete report", error);
      toast.error("Unable to delete report");
    }
  };

  const handleExport = () => {
    if (!filteredReports.length) {
      toast.error("No reports to export");
      return;
    }

    const rows = filteredReports.map((r) => ({
      ID: r._id,
      Type: extractIssueType(r.subject),
      Status: STATUS_LABELS[r.status],
      Name: r.name,
      Email: r.email,
      Subject: r.subject ?? "",
      Created: new Date(r.createdAt).toISOString(),
      Message: r.message.replace(/\n/g, " "),
    }));

    exportToCsv(`hireall-issue-reports-${new Date().toISOString().slice(0, 10)}`, rows);
    toast.success(`Exported ${filteredReports.length} reports`);
  };

  if (!user) {
    return (
      <AdminLayout title="Issue Reports">
        <div>Please sign in to access the admin panel.</div>
      </AdminLayout>
    );
  }

  if (isAdmin === null) {
    return (
      <AdminLayout title="Issue Reports">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Checking admin permissions...
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return <AdminAccessDenied />;
  }

  return (
    <AdminLayout title="Issue Reports">
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center">
              <Bug className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Issue Reports</h1>
              <p className="text-muted-foreground">
                Track bugs, feature requests, and user feedback
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" onClick={handleRefresh} disabled={contactsLoading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </motion.div>

        {contactsError && (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-destructive">Failed to load reports</CardTitle>
              <CardDescription className="text-destructive">
                {contactsError.message || "An unexpected error occurred."}
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Reports</CardTitle>
              <FileText className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Open</CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{stats.open}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Resolved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Bugs</CardTitle>
              <Bug className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.bugs}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Features</CardTitle>
              <Sparkles className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.features}</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters & Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>All Issue Reports</CardTitle>
              <CardDescription>
                {filteredReports.length} reports match your filters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search reports..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <Select value={typeFilter} onValueChange={(v: IssueType) => setTypeFilter(v)}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="bug">🐛 Bug Reports</SelectItem>
                    <SelectItem value="feature">✨ Features</SelectItem>
                    <SelectItem value="improvement">💡 Improvements</SelectItem>
                    <SelectItem value="other">📝 Other</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="read">In Review</SelectItem>
                    <SelectItem value="responded">Resolved</SelectItem>
                    <SelectItem value="archived">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Reporter</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReports.map((report) => {
                      const issueType = extractIssueType(report.subject);
                      const typeInfo = ISSUE_TYPE_INFO[issueType] || ISSUE_TYPE_INFO.other;

                      return (
                        <TableRow
                          key={report._id}
                          className={report.status === "new" ? "bg-blue-50/50" : ""}
                        >
                          <TableCell>
                            <Badge className={typeInfo.color}>
                              {typeInfo.icon}
                              <span className="ml-1">{typeInfo.label}</span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{report.name}</span>
                              <span className="text-sm text-gray-500">{report.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[280px] truncate">
                              {report.subject?.replace(/\[.*?\]\s*/g, "") || "(No subject)"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={STATUS_COLORS[report.status]}>
                              {STATUS_LABELS[report.status]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-500">
                              {formatDistanceToNow(report.createdAt, { addSuffix: true })}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedReport(report);
                                    setShowDetails(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-2" /> View Details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {report.status === "new" && (
                                  <DropdownMenuItem
                                    onClick={() => handleUpdateStatus(report, "read")}
                                  >
                                    <Clock className="h-4 w-4 mr-2" /> Mark In Review
                                  </DropdownMenuItem>
                                )}
                                {report.status !== "responded" && (
                                  <DropdownMenuItem
                                    onClick={() => handleUpdateStatus(report, "responded")}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" /> Mark Resolved
                                  </DropdownMenuItem>
                                )}
                                {report.status !== "archived" && (
                                  <DropdownMenuItem
                                    onClick={() => handleUpdateStatus(report, "archived")}
                                  >
                                    <AlertCircle className="h-4 w-4 mr-2" /> Close
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleDelete(report)}
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

                {filteredReports.length === 0 && !contactsLoading && (
                  <div className="py-12 text-center text-gray-500">
                    {searchTerm || typeFilter !== "all" || statusFilter !== "all"
                      ? "No reports match your filters."
                      : "No issue reports yet."}
                  </div>
                )}

                {contactsLoading && (
                  <div className="py-6 flex items-center justify-center gap-2 text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading reports...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Details Dialog */}
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Issue Report Details</DialogTitle>
              <DialogDescription>
                Submitted by {selectedReport?.name}
              </DialogDescription>
            </DialogHeader>

            {selectedReport && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge className={ISSUE_TYPE_INFO[extractIssueType(selectedReport.subject)]?.color}>
                    {ISSUE_TYPE_INFO[extractIssueType(selectedReport.subject)]?.label}
                  </Badge>
                  <Badge className={STATUS_COLORS[selectedReport.status]}>
                    {STATUS_LABELS[selectedReport.status]}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Reporter</p>
                    <p className="font-medium">{selectedReport.name}</p>
                    <p className="text-muted-foreground">{selectedReport.email}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Submitted</p>
                    <p className="font-medium">
                      {format(new Date(selectedReport.createdAt), "PPpp")}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Subject</p>
                  <p className="font-medium">{selectedReport.subject || "(No subject)"}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                  <div className="bg-muted/50 p-4 rounded-lg whitespace-pre-wrap text-sm">
                    {selectedReport.message}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  {selectedReport.status !== "responded" && (
                    <Button
                      onClick={() => {
                        handleUpdateStatus(selectedReport, "responded");
                        setShowDetails(false);
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark Resolved
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
