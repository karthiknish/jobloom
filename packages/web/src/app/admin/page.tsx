"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import toast from "react-hot-toast";
import { useRateLimit } from "../../hooks/useRateLimit";

export default function AdminPage() {
  const { user } = useUser();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: "",
    aliases: [""],
    sponsorshipType: "sponsored",
    description: "",
    website: "",
    industry: ""
  });

  // Rate limiting for admin operations
  const addCompanyRateLimit = useRateLimit({
    maxRequests: 5,
    windowMs: 60000, // 1 minute
    endpoint: 'addSponsoredCompany'
  });

  const userRecord = useQuery(api.users.getUserByClerkId, 
    user ? { clerkId: user.id } : "skip"
  );

  const sponsoredCompanies = useQuery(api.sponsorship.getAllSponsoredCompanies);
  const sponsorshipStats = useQuery(api.sponsorship.getSponsorshipStats);
  const addSponsoredCompany = useMutation(api.sponsorship.addSponsoredCompany);

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userRecord) return;

    // Check rate limit before making request
    if (!addCompanyRateLimit.checkRateLimit()) {
      return; // Rate limit error already shown by hook
    }

    try {
      await addSponsoredCompany({
        ...newCompany,
        aliases: newCompany.aliases.filter(alias => alias.trim() !== ""),
        createdBy: userRecord._id,
      });
      
      toast.success("Sponsored company added successfully!");
      setNewCompany({
        name: "",
        aliases: [""],
        sponsorshipType: "sponsored",
        description: "",
        website: "",
        industry: ""
      });
      setShowAddForm(false);
    } catch (error: any) {
      if (error.message && error.message.includes('Rate limit exceeded')) {
        toast.error(`Rate limit exceeded. ${error.message}`);
      } else {
        toast.error("Failed to add sponsored company");
      }
      console.error('Error adding company:', error);
    }
  };

  const addAliasField = () => {
    setNewCompany({
      ...newCompany,
      aliases: [...newCompany.aliases, ""]
    });
  };

  const updateAlias = (index: number, value: string) => {
    const updatedAliases = [...newCompany.aliases];
    updatedAliases[index] = value;
    setNewCompany({
      ...newCompany,
      aliases: updatedAliases
    });
  };

  const removeAlias = (index: number) => {
    const updatedAliases = newCompany.aliases.filter((_, i) => i !== index);
    setNewCompany({
      ...newCompany,
      aliases: updatedAliases.length > 0 ? updatedAliases : [""]
    });
  };

  if (!user) {
    return <div>Please sign in to access the admin panel.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Sponsored Companies Admin Panel
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        {sponsorshipStats && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Sponsored Companies
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {sponsorshipStats.totalSponsoredCompanies}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">🌐</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Industries Covered
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {Object.keys(sponsorshipStats.industryStats).length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">📊</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Sponsorship Types
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {Object.keys(sponsorshipStats.sponsorshipTypeStats).length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add New Job Button */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              {showAddForm ? "Cancel" : "Add Sponsored Company"}
            </button>
            
            {/* Rate limit status */}
            <div className="text-sm text-gray-600">
              <span className="mr-4">
                Requests remaining: <span className="font-medium">{addCompanyRateLimit.remaining}</span>/5
              </span>
              {addCompanyRateLimit.isLimited && (
                <span className="text-red-600">
                  Reset in: {Math.ceil(addCompanyRateLimit.getTimeUntilReset() / 1000)}s
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Add Company Form */}
        {showAddForm && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Sponsored Company</h3>
            <form onSubmit={handleAddCompany} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company Name</label>
                  <input
                    type="text"
                    required
                    value={newCompany.name}
                    onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Google"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Industry</label>
                  <input
                    type="text"
                    value={newCompany.industry}
                    onChange={(e) => setNewCompany({ ...newCompany, industry: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Technology"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Website</label>
                  <input
                    type="url"
                    value={newCompany.website}
                    onChange={(e) => setNewCompany({ ...newCompany, website: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="https://company.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sponsorship Type</label>
                  <select
                    value={newCompany.sponsorshipType}
                    onChange={(e) => setNewCompany({ ...newCompany, sponsorshipType: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="sponsored">Sponsored</option>
                    <option value="promoted">Promoted</option>
                    <option value="featured">Featured</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={newCompany.description}
                    onChange={(e) => setNewCompany({ ...newCompany, description: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    rows={3}
                    placeholder="Why is this company marked as sponsored?"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Aliases</label>
                  <div className="space-y-2">
                    {newCompany.aliases.map((alias, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={alias}
                          onChange={(e) => updateAlias(index, e.target.value)}
                          className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="e.g., Alphabet Inc, Google LLC"
                        />
                        {newCompany.aliases.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeAlias(index)}
                            className="px-3 py-2 text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addAliasField}
                      className="text-indigo-600 hover:text-indigo-800 text-sm"
                    >
                      + Add another alias
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Add Sponsored Company
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Sponsored Companies List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Sponsored Companies Database
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Manage the database of sponsored companies. All job postings from these companies will be highlighted by the extension.
            </p>
          </div>

          {sponsoredCompanies && sponsoredCompanies.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {sponsoredCompanies.map((company) => (
                <li key={company._id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-indigo-600 truncate">
                          {company.name}
                        </p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            company.sponsorshipType === 'sponsored' ? 'bg-orange-100 text-orange-800' :
                            company.sponsorshipType === 'promoted' ? 'bg-purple-100 text-purple-800' :
                            company.sponsorshipType === 'featured' ? 'bg-green-100 text-green-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {company.sponsorshipType}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 flex">
                        <div className="flex items-center text-sm text-gray-500">
                          <span className="truncate">
                            {company.industry || 'Unknown Industry'}
                            {company.aliases.length > 0 && ` • Aliases: ${company.aliases.join(', ')}`}
                          </span>
                        </div>
                      </div>
                      {company.description && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-600">{company.description}</p>
                        </div>
                      )}
                      {company.website && (
                        <div className="mt-2">
                          <a 
                            href={company.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 truncate block"
                          >
                            {company.website}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-12 text-center">
              <span className="text-4xl">🏢</span>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No sponsored companies yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start by adding companies to the sponsored database.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}