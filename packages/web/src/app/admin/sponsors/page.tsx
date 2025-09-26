"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Search,
  Filter,
  MoreHorizontal,
  Plus,
  Edit,
  Trash2,
  Eye,
  BarChart3,
  TrendingUp,
  Globe,
  Users,
  DollarSign,
  Activity,
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import toast from "react-hot-toast";

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

interface SponsorStats {
  totalSponsoredCompanies: number;
  industryStats: Record<string, number>;
  sponsorshipTypeStats: Record<string, number>;
}

export default function AdminSponsorsDashboard() {
  const { user } = useFirebaseAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [industryFilter, setIndustryFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedSponsor, setSelectedSponsor] =
    useState<SponsoredCompany | null>(null);
  const [showSponsorDetails, setShowSponsorDetails] = useState(false);
  const [showAddSponsor, setShowAddSponsor] = useState(false);

  // Check admin status
  const { data: userRecord } = useApiQuery(
    () =>
      user && user.uid
        ? adminApi.getUserByFirebaseUid(user.uid)
        : Promise.reject(new Error("No user")),
    [user?.uid]
  );

  // Fetch sponsor stats
  const { data: sponsorStats, refetch: refetchStats } = useApiQuery(
    () => adminApi.getSponsorshipStats(),
    []
  );

  // Fetch all sponsored companies
  const { data: sponsoredCompanies, refetch: refetchCompanies } = useApiQuery(
    () => adminApi.getAllSponsoredCompanies(),
    []
  );

  useEffect(() => {
    if (userRecord) {
      setIsAdmin(userRecord.isAdmin === true);
    }
  }, [userRecord]);

  // Admin action mutations
  const deleteSponsorMutation = useApiMutation((companyId: string) =>
    adminApi.deleteSponsoredCompany(companyId, userRecord?._id || "")
  );

  // Filter sponsors based on search and filters
  const filteredSponsors =
    sponsoredCompanies?.filter((sponsor: SponsoredCompany) => {
      const matchesSearch =
        sponsor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sponsor.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sponsor.aliases.some((alias) =>
          alias.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesIndustry =
        industryFilter === "all" || sponsor.industry === industryFilter;

      const matchesType =
        typeFilter === "all" || sponsor.sponsorshipType === typeFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && sponsor.isActive !== false) ||
        (statusFilter === "inactive" && sponsor.isActive === false);

      return matchesSearch && matchesIndustry && matchesType && matchesStatus;
    }) || [];

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
      toast.success(`${companyName} has been removed from sponsored companies`);
      refetchCompanies();
      refetchStats();
    } catch (error) {
      toast.error("Failed to delete sponsor");
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
        {sponsorStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
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
                  {sponsoredCompanies?.filter((c) => c.isActive !== false)
                    .length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently active
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

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
              {filteredSponsors.length} sponsors)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search sponsors by name, description, or aliases..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={industryFilter} onValueChange={setIndustryFilter}>
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

              <Select value={typeFilter} onValueChange={setTypeFilter}>
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

              <Select value={statusFilter} onValueChange={setStatusFilter}>
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
                            <DropdownMenuItem>
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
                      {new Date(selectedSponsor.updatedAt).toLocaleDateString()}
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
      </div>
    </AdminLayout>
  );
}
