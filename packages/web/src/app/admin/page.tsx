"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useRateLimit } from "../../hooks/useRateLimit";
import { useApiQuery, useApiMutation } from "../../hooks/useApi";
import { adminApi } from "../../utils/api/admin";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { AdminAccessDenied } from "../../components/admin/AdminAccessDenied";
import { AdminStats } from "../../components/admin/AdminStats";
import { AddCompanyForm } from "../../components/admin/AddCompanyForm";
import { CompanyList } from "../../components/admin/CompanyList";
import { RateLimitInfo } from "../../components/admin/RateLimitInfo";
import { UserManagement } from "../../components/admin/UserManagement";
import { SponsorshipRules } from "../../components/admin/SponsorshipRules";

export default function AdminPage() {
  const { user } = useUser();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<"companies" | "users" | "rules">("companies");
  const [showAddForm, setShowAddForm] = useState(false);

  // Check if user is admin
  const { data: userRecord, refetch: refetchUserRecord } = useApiQuery(
    () => user ? adminApi.getUserByClerkId(user.id) : Promise.reject(new Error("No user")),
    [user?.id]
  );

  // Check admin status
  useEffect(() => {
    if (userRecord) {
      setIsAdmin(userRecord.isAdmin === true);
    }
  }, [userRecord]);

  // Rate limiting for admin operations
  const addCompanyRateLimit = useRateLimit({
    maxRequests: 5,
    windowMs: 60000, // 1 minute
    endpoint: 'addSponsoredCompany'
  });

  const { data: sponsoredCompanies, refetch: refetchCompanies } = useApiQuery(
    () => adminApi.getAllSponsoredCompanies(),
    []
  );

  const { data: sponsorshipStats } = useApiQuery(
    () => adminApi.getSponsorshipStats(),
    []
  );

  const { data: allUsers, refetch: refetchUsers } = useApiQuery(
    () => adminApi.getAllUsers(),
    []
  );

  const { mutate: addSponsoredCompany } = useApiMutation(
    (variables: Record<string, unknown>) => {
      const { name, aliases, sponsorshipType, description, website, industry, createdBy } = variables;
      return adminApi.addSponsoredCompany({
        name: name as string,
        aliases: aliases as string[],
        sponsorshipType: sponsorshipType as string,
        description: description as string | undefined,
        website: website as string | undefined,
        industry: industry as string | undefined,
        createdBy: createdBy as string
      });
    }
  );

  const handleAddCompany = async (data: {
    name: string;
    aliases: string[];
    sponsorshipType: string;
    description?: string;
    website?: string;
    industry?: string;
    isActive: boolean;
  }) => {
    if (!userRecord) return;

    // Check rate limit before making request
    if (!addCompanyRateLimit.checkRateLimit()) {
      return; // Rate limit error already shown by hook
    }

    try {
      await addSponsoredCompany({
        ...data,
        createdBy: userRecord._id,
      });
      
      toast.success("Sponsored company added successfully!");
      setShowAddForm(false);
      refetchCompanies();
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
        toast.error(`Rate limit exceeded. ${error.message}`);
      } else {
        toast.error("Failed to add sponsored company");
      }
      console.error('Error adding company:', error);
    }
  };

  const handleUsersUpdate = () => {
    refetchUsers();
    refetchUserRecord();
  };

  if (!user) {
    return (
      <AdminLayout title="Admin Panel">
        <div>Please sign in to access the admin panel.</div>
      </AdminLayout>
    );
  }

  // Show loading state while checking admin status
  if (isAdmin === null) {
    return (
      <AdminLayout title="Admin Panel">
        <div>Checking admin permissions...</div>
      </AdminLayout>
    );
  }

  // Show access denied if user is not admin
  if (!isAdmin) {
    return <AdminAccessDenied />;
  }

  return (
    <AdminLayout title="Admin Panel">
      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("companies")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "companies"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Sponsored Companies
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "users"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              User Management
            </button>
            <button
              onClick={() => setActiveTab("rules")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "rules"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Sponsorship Rules
            </button>
          </nav>
        </div>
      </div>

      {/* Stats Cards - Show on all tabs */}
      {sponsorshipStats && <AdminStats stats={sponsorshipStats} />}

      {/* Companies Tab */}
      {activeTab === "companies" && (
        <div>
          {/* Add New Company Button */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                {showAddForm ? "Cancel" : "Add Sponsored Company"}
              </button>
              
              {/* Rate limit status */}
              <RateLimitInfo rateLimit={addCompanyRateLimit} />
            </div>
          </div>

          {/* Add Company Form */}
          {showAddForm && (
            <AddCompanyForm
              onSubmit={handleAddCompany}
              onCancel={() => setShowAddForm(false)}
            />
          )}

          {/* Sponsored Companies List */}
          {sponsoredCompanies && <CompanyList companies={sponsoredCompanies} />}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <div>
          {allUsers && userRecord && (
            <UserManagement 
              users={allUsers} 
              currentUser={userRecord} 
              onUsersUpdate={handleUsersUpdate} 
            />
          )}
        </div>
      )}

      {/* Rules Tab */}
      {activeTab === "rules" && (
        <div>
          <SponsorshipRules />
        </div>
      )}
    </AdminLayout>
  );
}