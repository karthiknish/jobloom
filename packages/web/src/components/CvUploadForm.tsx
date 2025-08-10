"use client";

import { useState } from "react";
import { CloudArrowUpIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

interface CvUploadFormProps {
  userId: string;
}

export function CvUploadForm({ userId }: CvUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState("");
  const [industry, setIndustry] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast.error("Please select a CV file to upload");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", userId);
      formData.append("targetRole", targetRole);
      formData.append("industry", industry);

      const response = await fetch("/api/cv/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("CV uploaded successfully! Analysis in progress...");
        setFile(null);
        setTargetRole("");
        setIndustry("");
        // Reset file input
        const fileInput = document.getElementById(
          "file-upload",
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      } else {
        toast.error(result.error || "Failed to upload CV");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload CV");
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Upload Your CV for Analysis
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Get AI-powered insights to improve your CV. Supported formats: PDF,
          TXT (max 5MB)
        </p>

        {/* File Upload Area */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 ${
            dragActive
              ? "border-indigo-500 bg-indigo-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="text-center">
            <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  {file ? file.name : "Drop your CV here or click to browse"}
                </span>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  accept=".pdf,.txt"
                  onChange={handleFileChange}
                />
              </label>
              {file && (
                <p className="mt-1 text-xs text-gray-500">
                  {formatFileSize(file.size)} • {file.type}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">PDF or TXT up to 5MB</p>
            </div>
          </div>
        </div>
      </div>

      {/* Optional Context Fields */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="target-role"
            className="block text-sm font-medium text-gray-700"
          >
            Target Role (Optional)
          </label>
          <input
            type="text"
            id="target-role"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="e.g., Software Engineer, Marketing Manager"
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          <p className="mt-1 text-xs text-gray-500">
            Helps provide more targeted feedback
          </p>
        </div>

        <div>
          <label
            htmlFor="industry"
            className="block text-sm font-medium text-gray-700"
          >
            Industry (Optional)
          </label>
          <select
            id="industry"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="">Select industry</option>
            <option value="Technology">Technology</option>
            <option value="Finance">Finance</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Marketing">Marketing</option>
            <option value="Sales">Sales</option>
            <option value="Education">Education</option>
            <option value="Consulting">Consulting</option>
            <option value="Manufacturing">Manufacturing</option>
            <option value="Retail">Retail</option>
            <option value="Other">Other</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Industry-specific recommendations
          </p>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!file || uploading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Analyzing...
            </>
          ) : (
            "Analyze CV"
          )}
        </button>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">
          💡 Tips for better analysis:
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use a clean, well-formatted CV</li>
          <li>• Include specific role and industry for targeted feedback</li>
          <li>
            • Ensure your CV has clear sections (Experience, Skills, Education)
          </li>
          <li>• Remove any sensitive personal information before uploading</li>
        </ul>
      </div>
    </form>
  );
}
