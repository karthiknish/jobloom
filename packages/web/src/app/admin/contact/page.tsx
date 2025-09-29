"use client";

import { useEffect, useMemo, useState } from "react";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

import type { ContactSubmission } from "@/types/api";

const STATUS_LABELS: Record<ContactSubmission["status"], string> = {
  new: "New",
  read: "Read",
  responded: "Responded",
  archived: "Archived",
};

const STATUS_COLORS: Record<ContactSubmission["status"], string> = {
  new: "bg-blue-100 text-blue-700",
  read: "bg-amber-100 text-amber-700",
  responded: "bg-emerald-100 text-emerald-700",
  archived: "bg-slate-200 text-slate-700",
};

export default function AdminContactDashboard() {
  const { user } = useFirebaseAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedContact, setSelectedContact] = useState<ContactSubmission | null>(null);
  const [showContactDetails, setShowContactDetails] = useState(false);
  const [responseDraft, setResponseDraft] = useState("");

  const { data: userRecord } = useApiQuery(
    () =>
      user && user.uid
        ? adminApi.getUserByFirebaseUid(user.uid)
        : Promise.reject(new Error("No user")),
    [user?.uid]
  );

  const {
    data: contacts,
    loading: contactsLoading,
    error: contactsError,
    refetch: refetchContacts,
  } = useApiQuery(() => adminApi.getAllContactSubmissions(), []);

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
      updates: Partial<
        Pick<ContactSubmission, "status" | "response" | "respondedAt" | "respondedBy">
      >;
    }) => adminApi.updateContactSubmission(contactId, updates)
  );

  const { mutate: deleteContact, loading: deleteLoading } = useApiMutation(
    ({ contactId }: { contactId: string }) => adminApi.deleteContactSubmission(contactId)
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
      toast.error(emptyMessage);
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

      toast.success(successMessage(targetContacts.length));
    } catch (error) {
      console.error("Failed to copy emails", error);
      toast.error("Unable to copy emails. Try again from a secure context.");
    }
  };

  const handleExportContacts = () => {
    if (!filteredContacts.length) {
      toast.error("No contacts match the current filters.");
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
    toast.success(`Exported ${filteredContacts.length} contact records`);
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
    toast.success("Contact dashboard refreshed");
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
      toast.success(`${contact.name} marked as ${STATUS_LABELS[status]}`);
      refetchContacts();
    } catch (error) {
      console.error("Failed to update contact status", error);
      toast.error("Unable to update contact status");
    }
  };

  const handleSaveResponse = async () => {
    if (!selectedContact) return;
    try {
      await updateContact({
        contactId: selectedContact._id,
        updates: {
          response: responseDraft,
          status: "responded",
          respondedBy: userRecord?.email ?? "",
          respondedAt: Date.now(),
        },
      });
      toast.success("Response saved and contact marked as responded");
      setShowContactDetails(false);
      refetchContacts();
    } catch (error) {
      console.error("Failed to save response", error);
      toast.error("Unable to save response");
    }
  };

  const handleDeleteContact = async (contact: ContactSubmission) => {
    if (
      !confirm(
        `Delete contact message from ${contact.name}? This cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await deleteContact({ contactId: contact._id });
      toast.success("Contact submission deleted");
      refetchContacts();
    } catch (error) {
      console.error("Failed to delete contact", error);
      toast.error("Unable to delete contact submission");
    }
  };

  const handleOpenDetails = (contact: ContactSubmission) => {
    setSelectedContact(contact);
    setResponseDraft(contact.response ?? "");
    setShowContactDetails(true);
  };

  const handleResendEmail = (contact: ContactSubmission) => {
    const subject = contact.subject ? `Re: ${contact.subject}` : "Re: HireAll inquiry";
    const message = responseDraft || contact.response || "Hi there, following up on your inquiry.";
    const mailto = `mailto:${encodeURIComponent(contact.email)}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(message)}`;

    if (typeof window !== "undefined") {
      window.open(mailto, "_blank");
      toast.success(`Opened email composer for ${contact.email}`);
    }
  };

  if (!user) {
    return (
      <AdminLayout title="Contact Dashboard">
        <div>Please sign in to access the admin panel.</div>
      </AdminLayout>
    );
  }

  if (isAdmin === null) {
    return (
      <AdminLayout title="Contact Dashboard">
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
    <AdminLayout title="Contact Dashboard">
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
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

          <Button variant="outline" onClick={handleRefresh} disabled={contactsLoading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </motion.div>

        {contactsError && (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-destructive">Failed to load contacts</CardTitle>
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
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4"
        >
          <Card className="card-depth-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total messages</CardTitle>
              <Inbox className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contactStats.total}</div>
              <p className="text-xs text-muted-foreground">Across all time</p>
            </CardContent>
          </Card>

          <Card className="card-depth-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Awaiting response</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contactStats.open}</div>
              <p className="text-xs text-muted-foreground">
                {contactStats.unread} new • {contactStats.open - contactStats.unread} read
              </p>
            </CardContent>
          </Card>

          <Card className="card-depth-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response rate</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contactStats.responseRate}%</div>
              <p className="text-xs text-muted-foreground">
                {contactStats.responded} responded • {contactStats.archived} archived
              </p>
            </CardContent>
          </Card>

          <Card className="card-depth-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. response time</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {contactStats.averageResponseHours !== null
                  ? `${contactStats.averageResponseHours}h`
                  : "—"}
              </div>
              <p className="text-xs text-muted-foreground">
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
          <Card className="card-depth-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Filter className="h-5 w-5 text-primary" />
                Quick actions
              </CardTitle>
              <CardDescription>Operate on the currently filtered list</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleCopyAllEmails}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy all emails
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleCopyFollowUps}
              >
                <Reply className="h-4 w-4 mr-2" />
                Copy follow-up emails
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleExportContacts}
              >
                <Download className="h-4 w-4 mr-2" />
                Export filtered contacts
              </Button>
            </CardContent>
          </Card>

          <Card className="card-depth-2 xl:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Recent inbound messages</CardTitle>
              <CardDescription>Latest conversations awaiting action</CardDescription>
            </CardHeader>
            <CardContent>
              {recentContacts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No contact submissions yet.</p>
              ) : (
                <div className="space-y-4">
                  {recentContacts.map((contact) => (
                    <div
                      key={contact._id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b last:border-b-0 pb-3 last:pb-0"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">
                            {contact.subject || "(No subject)"}
                          </span>
                          {getStatusBadge(contact.status)}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {contact.name} • {contact.email}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          Received {formatDistanceToNow(contact.createdAt, { addSuffix: true })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="self-start"
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
          className="card-depth-2"
        >
          <CardHeader>
            <CardTitle>Contact submissions</CardTitle>
            <CardDescription>
              {filteredContacts.length} conversations match your filters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, subject, or message"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
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

            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name & email</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Received</TableHead>
                    <TableHead className="hidden lg:table-cell">Last update</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.map((contact) => (
                    <TableRow
                      key={contact._id}
                      className={contact.status === "new" ? "bg-primary/5" : undefined}
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{contact.name}</span>
                          <span className="text-sm text-muted-foreground truncate">
                            {contact.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="min-w-0 max-w-[280px] truncate">
                          {contact.subject || "(No subject)"}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(contact.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {formatDistanceToNow(contact.createdAt, { addSuffix: true })}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(contact.updatedAt), "PPp")}
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
                            <DropdownMenuItem onClick={() => handleOpenDetails(contact)}>
                              <Eye className="h-4 w-4 mr-2" /> View details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {contact.status === "new" && (
                              <DropdownMenuItem
                                onClick={() => handleUpdateStatus(contact, "read")}
                              >
                                <Mail className="h-4 w-4 mr-2" /> Mark as read
                              </DropdownMenuItem>
                            )}
                            {contact.status !== "responded" && (
                              <DropdownMenuItem
                                onClick={() => handleUpdateStatus(contact, "responded")}
                              >
                                <Send className="h-4 w-4 mr-2" /> Mark responded
                              </DropdownMenuItem>
                            )}
                            {contact.status !== "archived" && (
                              <DropdownMenuItem
                                onClick={() => handleUpdateStatus(contact, "archived")}
                              >
                                <Archive className="h-4 w-4 mr-2" /> Archive conversation
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
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
                <div className="py-8 text-center text-muted-foreground">
                  {searchTerm || statusFilter !== "all"
                    ? "No contact submissions match your filters."
                    : "No contact submissions yet."}
                </div>
              )}

              {contactsLoading && (
                <div className="py-6 flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading submissions...
                </div>
              )}
            </div>
          </CardContent>
        </motion.div>

        {/* Contact details dialog */}
        <Dialog open={showContactDetails} onOpenChange={setShowContactDetails}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Contact conversation</DialogTitle>
              <DialogDescription>
                Manage the response lifecycle for {selectedContact?.name}
              </DialogDescription>
            </DialogHeader>

            {selectedContact && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold">{selectedContact.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedContact.email}</p>
                  </div>
                  {getStatusBadge(selectedContact.status)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Subject</p>
                    <p className="mt-1 text-sm">
                      {selectedContact.subject || "(No subject)"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Received</p>
                    <p className="mt-1 text-sm">
                      {format(new Date(selectedContact.createdAt), "PPpp")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Last updated</p>
                    <p className="mt-1 text-sm">
                      {format(new Date(selectedContact.updatedAt), "PPpp")}
                    </p>
                  </div>
                  {selectedContact.respondedAt && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Responded</p>
                      <p className="mt-1 text-sm">
                        {format(new Date(selectedContact.respondedAt), "PPpp")} by {" "}
                        {selectedContact.respondedBy || "Unknown"}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Message</p>
                  <div className="mt-2 rounded-md border bg-muted/40 p-4 text-sm whitespace-pre-wrap">
                    {selectedContact.message}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground">Response notes</p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateStatus(selectedContact, "archived")}
                        disabled={updateLoading}
                      >
                        <Archive className="h-4 w-4 mr-2" /> Archive
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResendEmail(selectedContact)}
                      >
                        <Reply className="h-4 w-4 mr-2" /> Resend email
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveResponse}
                        disabled={updateLoading}
                      >
                        <Send className="h-4 w-4 mr-2" /> Save & mark responded
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    placeholder="Log the reply you sent or internal follow-up notes..."
                    value={responseDraft}
                    onChange={(event) => setResponseDraft(event.target.value)}
                    rows={6}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowContactDetails(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

