// components/dashboard/JobImportModal.tsx
"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useUser } from "@clerk/nextjs";
import { useApiQuery } from "@/hooks/useApi";
import { dashboardApi } from "@/utils/api/dashboard";
import { importJobsFromCSV, importJobsFromAPI, downloadSampleCSV } from "@/utils/jobImport";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Jobs</DialogTitle>
        </DialogHeader>

        {/* Import Method Selection */}
        <div className="mb-6">
          <Label className="block text-sm font-medium mb-2">
            Import Method
          </Label>
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant={importMethod === "csv" ? "default" : "outline"}
              onClick={() => setImportMethod("csv")}
              className="p-4 h-auto flex flex-col items-center justify-center gap-2"
            >
              <div className="font-medium">CSV File</div>
              <div className="text-xs opacity-80">
                Upload jobs from a spreadsheet
              </div>
            </Button>
            <Button
              variant={importMethod === "api" ? "default" : "outline"}
              onClick={() => setImportMethod("api")}
              className="p-4 h-auto flex flex-col items-center justify-center gap-2"
            >
              <div className="font-medium">Job Board API</div>
              <div className="text-xs opacity-80">
                Import from LinkedIn, Indeed, etc.
              </div>
            </Button>
          </div>
        </div>

        {/* CSV Import */}
        {importMethod === "csv" && (
          <div className="space-y-4">
            <div>
              <Label className="block text-sm font-medium mb-2">
                Upload CSV File
              </Label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg">
                <div className="space-y-1 text-center">
                  <div className="flex text-sm justify-center">
                    <Label className="relative cursor-pointer rounded-md font-medium hover:opacity-80">
                      <span>Upload a file</span>
                      <Input
                        type="file"
                        className="sr-only"
                        accept=".csv,text/csv"
                        onChange={handleFileChange}
                      />
                    </Label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs opacity-70">
                    CSV files only
                  </p>
                  {csvFile && (
                    <p className="text-sm mt-2">
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
                <Button
                  variant="outline"
                  onClick={downloadSampleCSV}
                >
                  Download Template
                </Button>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isImporting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCsvImport}
                disabled={isImporting || !csvFile}
              >
                {isImporting ? "Importing..." : "Import CSV"}
              </Button>
            </div>
          </div>
        )}

        {/* API Import */}
        {importMethod === "api" && (
          <div className="space-y-4">
            <div>
              <Label className="block text-sm font-medium mb-2">
                Job Board
              </Label>
              <Select value={apiSource} onValueChange={setApiSource}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="indeed">Indeed</SelectItem>
                  <SelectItem value="glassdoor">Glassdoor</SelectItem>
                  <SelectItem value="custom">Other (Custom)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="block text-sm font-medium mb-2">
                Search Query
              </Label>
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g., software engineer, marketing manager"
              />
            </div>

            <div>
              <Label className="block text-sm font-medium mb-2">
                Location
              </Label>
              <Input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., San Francisco, Remote"
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
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isImporting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleApiImport}
                disabled={isImporting}
              >
                {isImporting ? "Importing..." : "Import from API"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}