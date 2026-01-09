"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Inbox,
  Send,
  Archive,
  Loader2,
  Filter,
  Search,
  MoreHorizontal,
  Eye,
  Download,
  Copy,
  RefreshCw,
  Reply,
  Trash2,
  MessageSquare,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useEnhancedApi } from "@/hooks/useEnhancedApi";
import { adminApi } from "@/utils/api/admin";
import { exportToCsv } from "@/utils/exportToCsv";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

import type { ContactSubmission } from "@/types/api";

const STATUS_LABELS: Record<ContactSubmission["status"], string> = {
  new: "New",
  read: "Read",
  responded: "Responded",
  archived: "Archived",
};

const STATUS_COLORS: Record<ContactSubmission["status"], string> = {
  new: "bg-primary/10 text-primary",
  read: "bg-accent text-accent-foreground",
  responded: "bg-secondary/10 text-secondary",
  archived: "bg-muted text-muted-foreground",
};

export default function AdminContactDashboard() {
  const { toast } = useToast();
  const { isAdmin, isLoading: adminLoading, userRecord } = useAdminAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedContact, setSelectedContact] = useState<ContactSubmission | null>(null);
  const [showContactDetails, setShowContactDetails] = useState(false);

  const copyToClipboard = useCallback(
    async (value: string, label: string) => {
      try {
        if (!value) return;
        await navigator.clipboard.writeText(value);
        toast({
          title: "Copied",
          description: `${label} copied to clipboard`,
        });
      } catch (error) {
        console.error("Failed to copy to clipboard", error);
        toast({
          title: "Copy failed",
          description: "Your browser blocked clipboard access.",
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  // Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => { },
  });

  const canFetchAdminData = isAdmin === true;

  const {
    data: contacts,
    loading: contactsLoading,
    error: contactsError,
    refetch: refetchContacts,
  } = useEnhancedApi<ContactSubmission[]>(
    () => adminApi.getAllContactSubmissions(),
    { immediate: canFetchAdminData }
  );

  useEffect(() => {
    if (!contactsError) return;
    toast({
      title: "Error",
      description: contactsError.message || "Failed to load contacts",
      variant: "destructive",
    });
  }, [contactsError, toast]);

  const { execute: updateContact, loading: updateLoading } = useEnhancedApi(
    async ({
      contactId,
      updates,
    }: {
      contactId: string;
      updates: Partial<
        Pick<ContactSubmission, "status" | "response" | "respondedAt" | "respondedBy">
      >;
    }) => adminApi.updateContactSubmission(contactId, updates),
    { immediate: false }
  );

  const { execute: deleteContact, loading: deleteLoading } = useEnhancedApi(
    async ({ contactId }: { contactId: string }) => adminApi.deleteContactSubmission(contactId),
    { immediate: false }
  );

  const filteredContacts = useMemo(() => {
    const list = contacts ?? [];
    return list.filter((contact) => {
      const matchesStatus = statusFilter === "all" || contact.status === statusFilter;
      if (!matchesStatus) return false;

      const normalizedSearch = searchTerm.trim().toLowerCase();
      if (!normalizedSearch) return true;

      return (
        contact.name.toLowerCase().includes(normalizedSearch) ||
        contact.email.toLowerCase().includes(normalizedSearch) ||
        (contact.subject ?? "").toLowerCase().includes(normalizedSearch) ||
        contact.message.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [contacts, searchTerm, statusFilter]);

  const contactStats = useMemo(() => {
    const list = contacts ?? [];
    const total = list.length;
    const open = list.filter((c) => c.status === "new" || c.status === "read").length;
    const responded = list.filter((c) => c.status === "responded").length;
    const archived = list.filter((c) => c.status === "archived").length;
    const unread = list.filter((c) => c.status === "new").length;
    const responseTimes = list
      .filter((c) => c.respondedAt)
      .map((c) => (c.respondedAt ?? 0) - c.createdAt)
      .filter((diff) => diff > 0);

    const averageResponseHours = responseTimes.length
      ? Math.round(
        responseTimes.reduce((acc, diff) => acc + diff, 0) /
        responseTimes.length /
        (1000 * 60 * 60)
      )
      : null;

    const responseRate = total ? Math.round((responded / total) * 100) : 0;

    return {
      total,
      open,
      responded,
      archived,
      unread,
      responseRate,
      averageResponseHours,
    };
  }, [contacts]);

  const recentContacts = useMemo(() => {
    const list = contacts ?? [];
    return [...list]
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
      .slice(0, 5);
  }, [contacts]);

  const getStatusBadge = (status: ContactSubmission["status"]) => (
    <Badge className={`capitalize ${STATUS_COLORS[status]}`}>{STATUS_LABELS[status]}</Badge>
  );

  const copyEmailsToClipboard = async (
    targetContacts: ContactSubmission[],
    emptyMessage: string,
    successMessage: (count: number) => string
  ) => {
    if (!targetContacts.length) {
      toast({
        title: "No contacts",
        description: emptyMessage,
        variant: "destructive",
      });
      return;
    }

    const emails = targetContacts
      .map((contact) => contact.email)
      .filter(Boolean)
      .join(", ");

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(emails);
      } else if (typeof document !== "undefined") {
        const textarea = document.createElement("textarea");
        textarea.value = emails;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      } else {
        throw new Error("Clipboard APIs are unavailable");
      }

      toast({
        title: "Copied",
        description: successMessage(targetContacts.length),
      });
    } catch (error) {
      console.error("Failed to copy emails", error);
      toast({
        title: "Error",
        description: "Unable to copy emails. Try again from a secure context.",
        variant: "destructive",
      });
    }
  };

  const handleExportContacts = () => {
    if (!filteredContacts.length) {
      toast({
        title: "No data",
        description: "No contacts match the current filters.",
        variant: "destructive",
      });
      return;
    }

    const rows = filteredContacts.map((contact) => ({
      ID: contact._id,
      Name: contact.name,
      Email: contact.email,
      Subject: contact.subject ?? "",
      Status: STATUS_LABELS[contact.status],
      "Created At": new Date(contact.createdAt).toISOString(),
      "Updated At": new Date(contact.updatedAt).toISOString(),
      "Responded At": contact.respondedAt
        ? new Date(contact.respondedAt).toISOString()
        : "",
      "Responded By": contact.respondedBy ?? "",
      Message: contact.message.replace(/\n/g, " "),
      Response: (contact.response ?? "").replace(/\n/g, " "),
    }));

    exportToCsv(
      `hireall-contact-submissions-${new Date().toISOString().slice(0, 10)}`,
      rows
    );
    toast({
      title: "Export Successful",
      description: `Exported ${filteredContacts.length} contact records`,
    });
  };

  const handleCopyAllEmails = () =>
    copyEmailsToClipboard(
      filteredContacts,
      "No contact emails available to copy.",
      (count) => `Copied ${count} email${count === 1 ? "" : "s"} to clipboard`
    );

  const handleCopyFollowUps = () =>
    copyEmailsToClipboard(
      filteredContacts.filter(
        (contact) => contact.status === "new" || contact.status === "read"
      ),
      "No pending follow-ups in the current view.",
      (count) => `Copied ${count} follow-up email${count === 1 ? "" : "s"}`
    );

  const handleRefresh = async () => {
    await Promise.resolve(refetchContacts());
    toast({
      title: "Refreshed",
      description: "Contact dashboard refreshed",
    });
  };

  const handleUpdateStatus = async (
    contact: ContactSubmission,
    status: ContactSubmission["status"]
  ) => {
    try {
      await updateContact({
        contactId: contact._id,
        updates: {
          status,
          respondedBy:
            status === "responded" ? userRecord?.email ?? "" : contact.respondedBy,
        },
      });
      toast({
        title: "Status Updated",
        description: `${contact.name} marked as ${STATUS_LABELS[status]}`,
      });
      refetchContacts();
    } catch (error) {
      console.error("Failed to update contact status", error);
      toast({
        title: "Error",
        description: "Unable to update contact status",
        variant: "destructive",
      });
    }
  };


  const handleDeleteContact = async (contact: ContactSubmission) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Contact",
      description: `Delete contact message from ${contact.name}? This cannot be undone.`,
      onConfirm: async () => {
        try {
          await deleteContact({ contactId: contact._id });
          toast({
            title: "Deleted",
            description: "Contact submission deleted",
          });
          refetchContacts();
        } catch (error) {
          console.error("Failed to delete contact", error);
          toast({
            title: "Error",
            description: "Unable to delete contact submission",
            variant: "destructive",
          });
        }
      },
    });
  };

  const handleOpenDetails = (contact: ContactSubmission) => {
    setSelectedContact(contact);
    setShowContactDetails(true);
  };


  if (adminLoading) {
    return <LoadingPage label="Loading contact dashboard..." />;
  }

  if (!isAdmin) {
    return <AdminAccessDenied />;
  }

  return (
    <AdminLayout title="Contact Dashboard">
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Contact Dashboard</h1>
              <p className="text-muted-foreground">
                Triage inbound messages and coordinate responses quickly
              </p>
            </div>
          </div>

          <Button variant="outline" onClick={handleRefresh} disabled={contactsLoading} className="w-full sm:w-auto">
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
          <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total messages</CardTitle>
              <div className="p-2 rounded-full bg-blue-100">
                <Inbox className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{contactStats.total}</div>
              <p className="text-xs text-gray-500 mt-1">Across all time</p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Awaiting response</CardTitle>
              <div className="p-2 rounded-full bg-orange-100">
                <Mail className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{contactStats.open}</div>
              <p className="text-xs text-gray-500 mt-1">
                {contactStats.unread} new • {contactStats.open - contactStats.unread} read
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Response rate</CardTitle>
              <div className="p-2 rounded-full bg-green-100">
                <Send className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{contactStats.responseRate}%</div>
              <p className="text-xs text-gray-500 mt-1">
                {contactStats.responded} responded • {contactStats.archived} archived
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Avg. response time</CardTitle>
              <div className="p-2 rounded-full bg-purple-100">
                <MessageSquare className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {contactStats.averageResponseHours !== null
                  ? `${contactStats.averageResponseHours}h`
                  : "—"}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Across responded conversations
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick actions & recent activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 xl:grid-cols-3 gap-6"
        >
          <Card className="border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-foreground">
                <Filter className="h-5 w-5 text-primary" />
                Quick actions
              </CardTitle>
              <CardDescription className="text-gray-500">Operate on the currently filtered list</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start border-gray-200 text-gray-700 hover:bg-gray-50"
                onClick={handleCopyAllEmails}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy all emails
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-gray-200 text-gray-700 hover:bg-gray-50"
                onClick={handleCopyFollowUps}
              >
                <Reply className="h-4 w-4 mr-2" />
                Copy follow-up emails
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-gray-200 text-gray-700 hover:bg-gray-50"
                onClick={handleExportContacts}
              >
                <Download className="h-4 w-4 mr-2" />
                Export filtered contacts
              </Button>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm xl:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">Recent inbound messages</CardTitle>
              <CardDescription className="text-gray-500">Latest conversations awaiting action</CardDescription>
            </CardHeader>
            <CardContent>
              {recentContacts.length === 0 ? (
                <p className="text-sm text-gray-500">No contact submissions yet.</p>
              ) : (
                <div className="space-y-4">
                  {recentContacts.map((contact) => (
                    <div
                      key={contact._id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 last:border-b-0 pb-3 last:pb-0"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate text-foreground">
                            {contact.subject || "(No subject)"}
                          </span>
                          {getStatusBadge(contact.status)}
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {contact.name} • {contact.email}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          Received {formatDistanceToNow(contact.createdAt, { addSuffix: true })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="self-start text-gray-500 hover:text-foreground"
                        onClick={() => handleOpenDetails(contact)}
                      >
                        <Eye className="h-4 w-4 mr-2" /> View
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="border rounded-lg border-gray-200 bg-white shadow-sm"
        >
          <CardHeader>
            <CardTitle className="text-foreground">Contact submissions</CardTitle>
            <CardDescription className="text-gray-500">
              {filteredContacts.length} conversations match your filters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, subject, or message"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="pl-9 border-gray-200 focus:ring-blue-500"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px] border-gray-200">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                  <SelectItem value="responded">Responded</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border border-gray-200 overflow-x-auto">
              <Table className="min-w-[860px]">
                <TableHeader className="bg-gray-50">
                  <TableRow className="border-gray-200">
                    <TableHead className="text-gray-600 font-medium">Name & email</TableHead>
                    <TableHead className="text-gray-600 font-medium">Subject</TableHead>
                    <TableHead className="text-gray-600 font-medium">Status</TableHead>
                    <TableHead className="text-gray-600 font-medium">Received</TableHead>
                    <TableHead className="hidden lg:table-cell text-gray-600 font-medium">Last update</TableHead>
                    <TableHead className="text-right text-gray-600 font-medium">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.map((contact) => (
                    <TableRow
                      key={contact._id}
                      className={`${contact.status === "new" ? "bg-blue-50/50" : ""} hover:bg-gray-50 transition-colors border-gray-200`}
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{contact.name}</span>
                          <span className="text-sm text-gray-500 truncate">
                            {contact.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="min-w-0 max-w-[280px] truncate text-gray-700">
                          {contact.subject || "(No subject)"}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(contact.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-500">
                          {formatDistanceToNow(contact.createdAt, { addSuffix: true })}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="text-sm text-gray-500">
                          {format(new Date(contact.updatedAt), "PPp")}
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
                            <DropdownMenuItem onClick={() => handleOpenDetails(contact)} className="text-gray-700 focus:bg-gray-100">
                              <Eye className="h-4 w-4 mr-2" /> View details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-gray-200" />
                            {contact.status === "new" && (
                              <DropdownMenuItem
                                onClick={() => handleUpdateStatus(contact, "read")}
                                className="text-gray-700 focus:bg-gray-100"
                              >
                                <Mail className="h-4 w-4 mr-2" /> Mark as read
                              </DropdownMenuItem>
                            )}
                            {contact.status !== "responded" && (
                              <DropdownMenuItem
                                onClick={() => handleUpdateStatus(contact, "responded")}
                                className="text-gray-700 focus:bg-gray-100"
                              >
                                <Send className="h-4 w-4 mr-2" /> Mark responded
                              </DropdownMenuItem>
                            )}
                            {contact.status !== "archived" && (
                              <DropdownMenuItem
                                onClick={() => handleUpdateStatus(contact, "archived")}
                                className="text-gray-700 focus:bg-gray-100"
                              >
                                <Archive className="h-4 w-4 mr-2" /> Archive conversation
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator className="bg-gray-200" />
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-700 focus:bg-red-50"
                              onClick={() => handleDeleteContact(contact)}
                              disabled={deleteLoading}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredContacts.length === 0 && !contactsLoading && (
                <div className="py-12 text-center text-gray-500">
                  {searchTerm || statusFilter !== "all"
                    ? "No contact submissions match your filters."
                    : "No contact submissions yet."}
                </div>
              )}

              {contactsLoading && (
                <div className="py-6 flex items-center justify-center">
                  <LoadingSpinner label="Loading submissions..." />
                </div>
              )}
            </div>
          </CardContent>
        </motion.div>

        {/* Contact details dialog */}
        <Dialog open={showContactDetails} onOpenChange={setShowContactDetails}>
          <DialogContent className="max-w-4xl h-[85vh] p-0 flex flex-col">
            <DialogHeader className="px-6 py-4 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <DialogTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Contact conversation
                  </DialogTitle>
                  <DialogDescription className="truncate">
                    {selectedContact ? `Manage the response lifecycle for ${selectedContact.name}` : ""}
                  </DialogDescription>
                </div>
                {selectedContact ? getStatusBadge(selectedContact.status) : null}
              </div>

              {selectedContact ? (
                <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-base font-semibold truncate">{selectedContact.name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="truncate">{selectedContact.email}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => copyToClipboard(selectedContact.email, "Email")}
                        aria-label="Copy email"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                </div>
              ) : null}
            </DialogHeader>

            {selectedContact ? (
              <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden px-6 py-5 space-y-6">
                {/* Conversation */}
                <div className="space-y-3">
                  {/* Incoming */}
                  <div className="flex items-end gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/10">
                      <Mail className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 max-w-[calc(100%-3rem)] sm:max-w-[80%] md:max-w-[42rem] rounded-2xl rounded-bl-md border bg-muted/30 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium truncate">{selectedContact.subject || "(No subject)"}</p>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(selectedContact.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="mt-2 text-sm whitespace-pre-wrap break-words leading-relaxed">{selectedContact.message}</p>
                    </div>
                  </div>
                </div>

                {/* Metadata */}
                <div className="rounded-xl border bg-background p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Received</p>
                      <p className="mt-1 text-sm">{format(new Date(selectedContact.createdAt), "PPpp")}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Last updated</p>
                      <p className="mt-1 text-sm">{format(new Date(selectedContact.updatedAt), "PPpp")}</p>
                    </div>
                    {selectedContact.respondedAt ? (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Responded</p>
                        <p className="mt-1 text-sm">
                          {format(new Date(selectedContact.respondedAt), "PPpp")} by {selectedContact.respondedBy || "Unknown"}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                Select a conversation to view details.
              </div>
            )}

            <DialogFooter className="px-6 py-4 border-t bg-background">
              <div className="w-full flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2">
                <Button variant="outline" onClick={() => setShowContactDetails(false)} className="w-full sm:w-auto">
                  Close
                </Button>

                {selectedContact ? (
                  <Button
                    variant="outline"
                    onClick={() => handleUpdateStatus(selectedContact, "archived")}
                    disabled={updateLoading}
                    className="w-full sm:w-auto"
                  >
                    <Archive className="h-4 w-4 mr-2" /> Archive
                  </Button>
                ) : null}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          onOpenChange={(isOpen) => setConfirmDialog(prev => ({ ...prev, isOpen }))}
          title={confirmDialog.title}
          description={confirmDialog.description}
          onConfirm={confirmDialog.onConfirm}
          variant="destructive"
        />
      </div>
    </AdminLayout>
  );
}
