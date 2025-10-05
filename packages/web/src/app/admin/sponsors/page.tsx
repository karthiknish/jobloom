"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Search,
  MoreHorizontal,
  Plus,
  Edit,
  Trash2,
  Eye,
  BarChart3,
  TrendingUp,
  Activity,
  Download,
  RefreshCw,
  CheckCircle2,
  Ban,
} from "lucide-react";

import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { useApiQuery, useApiMutation } from "@/hooks/useApi";
import { adminApi } from "@/utils/api/admin";
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
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { showError, showSuccess, showWarning, showInfo } from "@/components/ui/Toast";
import { exportToCsv } from "@/utils/exportToCsv";
import { SkeletonTable } from "@/components/ui/loading-skeleton";

interface SponsoredCompany {
  _id: string;
  name: string;
  aliases: string[];
  sponsorshipType: string;
  description?: string;
  website?: string;
  industry?: string;
  isActive?: boolean;
  createdBy: string;
  createdAt: number;
  updatedAt?: number;
}

// Edit Sponsor Form Component
interface EditSponsorFormProps {
  sponsor: SponsoredCompany;
  onSave: (updates: Partial<SponsoredCompany>) => Promise<void> | void;
  onCancel: () => void;
}

function EditSponsorForm({ sponsor, onSave, onCancel }: EditSponsorFormProps) {
  const [formData, setFormData] = useState<SponsoredCompany>({
    ...sponsor,
    aliases: Array.isArray(sponsor.aliases) ? [...sponsor.aliases] : [],
    isActive: sponsor.isActive !== false,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const normalizedAliases = Array.isArray(formData.aliases)
        ? formData.aliases.filter((alias) => alias.trim().length > 0)
        : [];

      await onSave({
        name: formData.name,
        website: formData.website,
        industry: formData.industry,
        sponsorshipType: formData.sponsorshipType,
        description: formData.description,
        aliases: normalizedAliases,
        isActive: formData.isActive !== false,
      });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    setFormData({
      ...sponsor,
      aliases: Array.isArray(sponsor.aliases) ? [...sponsor.aliases] : [],
      isActive: sponsor.isActive !== false,
    });
  }, [sponsor]);

  const handleChange = (field: keyof SponsoredCompany, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAliasesChange = (value: string) => {
    const aliases = value.split(',').map(alias => alias.trim()).filter(alias => alias.length > 0);
    handleChange('aliases', aliases);
  };

  return (
    <div className="space-y-4 py-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Company Name</Label>
          <Input
            id="name"
            value={formData.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Enter company name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            value={formData.website || ''}
            onChange={(e) => handleChange('website', e.target.value)}
            placeholder="https://example.com"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="aliases">Aliases (comma-separated)</Label>
        <Input
          id="aliases"
          value={formData.aliases?.join(', ') || ''}
          onChange={(e) => handleAliasesChange(e.target.value)}
          placeholder="e.g., Google LLC, Alphabet Inc."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="industry">Industry</Label>
          <Input
            id="industry"
            value={formData.industry || ''}
            onChange={(e) => handleChange('industry', e.target.value)}
            placeholder="e.g., Technology, Finance"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sponsorshipType">Sponsorship Type</Label>
          <Select
            value={formData.sponsorshipType || "sponsored"}
            onValueChange={(value) => handleChange('sponsorshipType', value)}
          >
            <SelectTrigger id="sponsorshipType">
              <SelectValue placeholder="Select sponsorship type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sponsored">Sponsored</SelectItem>
              <SelectItem value="promoted">Promoted</SelectItem>
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Brief description of the company and sponsorship"
          rows={3}
        />
      </div>

      <div className="rounded-md border p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Label htmlFor="isActive">Active status</Label>
          <p className="text-sm text-muted-foreground">
            Toggle to mark this sponsor as active or inactive.
          </p>
        </div>
        <Switch
          id="isActive"
          checked={formData.isActive !== false}
          onCheckedChange={(checked) => handleChange('isActive', checked)}
        />
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </DialogFooter>
    </div>
  );
}



export default function AdminSponsorsDashboard() {
  const { user } = useFirebaseAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [industryFilter, setIndustryFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selectedSponsor, setSelectedSponsor] =
    useState<SponsoredCompany | null>(null);
  const [showSponsorDetails, setShowSponsorDetails] = useState(false);
  const [showAddSponsor, setShowAddSponsor] = useState(false);
  const [showEditSponsor, setShowEditSponsor] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<SponsoredCompany | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Check admin status
  const loadUserRecord = useCallback(() => {
    if (user && user.uid) {
      return adminApi.getUserByFirebaseUid(user.uid);
    }
    return Promise.reject(new Error("No user"));
  }, [user?.uid]);

  const { data: userRecord } = useApiQuery(
    loadUserRecord,
    [user?.uid],
    { enabled: !!user?.uid }
  );

  const canFetchAdminData = userRecord?.isAdmin === true;

  // Fetch sponsor stats
  const loadSponsorStats = useCallback(
    () => adminApi.getSponsorshipStats(),
    []
  );

  const { data: sponsorStats, refetch: refetchStats, loading: isLoadingStats } = useApiQuery(
    loadSponsorStats,
    [userRecord?._id, userRecord?.isAdmin],
    { enabled: canFetchAdminData }
  );

  // Fetch all sponsored companies with pagination
  const loadSponsoredCompanies = useCallback(
    () => adminApi.getAllSponsoredCompanies({
      page: currentPage,
      limit: pageSize,
      search: searchTerm || undefined,
      industry: industryFilter !== "all" ? industryFilter : undefined,
      sponsorshipType: typeFilter !== "all" ? typeFilter : undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
    }),
    [currentPage, pageSize, searchTerm, industryFilter, typeFilter, statusFilter]
  );

  const { data: sponsorsData, refetch: refetchCompanies, loading: isLoadingSponsors } = useApiQuery(
    loadSponsoredCompanies,
    [userRecord?._id, userRecord?.isAdmin, currentPage, pageSize, searchTerm, industryFilter, typeFilter, statusFilter],
    { enabled: canFetchAdminData }
  );

  // Extract data from the paginated response
  const sponsoredCompanies = sponsorsData?.companies || [];
  const totalCount = sponsorsData?.total || 0;
  const hasMorePages = sponsorsData?.hasMore || false;

  useEffect(() => {
    if (userRecord) {
      setIsAdmin(userRecord.isAdmin === true);
    }
  }, [userRecord]);

  // Admin action mutations
  const deleteSponsorMutation = useApiMutation((companyId: string) =>
    adminApi.deleteSponsoredCompany(companyId, userRecord?._id || "")
  );

  const { mutate: updateSponsorStatus } = useApiMutation(
    ({ companyId, isActive }: { companyId: string; isActive: boolean }) =>
      adminApi.updateSponsoredCompany(companyId, { isActive })
  );

  const { mutate: updateSponsor } = useApiMutation(
    ({ companyId, updates }: { companyId: string; updates: Partial<SponsoredCompany> }) =>
      adminApi.updateSponsoredCompany(companyId, updates)
  );

  // Since filtering is now done server-side, filteredSponsors is just the companies
  const filteredSponsors = sponsoredCompanies;

  const handleExportSponsors = async () => {
    try {
      setIsExporting(true);
      showInfo("Exporting sponsors...");

      const allSponsors = await adminApi.getAllSponsoredCompaniesForExport({
        search: searchTerm || undefined,
        industry: industryFilter !== "all" ? industryFilter : undefined,
        sponsorshipType: typeFilter !== "all" ? typeFilter : undefined,
        status: statusFilter,
      });

      if (!allSponsors.length) {
        showWarning("No sponsors match the current filters.");
        return;
      }

      const rows = allSponsors.map((sponsor) => ({
        ID: sponsor._id,
        Name: sponsor.name,
        Type: sponsor.sponsorshipType,
        Industry: sponsor.industry || "",
        Website: sponsor.website || "",
        Status: sponsor.isActive !== false ? "Active" : "Inactive",
        Aliases: sponsor.aliases.join(", "),
        "Created At": sponsor.createdAt && !isNaN(new Date(sponsor.createdAt).getTime())
          ? new Date(sponsor.createdAt).toISOString()
          : "",
        "Updated At": sponsor.updatedAt
          ? new Date(sponsor.updatedAt).toISOString()
          : "",
      }));

      exportToCsv(
        `hireall-sponsors-${new Date().toISOString().slice(0, 10)}`,
        rows
      );

      showSuccess(`Exported ${allSponsors.length} sponsors to CSV`);
    } catch (error) {
      console.error("Failed to export sponsors", error);
      showError("Failed to export sponsors. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleRefreshData = async () => {
    try {
      await Promise.allSettled([refetchCompanies(), refetchStats()]);
      showSuccess("Sponsor dashboard refreshed");
    } catch (error) {
      console.error("Failed to refresh sponsor data", error);
      showError("Unable to refresh sponsor data");
    }
  };

  const handleToggleSponsorStatus = async (sponsor: SponsoredCompany) => {
    const nextStatus = sponsor.isActive === false;

    try {
      await updateSponsorStatus({
        companyId: sponsor._id,
        isActive: nextStatus,
      });
      showSuccess(
        `${sponsor.name} marked as ${nextStatus ? "active" : "inactive"}`
      );
      refetchCompanies();
      refetchStats();
    } catch (error) {
      console.error("Failed to toggle sponsor status", error);
      showError(`Unable to update ${sponsor.name}`);
    }
  };

  const getSponsorshipTypeBadge = (type: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      sponsored: "default",
      promoted: "secondary",
      featured: "outline",
      premium: "destructive",
    };
    return variants[type] || "default";
  };

  const getCompanyInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleDeleteSponsor = async (
    companyId: string,
    companyName: string
  ) => {
    if (
      !confirm(
        `Are you sure you want to remove ${companyName} from the sponsored companies list?`
      )
    )
      return;

    try {
      await deleteSponsorMutation.mutate(companyId);
      showSuccess(`${companyName} has been removed from sponsored companies`);
      refetchCompanies();
      refetchStats();
    } catch {
      showError("Failed to delete sponsor");
    }
  };

  const handleEditSponsor = (sponsor: SponsoredCompany) => {
    setEditingSponsor(sponsor);
    setShowEditSponsor(true);
  };

  const handleSaveEdit = async (updatedSponsor: Partial<SponsoredCompany>) => {
    if (!editingSponsor) return;

    try {
      await updateSponsor({
        companyId: editingSponsor._id,
        updates: updatedSponsor,
      });
      showSuccess(`${editingSponsor.name} has been updated`);
      setShowEditSponsor(false);
      setEditingSponsor(null);
      refetchCompanies();
      refetchStats();
    } catch (error) {
      console.error("Failed to update sponsor", error);
      showError(`Failed to update ${editingSponsor.name}`);
    }
  };

  if (!user) {
    return (
      <AdminLayout title="Sponsors Dashboard">
        <div>Please sign in to access the admin panel.</div>
      </AdminLayout>
    );
  }

  if (isAdmin === null) {
    return (
      <AdminLayout title="Sponsors Dashboard">
        <div>Checking admin permissions...</div>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return <AdminAccessDenied />;
  }

  return (
    <AdminLayout title="Sponsors Dashboard">
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Sponsors Dashboard
              </h1>
              <p className="text-muted-foreground">
                Manage sponsored companies and sponsorship analytics
              </p>
            </div>
          </div>

          <Button onClick={() => setShowAddSponsor(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Sponsor
          </Button>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {isLoadingStats ? (
            // Loading skeleton for stats cards
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="card-depth-2">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
                  <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                </CardContent>
              </Card>
            ))
          ) : sponsorStats ? (
            <>
              <Card className="card-depth-2">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Sponsors
                  </CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {sponsorStats.totalSponsoredCompanies}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Active sponsored companies
                  </p>
                </CardContent>
              </Card>

              <Card className="card-depth-2">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Top Industry
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Object.entries(sponsorStats.industryStats).length > 0
                      ? Object.entries(sponsorStats.industryStats).sort(
                          ([, a], [, b]) => b - a
                        )[0][0]
                      : "None"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Most represented industry
                  </p>
                </CardContent>
              </Card>

              <Card className="card-depth-2">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Sponsorship Types
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Object.keys(sponsorStats.sponsorshipTypeStats).length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Different sponsorship levels
                  </p>
                </CardContent>
              </Card>

              <Card className="card-depth-2">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Sponsors
                  </CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {sponsoredCompanies.filter((c) => c.isActive !== false)
                      .length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Currently active
                  </p>
                </CardContent>
              </Card>
            </>
          ) : null}
        </motion.div>

        {/* Sponsorship Type Distribution */}
        {sponsorStats?.sponsorshipTypeStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            <Card className="lg:col-span-2 card-depth-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Sponsorship Type Distribution
                </CardTitle>
                <CardDescription>Sponsors by sponsorship level</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(sponsorStats.sponsorshipTypeStats).map(
                    ([type, count]) => (
                      <div
                        key={type}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={getSponsorshipTypeBadge(type)}
                            className="capitalize"
                          >
                            {type}
                          </Badge>
                          <span className="text-sm font-medium capitalize">
                            {type} Sponsors
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium">{count}</div>
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                type === "sponsored"
                                  ? "bg-blue-500"
                                  : type === "promoted"
                                  ? "bg-purple-500"
                                  : type === "featured"
                                  ? "bg-green-500"
                                  : "bg-orange-500"
                              }`}
                              style={{
                                width: `${
                                  (count /
                                    sponsorStats.totalSponsoredCompanies) *
                                  100
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="card-depth-2">
              <CardHeader>
                <CardTitle>Industry Breakdown</CardTitle>
                <CardDescription>Top industries represented</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(sponsorStats.industryStats)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([industry, count]) => (
                      <div
                        key={industry}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm truncate">
                          {industry || "Unknown"}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{count}</span>
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{
                                width: `${
                                  (count /
                                    sponsorStats.totalSponsoredCompanies) *
                                  100
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="grid grid-cols-1 gap-6"
        >
          <Card className="card-depth-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5 text-primary" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Apply tools to the current sponsor filters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="secondary"
                className="w-full justify-start"
                onClick={handleExportSponsors}
                disabled={isExporting}
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? "Exporting..." : "Export sponsors to CSV"}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleRefreshData}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh sponsor metrics
              </Button>
              <p className="text-xs text-muted-foreground">
                Tip: combine search and filters to export or refresh just the
                subset you need.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-depth-2"
        >
          <CardHeader>
            <CardTitle>Sponsor Management</CardTitle>
            <CardDescription>
              Search and manage all sponsored companies (
              {totalCount} sponsors)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search sponsors by name, description, or aliases..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9"
                />
              </div>

              <Select
                value={industryFilter}
                onValueChange={(value) => {
                  setIndustryFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Industries</SelectItem>
                  {sponsorStats?.industryStats &&
                    Object.keys(sponsorStats.industryStats).map((industry) => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              <Select
                value={typeFilter}
                onValueChange={(value) => {
                  setTypeFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {sponsorStats?.sponsorshipTypeStats &&
                    Object.keys(sponsorStats.sponsorshipTypeStats).map(
                      (type) => (
                        <SelectItem
                          key={type}
                          value={type}
                          className="capitalize"
                        >
                          {type}
                        </SelectItem>
                      )
                    )}
                </SelectContent>
              </Select>

              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value as "all" | "active" | "inactive");
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sponsors Table */}
            <div className="rounded-md border">
              {isLoadingSponsors ? (
                <SkeletonTable rows={10} columns={6} />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Industry</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aliases</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSponsors.map((sponsor: SponsoredCompany) => (
                      <TableRow key={sponsor._id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {getCompanyInitials(sponsor.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium truncate">
                                {sponsor.name}
                              </div>
                              {sponsor.website && (
                                <div className="text-sm text-muted-foreground truncate">
                                  {sponsor.website}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                      <TableCell>
                        <Badge
                          variant={getSponsorshipTypeBadge(
                            sponsor.sponsorshipType
                          )}
                          className="capitalize"
                        >
                          {sponsor.sponsorshipType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {sponsor.industry || "Unknown"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            sponsor.isActive !== false ? "default" : "secondary"
                          }
                        >
                          {sponsor.isActive !== false ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground max-w-32 truncate">
                          {sponsor.aliases.length > 0
                            ? sponsor.aliases.join(", ")
                            : "None"}
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
                                setSelectedSponsor(sponsor);
                                setShowSponsorDetails(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleSponsorStatus(sponsor)}
                            >
                              {sponsor.isActive !== false ? (
                                <>
                                  <Ban className="h-4 w-4 mr-2" />
                                  Deactivate Sponsor
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Activate Sponsor
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEditSponsor(sponsor)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Sponsor
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                handleDeleteSponsor(sponsor._id, sponsor.name)
                              }
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove Sponsor
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              )}

              {filteredSponsors.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ||
                  industryFilter !== "all" ||
                  typeFilter !== "all" ||
                  statusFilter !== "all"
                    ? "No sponsors match your filters"
                    : "No sponsored companies found"}
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {totalCount > pageSize && (
              <div className="flex items-center justify-between px-2 py-4">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} sponsors
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {Math.ceil(totalCount / pageSize)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={!hasMorePages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </motion.div>

        {/* Sponsor Details Dialog */}
        <Dialog open={showSponsorDetails} onOpenChange={setShowSponsorDetails}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Sponsor Details</DialogTitle>
              <DialogDescription>
                Detailed information about {selectedSponsor?.name}
              </DialogDescription>
            </DialogHeader>

            {selectedSponsor && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-lg bg-primary/10 text-primary">
                      {getCompanyInitials(selectedSponsor.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">
                      {selectedSponsor.name}
                    </h3>
                    <p className="text-muted-foreground capitalize">
                      {selectedSponsor.sponsorshipType} •{" "}
                      {selectedSponsor.industry || "Unknown Industry"}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Badge
                        variant={getSponsorshipTypeBadge(
                          selectedSponsor.sponsorshipType
                        )}
                        className="capitalize"
                      >
                        {selectedSponsor.sponsorshipType}
                      </Badge>
                      <Badge
                        variant={
                          selectedSponsor.isActive !== false ? "default" : "secondary"
                        }
                      >
                        {selectedSponsor.isActive !== false ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {selectedSponsor.description && (
                  <div>
                    <Label className="text-sm font-medium">Description</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedSponsor.description}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Website</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedSponsor.website ? (
                        <a
                          href={selectedSponsor.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {selectedSponsor.website}
                        </a>
                      ) : (
                        "No website provided"
                      )}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Aliases</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedSponsor.aliases.length > 0
                        ? selectedSponsor.aliases.join(", ")
                        : "No aliases"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Created</Label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedSponsor.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Last Updated</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedSponsor.updatedAt
                        ? new Date(selectedSponsor.updatedAt).toLocaleDateString()
                        : "Never"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowSponsorDetails(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Sponsor Dialog - Placeholder */}
        <Dialog open={showAddSponsor} onOpenChange={setShowAddSponsor}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Sponsor</DialogTitle>
              <DialogDescription>
                Add a new company to the sponsored companies database.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Sponsor management form would be implemented here. This would
                include fields for company name, aliases, sponsorship type,
                description, website, and industry.
              </p>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowAddSponsor(false)}
              >
                Cancel
              </Button>
              <Button disabled>Add Sponsor (Coming Soon)</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Sponsor Dialog */}
        <Dialog open={showEditSponsor} onOpenChange={setShowEditSponsor}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Sponsor</DialogTitle>
              <DialogDescription>
                Update sponsor information and settings.
              </DialogDescription>
            </DialogHeader>

            {editingSponsor && (
              <EditSponsorForm
                sponsor={editingSponsor}
                onSave={handleSaveEdit}
                onCancel={() => {
                  setShowEditSponsor(false);
                  setEditingSponsor(null);
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
