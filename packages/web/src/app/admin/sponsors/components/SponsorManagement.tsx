"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { showError, showSuccess, showInfo, showWarning } from "@/components/ui/Toast";
import { useApiQuery, useApiMutation } from "@/hooks/useApi";
import { adminApi } from "@/utils/api/admin";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { SponsorStats } from "./SponsorStats";
import { SponsorFilters } from "./SponsorFilters";
import { SponsorTable } from "./SponsorTable";
import { SponsorCharts } from "./SponsorCharts";
import { CreateSponsorDialog, type CreateSponsorData } from "./CreateSponsorDialog";
import { exportToCsv } from "@/utils/exportToCsv";

interface Sponsor {
  _id: string;
  name: string;
  sponsorshipType: string;
  industry?: string;
  website?: string;
  description?: string;
  logo?: string;
  status: string;
  isActive?: boolean;
  aliases?: string[];
  createdAt: number;
  updatedAt?: number;
}

export function SponsorManagement() {
  const { user } = useFirebaseAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [industryFilter, setIndustryFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedSponsors, setSelectedSponsors] = useState<string[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>('create');
  const [isExporting, setIsExporting] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Initialize after mount (server-side layout already verified admin access)
  useEffect(() => {
    if (user) {
      setIsReady(true);
    }
  }, [user]);

  // Fetch sponsors and stats
  const fetchSponsors = useCallback(async () => {
    console.log('[SponsorManagement] Fetching sponsors with filters:', {
      search: searchTerm || undefined,
      industry: industryFilter !== "all" ? industryFilter : undefined,
      sponsorshipType: typeFilter !== "all" ? typeFilter : undefined,
      status: statusFilter,
      page,
      limit: pageSize,
    });
    const response = await adminApi.getAllSponsoredCompanies({
      search: searchTerm || undefined,
      industry: industryFilter !== "all" ? industryFilter : undefined,
      sponsorshipType: typeFilter !== "all" ? typeFilter : undefined,
      status: statusFilter,
      page,
      limit: pageSize,
    });
    console.log('[SponsorManagement] Sponsors response:', response);
    return response;
  }, [searchTerm, industryFilter, typeFilter, statusFilter, page, pageSize]);

  const fetchStats = useCallback(async () => {
    const response = await adminApi.getSponsorshipStats();
    return response.stats || response;
  }, []);

  const { data: sponsorsData, refetch: refetchSponsors, loading: isSponsorsLoading } = useApiQuery(
    fetchSponsors,
    [isReady, searchTerm, industryFilter, typeFilter, statusFilter, page, pageSize],
    { enabled: isReady, staleTime: 0 }, // Disable caching to ensure fresh data on filter changes
    `admin-sponsored-companies-${searchTerm}-${industryFilter}-${typeFilter}-${statusFilter}-${page}-${pageSize}`
  );

  const sponsoredCompanies = sponsorsData?.companies || sponsorsData?.results || [];
  const totalSponsors = sponsorsData?.total || 0;

  // Debug logging - can be removed after issue is resolved
  useEffect(() => {
    if (sponsorsData !== undefined) {
      console.log('[SponsorManagement] ===== DATA UPDATE =====');
      console.log('[SponsorManagement] Raw sponsorsData:', JSON.stringify(sponsorsData, null, 2)?.slice(0, 500));
      console.log('[SponsorManagement] sponsorsData.companies:', sponsorsData?.companies?.length);
      console.log('[SponsorManagement] sponsorsData.results:', sponsorsData?.results?.length);
      console.log('[SponsorManagement] Extracted sponsoredCompanies:', sponsoredCompanies?.length);
      console.log('[SponsorManagement] Total sponsors:', totalSponsors);
      console.log('[SponsorManagement] ========================');
    }
  }, [sponsorsData, sponsoredCompanies, totalSponsors]);

  const { data: sponsorStats } = useApiQuery(
    fetchStats,
    [user?.uid, isReady],
    { enabled: isReady },
    "admin-sponsor-stats"
  );

  // Mutations
  const createSponsorMutation = useApiMutation(async (data: CreateSponsorData) => {
    return adminApi.sponsors.createSponsor(data);
  });

  const updateSponsorMutation = useApiMutation(
    async ({ sponsorId, data }: { sponsorId: string; data: Partial<CreateSponsorData> }) => {
      return adminApi.updateSponsoredCompany(sponsorId, data, user?.uid || "");
    }
  );

  const deleteSponsorMutation = useApiMutation(async (sponsorId: string) => {
    return adminApi.deleteSponsoredCompany(sponsorId, user?.uid || "");
  });

  // Get unique industries and types for filters
  const industries = [...new Set((sponsoredCompanies?.map((s: Sponsor) => s.industry).filter(Boolean) || []) as string[])];
  const types = [...new Set((sponsoredCompanies?.map((s: Sponsor) => s.sponsorshipType).filter(Boolean) || []) as string[])];

  // Reset selection when filters change
  useEffect(() => {
    setSelectedSponsors([]);
  }, [searchTerm, industryFilter, typeFilter, statusFilter]);

  // Handlers
  const handleCreateSponsor = async (data: CreateSponsorData) => {
    try {
      if (dialogMode === 'edit' && editingSponsor) {
        await updateSponsorMutation.mutate({
          sponsorId: editingSponsor._id,
          data
        });
        showSuccess("Sponsor updated successfully");
      } else if (dialogMode === 'create') {
        await createSponsorMutation.mutate(data);
        showSuccess("Sponsor created successfully");
      }
      setIsCreateDialogOpen(false);
      setEditingSponsor(null);
      setDialogMode('create');
      refetchSponsors();
    } catch (error) {
      showError(dialogMode === 'edit' ? "Failed to update sponsor" : "Failed to create sponsor");
    }
  };

  const handleEditSponsor = (sponsor: Sponsor) => {
    setEditingSponsor(sponsor);
    setDialogMode('edit');
    setIsCreateDialogOpen(true);
  };

  const handleDeleteSponsor = async (sponsorId: string) => {
    if (confirm("Are you sure you want to delete this sponsor?")) {
      try {
        await deleteSponsorMutation.mutate(sponsorId);
        showSuccess("Sponsor deleted successfully");
        refetchSponsors();
      } catch (error) {
        showError("Failed to delete sponsor");
      }
    }
  };

  const handleViewSponsor = (sponsor: Sponsor) => {
    setEditingSponsor(sponsor);
    setDialogMode('view');
    setIsCreateDialogOpen(true);
  };

  const handleExportSponsors = async () => {
    try {
      setIsExporting(true);
      showInfo("Exporting sponsors...");

      const allSponsorsResponse = await adminApi.getAllSponsoredCompaniesForExport({
        search: searchTerm || undefined,
        industry: industryFilter !== "all" ? industryFilter : undefined,
        sponsorshipType: typeFilter !== "all" ? typeFilter : undefined,
        status: statusFilter,
      });

      const allSponsors = allSponsorsResponse.companies || allSponsorsResponse || [];

      if (!allSponsors.length) {
        showWarning("No sponsors match the current filters.");
        return;
      }

      const rows = allSponsors.map((sponsor: Sponsor) => ({
        ID: sponsor._id,
        Name: sponsor.name,
        Type: sponsor.sponsorshipType,
        Industry: sponsor.industry || "",
        Website: sponsor.website || "",
        Status: sponsor.isActive !== false ? "Active" : "Inactive",
        Aliases: (sponsor.aliases || []).join(", "),
        "Created At": sponsor.createdAt && !isNaN(new Date(sponsor.createdAt).getTime())
          ? new Date(sponsor.createdAt).toISOString()
          : "",
      }));

      exportToCsv(`sponsors-${new Date().toISOString().split("T")[0]}.csv`, rows);
      showSuccess(`Exported ${allSponsors.length} sponsors to CSV`);
    } catch (error) {
      showError("Failed to export sponsors");
    } finally {
      setIsExporting(false);
    }
  };

  const handleRefresh = () => {
    refetchSponsors();
  };

  if (!isReady) {
    return (
      <AdminLayout title="Sponsors">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <AdminLayout title="Sponsors">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-8"
      >
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sponsor Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage sponsored companies and track sponsorship analytics
            </p>
          </div>
        </motion.div>

      {/* Stats Cards */}
      <motion.div variants={itemVariants}>
        <SponsorStats stats={sponsorStats} />
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants}>
        <Card className="p-4 border-gray-200 bg-white">
          <SponsorFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            industryFilter={industryFilter}
            onIndustryFilterChange={setIndustryFilter}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            onCreateSponsor={() => setIsCreateDialogOpen(true)}
            onRefresh={handleRefresh}
            onExport={handleExportSponsors}
            isExporting={isExporting}
            industries={industries}
            types={types}
          />
        </Card>
      </motion.div>

      {/* Sponsors Table */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden border-gray-200 bg-white">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle className="text-gray-900">Sponsored Companies</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {sponsoredCompanies && sponsoredCompanies.length > 0 ? (
              <SponsorTable
                sponsors={sponsoredCompanies}
                selectedSponsors={selectedSponsors}
                onSelectionChange={setSelectedSponsors}
                onEditSponsor={handleEditSponsor}
                onDeleteSponsor={handleDeleteSponsor}
                onViewSponsor={handleViewSponsor}
                isLoading={isSponsorsLoading}
                currentPage={page}
                totalPages={Math.ceil(totalSponsors / pageSize)}
                onPageChange={setPage}
                pageSize={pageSize}
                onPageSizeChange={setPageSize}
                totalItems={totalSponsors}
              />
            ) : (
              <div className="text-center py-12 text-gray-500">
                {searchTerm || industryFilter !== "all" || typeFilter !== "all" || statusFilter !== "all"
                  ? "No sponsors match your filters"
                  : "No sponsored companies yet. Add your first sponsor!"}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts */}
      {sponsorStats && (
        <motion.div variants={itemVariants}>
          <SponsorCharts stats={sponsorStats} />
        </motion.div>
      )}

      {/* Create/Edit/View Sponsor Dialog */}
      <CreateSponsorDialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            setEditingSponsor(null);
            setDialogMode('create');
          }
        }}
        onSubmit={handleCreateSponsor}
        isSubmitting={createSponsorMutation.loading || updateSponsorMutation.loading}
        initialData={editingSponsor ? {
          name: editingSponsor.name,
          aliases: editingSponsor.aliases || [],
          sponsorshipType: editingSponsor.sponsorshipType,
          description: editingSponsor.description,
          website: editingSponsor.website,
          industry: editingSponsor.industry,
          logo: editingSponsor.logo,
          isActive: editingSponsor.isActive !== false
        } : undefined}
        mode={dialogMode}
      />
    </motion.div>
    </AdminLayout>
  );
}
