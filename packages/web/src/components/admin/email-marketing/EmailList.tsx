"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Download,
  Upload,
  UserPlus,
  Filter,
  Search,
  Mail,
  CheckCircle,
  XCircle,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { showSuccess, showError } from "@/components/ui/Toast";

interface EmailListProps {
  emailList: any[];
  emailListStats: Record<string, number>;
  loading: boolean;
  onEmailListChange: (emailList: any[]) => void;
  onStatsChange: (stats: Record<string, number>) => void;
}

export function EmailList({ 
  emailList, 
  emailListStats, 
  loading, 
  onEmailListChange, 
  onStatsChange 
}: EmailListProps) {
  const { user } = useFirebaseAuth();
  const [selectedSegment, setSelectedSegment] = useState<string>("all");
  const [activeEmailsOnly, setActiveEmailsOnly] = useState(true);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importEmails, setImportEmails] = useState("");
  const [importingEmails, setImportingEmails] = useState(false);

  const fetchEmailList = async () => {
    try {
      const token = await user?.getIdToken();
      const params = new URLSearchParams({
        segment: selectedSegment,
        activeOnly: activeEmailsOnly.toString()
      });
      const res = await fetch(`/api/admin/email-list?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        onEmailListChange(data.emailList || []);
        onStatsChange(data.segments || {});
      }
    } catch (error) {
      console.error("Failed to fetch email list:", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchEmailList();
    }
  }, [selectedSegment, activeEmailsOnly, user]);

  const handleImportEmails = async () => {
    if (!importEmails.trim()) {
      showError("Import failed", "Please enter email addresses to import.");
      return;
    }

    try {
      setImportingEmails(true);
      const token = await user?.getIdToken();
      
      // Parse emails from text
      const emailLines = importEmails.split('\n').filter(line => line.trim());
      const emails = emailLines.map(line => {
        const parts = line.split(',').map(p => p.trim());
        return {
          email: parts[0],
          firstName: parts[1] || '',
          lastName: parts[2] || ''
        };
      });

      const res = await fetch("/api/admin/email-list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          emails,
          subscribeAll: true
        }),
      });

      if (res.ok) {
        const data = await res.json();
        showSuccess("Import successful", `Processed ${data.processed} emails. ${data.errors} errors.`);
        setShowImportDialog(false);
        setImportEmails("");
        fetchEmailList();
      } else {
        throw new Error("Failed to import emails");
      }
    } catch (error: any) {
      showError("Import failed", error.message || "Unable to import emails.");
    } finally {
      setImportingEmails(false);
    }
  };

  const exportEmailList = async (format: 'csv' | 'json') => {
    try {
      const token = await user?.getIdToken();
      const params = new URLSearchParams({
        segment: selectedSegment,
        format,
        activeOnly: activeEmailsOnly.toString()
      });
      
      const res = await fetch(`/api/admin/email-list/export?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `email-list-${selectedSegment}-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error("Failed to export email list");
      }
    } catch (error: any) {
      showError("Export failed", error.message || "Unable to export email list.");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4">Please sign in to access email marketing.</p>
          <a className="underline" href="/sign-in">Sign in</a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Subscribers</p>
                <p className="text-2xl font-bold">{emailList.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Emails</p>
                <p className="text-2xl font-bold">
                  {emailList.filter(user => user.marketingEmails).length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unsubscribed</p>
                <p className="text-2xl font-bold">
                  {emailList.filter(user => !user.marketingEmails).length}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Segments</p>
                <p className="text-2xl font-bold">{Object.keys(emailListStats).length}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Filter className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <Select value={selectedSegment} onValueChange={setSelectedSegment}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Segment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Segments</SelectItem>
              <SelectItem value="active_users">Active Users</SelectItem>
              <SelectItem value="new_users">New Users</SelectItem>
              <SelectItem value="premium">Premium Users</SelectItem>
              <SelectItem value="basic">Basic Users</SelectItem>
              <SelectItem value="admin">Admin Users</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center space-x-2">
            <Switch
              id="active-only"
              checked={activeEmailsOnly}
              onCheckedChange={setActiveEmailsOnly}
            />
            <Label htmlFor="active-only">Active emails only</Label>
          </div>
        </div>

        <div className="flex gap-3">
          <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="lg">
                <Upload className="h-5 w-5 mr-2" />
                Import Emails
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Import Email Addresses</DialogTitle>
                <DialogDescription>
                  Add email addresses to your marketing list. Format: email,firstname,lastname (one per line)
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="import-emails">Email Addresses</Label>
                  <Textarea
                    id="import-emails"
                    value={importEmails}
                    onChange={(e) => setImportEmails(e.target.value)}
                    placeholder="john@example.com,John,Doe&#10;jane@example.com,Jane,Smith"
                    rows={10}
                    className="font-mono text-sm"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Enter one email per line. Optional: add name separated by commas.
                  </p>
                </div>
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowImportDialog(false);
                      setImportEmails("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleImportEmails} disabled={importingEmails}>
                    {importingEmails ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Import Emails
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            size="lg"
            onClick={() => exportEmailList('csv')}
          >
            <Download className="h-5 w-5 mr-2" />
            Export CSV
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => exportEmailList('json')}
          >
            <Download className="h-5 w-5 mr-2" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Email List Table */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle>Email Subscribers</CardTitle>
          <CardDescription>
            {emailList.length} subscribers found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Email</th>
                  <th className="text-left py-3 px-4 font-medium">Name</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Segment</th>
                  <th className="text-left py-3 px-4 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {emailList.slice(0, 50).map((user) => (
                  <tr key={user.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{user.email}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {user.firstName || user.lastName ? 
                        `${user.firstName} ${user.lastName}` : 
                        <span className="text-muted-foreground">—</span>
                      }
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={user.marketingEmails ? "default" : "secondary"}>
                        {user.marketingEmails ? "Subscribed" : "Unsubscribed"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="text-xs">
                        {user.segment}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {user.createdAt ? 
                          new Date(user.createdAt).toLocaleDateString() : 
                          "—"
                        }
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {emailList.length > 50 && (
              <div className="text-center py-4 text-muted-foreground">
                Showing first 50 of {emailList.length} subscribers
              </div>
            )}
          </div>

          {emailList.length === 0 && !loading && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No subscribers found</h3>
              <p className="text-muted-foreground mb-4">Import email addresses to build your subscriber list.</p>
              <Button onClick={() => setShowImportDialog(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Import Emails
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
