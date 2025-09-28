"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Mail, Search, Filter, Loader2, Eye, CheckCircle2, Archive, Trash2 } from "lucide-react";

import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { useApiMutation, useApiQuery } from "@/hooks/useApi";
import { adminApi } from "@/utils/api/admin";
import { contactApi } from "@/utils/api/contact";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminAccessDenied } from "@/components/admin/AdminAccessDenied";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { showError, showSuccess } from "@/components/ui/Toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type ContactStatus = "all" | "new" | "read" | "responded" | "archived";

const STATUS_OPTIONS: { value: ContactStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "read", label: "Read" },
  { value: "responded", label: "Responded" },
  { value: "archived", label: "Archived" },
];

const STATUS_BADGE: Record<string, { variant: "default" | "secondary" | "outline"; label: string }> = {
  new: { variant: "default", label: "New" },
  read: { variant: "secondary", label: "Read" },
  responded: { variant: "outline", label: "Responded" },
  archived: { variant: "secondary", label: "Archived" },
};

const PAGE_SIZE = 20;

export default function AdminContactPage() {
  const { user } = useFirebaseAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [statusFilter, setStatusFilter] = useState<ContactStatus>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [token, setToken] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<ContactStatus>("new");
  const [editResponse, setEditResponse] = useState("");

  // Resolve admin record
  const { data: adminRecord } = useApiQuery(
    () =>
      user && user.uid
        ? adminApi.getUserByFirebaseUid(user.uid)
        : Promise.reject(new Error("No user")),
    [user?.uid]
  );

  useEffect(() => {
    if (!adminRecord) {
      return;
    }
    setIsAdmin(adminRecord.isAdmin === true);
  }, [adminRecord]);

  // Acquire ID token for authenticated calls
  useEffect(() => {
    let active = true;
    if (!user) {
      setToken(null);
      return;
    }

    user
      .getIdToken()
      .then((idToken) => {
        if (active) {
          setToken(idToken);
        }
      })
      .catch(() => {
        if (active) {
          setToken(null);
        }
      });

    return () => {
      active = false;
    };
  }, [user]);

  const {
    data: contactsData,
    loading: contactsLoading,
    error: contactsError,
    refetch: refetchContacts,
  } = useApiQuery(
    () => {
      if (!token) {
        return Promise.reject(new Error("Missing authentication token"));
      }
      const offset = page * PAGE_SIZE;
      const statusParam = statusFilter === "all" ? undefined : statusFilter;
      return contactApi.getAllContacts(token, {
        status: statusParam,
        limit: PAGE_SIZE,
        offset,
      });
    },
    [token, statusFilter, page, refreshKey],
    { enabled: !!token }
  );

  const updateContactMutation = useApiMutation(
    async ({
      contactId,
      status,
      response,
    }: {
      contactId: string;
      status?: ContactStatus;
      response?: string;
    }) => {
      if (!token) {
        throw new Error("Missing authentication token");
      }
      return contactApi.updateContact(token, contactId, {
        status,
        response,
      });
    }
  );

  const deleteContactMutation = useApiMutation(async (contactId: string) => {
    if (!token) {
      throw new Error("Missing authentication token");
    }
    return contactApi.deleteContact(token, contactId);
  });

  const total = contactsData?.pagination.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const selectedContact = useMemo(() => {
    if (!selectedContactId || !contactsData?.contacts) {
      return null;
    }
    return contactsData.contacts.find((contact) => contact._id === selectedContactId) ?? null;
  }, [contactsData?.contacts, selectedContactId]);

  useEffect(() => {
    if (!selectedContact) {
      return;
    }
    setEditStatus((selectedContact.status as ContactStatus) || "new");
    setEditResponse(selectedContact.response ?? "");
  }, [selectedContact]);

  const filteredContacts = useMemo(() => {
    if (!contactsData?.contacts) {
      return [];
    }
    if (!searchTerm.trim()) {
      return contactsData.contacts;
    }
    const term = searchTerm.trim().toLowerCase();
    return contactsData.contacts.filter((contact) => {
      return (
        contact.name.toLowerCase().includes(term) ||
        contact.email.toLowerCase().includes(term) ||
        contact.message.toLowerCase().includes(term)
      );
    });
  }, [contactsData?.contacts, searchTerm]);

  const openContactDialog = (contactId: string) => {
    setSelectedContactId(contactId);
  };

  const closeContactDialog = () => {
    setSelectedContactId(null);
    setEditResponse("");
  };

  const handleQuickStatusUpdate = async (
    contactId: string,
    status: ContactStatus
  ) => {
    try {
      await updateContactMutation.mutate({ contactId, status });
      showSuccess("Contact updated");
      refetchContacts();
    } catch (error: any) {
      showError("Failed to update contact", error?.message);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm("Delete this contact submission? This action cannot be undone.")) {
      return;
    }
    try {
      await deleteContactMutation.mutate(contactId);
      showSuccess("Contact deleted");
      setRefreshKey((key) => key + 1);
    } catch (error: any) {
      showError("Failed to delete contact", error?.message);
    }
  };

  const handleDialogSave = async () => {
    if (!selectedContact) {
      return;
    }
    try {
      await updateContactMutation.mutate({
        contactId: selectedContact._id,
        status: editStatus,
        response: editResponse.trim() ? editResponse.trim() : undefined,
      });
      showSuccess("Contact updated");
      setRefreshKey((key) => key + 1);
      closeContactDialog();
    } catch (error: any) {
      showError("Failed to update contact", error?.message);
    }
  };

  if (!user) {
    return (
      <AdminLayout title="Contact Inbox">
        <div>Please sign in to access the admin panel.</div>
      </AdminLayout>
    );
  }

  if (isAdmin === null) {
    return (
      <AdminLayout title="Contact Inbox">
        <div>Checking admin permissions...</div>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return <AdminAccessDenied />;
  }

  return (
    <AdminLayout title="Contact Inbox">
      <div className="space-y-6">
        <Card className="card-depth-2">
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-3xl">Contact Inbox</CardTitle>
                <CardDescription>
                  Manage inbound messages from the public contact form
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setRefreshKey((key) => key + 1);
                  refetchContacts();
                }}
                disabled={contactsLoading}
              >
                {contactsLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search messages by name, email, or content"
                    value={searchTerm}
                    onChange={(event) => {
                      setSearchTerm(event.target.value);
                    }}
                    className="pl-9"
                  />
                </div>
              </div>
              <div>
                <Select
                  value={statusFilter}
                  onValueChange={(value: ContactStatus) => {
                    setStatusFilter(value);
                    setPage(0);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {contactsError && (
          <Card className="border-destructive/30">
            <CardContent className="py-6 text-destructive">
              Failed to load contacts. Please refresh the page.
            </CardContent>
          </Card>
        )}

        <Card className="card-depth-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Messages ({total})
            </CardTitle>
            <CardDescription>
              {contactsLoading
                ? "Loading messages..."
                : filteredContacts.length === 0
                ? "No messages found for the current view"
                : "Newest messages appear first"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sender</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Received</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contactsLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        <Loader2 className="h-4 w-4 mr-2 inline animate-spin" />
                        Loading messages...
                      </TableCell>
                    </TableRow>
                  ) : filteredContacts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        No contact messages to display.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredContacts.map((contact) => {
                      const badgeMeta = STATUS_BADGE[contact.status] ?? {
                        variant: "secondary" as const,
                        label: contact.status,
                      };
                      return (
                        <TableRow key={contact._id}>
                          <TableCell>
                            <div className="font-medium">{contact.name}</div>
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {contact.message}
                            </div>
                          </TableCell>
                          <TableCell>{contact.email}</TableCell>
                          <TableCell>
                            <Badge variant={badgeMeta.variant}>{badgeMeta.label}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDistanceToNow(contact.createdAt, { addSuffix: true })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => openContactDialog(contact._id)}
                                title="View details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleQuickStatusUpdate(contact._id, "responded")}
                                disabled={updateContactMutation.loading}
                                title="Mark responded"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleQuickStatusUpdate(contact._id, "archived")}
                                disabled={updateContactMutation.loading}
                                title="Archive"
                              >
                                <Archive className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => handleDeleteContact(contact._id)}
                                disabled={deleteContactMutation.loading}
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div>
                Showing {Math.min(total, page * PAGE_SIZE + 1)}-
                {Math.min(total, page * PAGE_SIZE + filteredContacts.length)} of {total}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((value) => Math.max(0, value - 1))}
                  disabled={page === 0 || contactsLoading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((value) => Math.min(totalPages - 1, value + 1))}
                  disabled={page >= totalPages - 1 || contactsLoading}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedContact} onOpenChange={(open) => (!open ? closeContactDialog() : null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Contact Details</DialogTitle>
            <DialogDescription>
              Review and respond to the selected contact submission
            </DialogDescription>
          </DialogHeader>

          {selectedContact && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-xs uppercase text-muted-foreground">Name</Label>
                  <div className="text-sm font-medium">{selectedContact.name}</div>
                </div>
                <div>
                  <Label className="text-xs uppercase text-muted-foreground">Email</Label>
                  <div className="text-sm font-medium">{selectedContact.email}</div>
                </div>
                <div>
                  <Label className="text-xs uppercase text-muted-foreground">Received</Label>
                  <div className="text-sm">
                    {new Date(selectedContact.createdAt).toLocaleString()}
                  </div>
                </div>
                <div>
                  <Label className="text-xs uppercase text-muted-foreground">Last Updated</Label>
                  <div className="text-sm">
                    {new Date(selectedContact.updatedAt).toLocaleString()}
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-xs uppercase text-muted-foreground">Message</Label>
                <div className="mt-2 rounded-md border bg-muted/50 p-3 text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedContact.message}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="contact-status">Status</Label>
                  <Select
                    value={editStatus}
                    onValueChange={(value: ContactStatus) => setEditStatus(value)}
                  >
                    <SelectTrigger id="contact-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.filter((option) => option.value !== "all").map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="contact-response">Response (optional)</Label>
                <Textarea
                  id="contact-response"
                  minRows={4}
                  value={editResponse}
                  onChange={(event) => setEditResponse(event.target.value)}
                  placeholder="Track your response or notes for this contact"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex items-center gap-2">
            <Button variant="outline" onClick={closeContactDialog}>
              Cancel
            </Button>
            <Button onClick={handleDialogSave} disabled={updateContactMutation.loading}>
              {updateContactMutation.loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}


