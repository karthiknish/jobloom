// components/dashboard/JobImportModal.tsx
"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useUser } from "@clerk/nextjs";
import { useApiQuery } from "@/hooks/useApi";
import { dashboardApi } from "@/utils/api/dashboard";
import { importJobsFromCSV, importJobsFromAPI, downloadSampleCSV } from "@/utils/jobImport";

interface JobImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export function JobImportModal({ isOpen, onClose, onImportComplete }: JobImportModalProps) {
  const { user } = useUser();
  const [importMethod, setImportMethod] = useState<"csv" | "api">("csv");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [apiSource, setApiSource] = useState<"linkedin" | "indeed" | "glassdoor" | "custom">("linkedin");
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  // Fetch user record
  const { data: userRecord } = useApiQuery(
    () => user ? dashboardApi.getUserByClerkId(user.id) : Promise.reject(new Error("No user")),
    [user?.id]
  );

  const handleCsvImport = async () => {
    if (!userRecord || !csvFile) {
      toast.error("Please select a CSV file");
      return;
    }

    setIsImporting(true);
    
    try {
      // Read CSV file
      const csvText = await csvFile.text();
      
      // Import jobs
      const result = await importJobsFromCSV(userRecord._id, csvText);
      
      toast.success(`Successfully imported ${result.importedCount} jobs (${result.skippedCount} duplicates skipped)`);
      onImportComplete();
      onClose();
    } catch (error: unknown) {
      console.error("Error importing CSV:", error);
      if (error instanceof Error) {
        toast.error(error.message || "Failed to import jobs from CSV");
      } else {
        toast.error("Failed to import jobs from CSV");
      }
    } finally {
      setIsImporting(false);
    }
  };

  const handleApiImport = async () => {
    if (!userRecord) {
      toast.error("User not found");
      return;
    }

    if (apiSource === "custom") {
      toast.error("Please select a valid job board");
      return;
    }

    setIsImporting(true);
    
    try {
      // Import jobs from API
      const result = await importJobsFromAPI(userRecord._id, apiSource, searchQuery, location);
      
      toast.success(`Successfully imported ${result.importedCount} jobs from ${result.source} (${result.skippedCount} duplicates skipped)`);
      onImportComplete();
      onClose();
    } catch (error: unknown) {
      console.error("Error importing from API:", error);
      if (error instanceof Error) {
        toast.error(error.message || "Failed to import jobs from API");
      } else {
        toast.error("Failed to import jobs from API");
      }
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
        toast.error("Please select a CSV file");
        return;
      }
      setCsvFile(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Import Jobs</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        {/* Import Method Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Import Method
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setImportMethod("csv")}
              className={`p-4 border rounded-lg text-center ${
                importMethod === "csv"
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <div className="font-medium">CSV File</div>
              <div className="text-sm text-gray-500 mt-1">
                Upload jobs from a spreadsheet
              </div>
            </button>
            <button
              onClick={() => setImportMethod("api")}
              className={`p-4 border rounded-lg text-center ${
                importMethod === "api"
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <div className="font-medium">Job Board API</div>
              <div className="text-sm text-gray-500 mt-1">
                Import from LinkedIn, Indeed, etc.
              </div>
            </button>
          </div>
        </div>

        {/* CSV Import */}
        {importMethod === "csv" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload CSV File
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <div className="flex text-sm text-gray-600">
                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500">
                      <span>Upload a file</span>
                      <input
                        type="file"
                        className="sr-only"
                        accept=".csv,text/csv"
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    CSV files only
                  </p>
                  {csvFile && (
                    <p className="text-sm text-gray-900 mt-2">
                      Selected: {csvFile.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-medium text-blue-900">
                    Need a template?
                  </h4>
                  <p className="text-sm text-blue-800 mt-1">
                    Download our sample CSV template to get started
                  </p>
                </div>
                <button
                  onClick={downloadSampleCSV}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Download Template
                </button>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                disabled={isImporting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCsvImport}
                disabled={isImporting || !csvFile}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isImporting ? "Importing..." : "Import CSV"}
              </button>
            </div>
          </div>
        )}

        {/* API Import */}
        {importMethod === "api" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Board
              </label>
              <select
                value={apiSource}
                onChange={(e) => setApiSource(e.target.value as "linkedin" | "indeed" | "glassdoor" | "custom")}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="linkedin">LinkedIn</option>
                <option value="indeed">Indeed</option>
                <option value="glassdoor">Glassdoor</option>
                <option value="custom">Other (Custom)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Query
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g., software engineer, marketing manager"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., San Francisco, Remote"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-yellow-500">⚠️</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    API Integration Note
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Job board API integrations require proper authentication and may have rate limits.
                      This is a demonstration feature - in a production environment, you would need to:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Set up API keys for each job board</li>
                      <li>Handle authentication tokens</li>
                      <li>Respect rate limits and terms of service</li>
                      <li>Parse and normalize job data from different sources</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                disabled={isImporting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApiImport}
                disabled={isImporting}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isImporting ? "Importing..." : "Import from API"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}