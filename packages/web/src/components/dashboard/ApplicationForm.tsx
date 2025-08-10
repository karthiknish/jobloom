"use client";

import { useState } from "react";
import { format } from "date-fns";

interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  url?: string;
  description?: string;
  salary?: string;
  isSponsored: boolean;
  isRecruitmentAgency?: boolean;
  source: string;
  dateFound: number;
  userId: string;
}

interface Application {
  _id: string;
  jobId: string;
  userId: string;
  status: string;
  appliedDate?: number;
  notes?: string;
  interviewDates?: number[];
  followUpDate?: number;
  createdAt: number;
  updatedAt: number;
  job?: Job;
}

interface ApplicationFormProps {
  application?: Application;
  jobId?: string;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}

export function ApplicationForm({ 
  application, 
  jobId,
  onSubmit, 
  onCancel 
}: ApplicationFormProps) {
  const [formData, setFormData] = useState({
    status: application?.status || "interested",
    appliedDate: application?.appliedDate ? format(new Date(application.appliedDate), "yyyy-MM-dd") : "",
    notes: application?.notes || "",
    followUpDate: application?.followUpDate ? format(new Date(application.followUpDate), "yyyy-MM-dd") : "",
  });

  const [interviewDates, setInterviewDates] = useState<string[]>(
    application?.interviewDates?.map(date => format(new Date(date), "yyyy-MM-dd")) || [""]
  );

  const statusOptions = [
    { value: "interested", label: "Interested" },
    { value: "applied", label: "Applied" },
    { value: "interviewing", label: "Interviewing" },
    { value: "offered", label: "Offered" },
    { value: "rejected", label: "Rejected" },
    { value: "withdrawn", label: "Withdrawn" },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addInterviewDate = () => {
    setInterviewDates(prev => [...prev, ""]);
  };

  const updateInterviewDate = (index: number, value: string) => {
    const updated = [...interviewDates];
    updated[index] = value;
    setInterviewDates(updated);
  };

  const removeInterviewDate = (index: number) => {
    if (interviewDates.length > 1) {
      setInterviewDates(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData: Record<string, unknown> = {
      status: formData.status,
      notes: formData.notes,
    };
    
    if (formData.appliedDate) {
      submitData.appliedDate = new Date(formData.appliedDate).getTime();
    }
    
    if (formData.followUpDate) {
      submitData.followUpDate = new Date(formData.followUpDate).getTime();
    }
    
    if (interviewDates.some(date => date)) {
      submitData.interviewDates = interviewDates
        .filter(date => date)
        .map(date => new Date(date).getTime());
    }
    
    if (!application && jobId) {
      submitData.jobId = jobId;
    }
    
    await onSubmit(submitData);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        {application ? "Edit Application" : "Add New Application"}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Job Information (if editing existing application) */}
        {application?.job && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Job Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
              <div>
                <span className="font-medium">Title:</span> {application.job.title}
              </div>
              <div>
                <span className="font-medium">Company:</span> {application.job.company}
              </div>
              <div>
                <span className="font-medium">Location:</span> {application.job.location}
              </div>
            </div>
          </div>
        )}
        
        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Application Status
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        {/* Applied Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Applied Date
          </label>
          <input
            type="date"
            name="appliedDate"
            value={formData.appliedDate}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        
        {/* Interview Dates */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">
              Interview Dates
            </label>
            <button
              type="button"
              onClick={addInterviewDate}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              + Add Date
            </button>
          </div>
          <div className="space-y-2">
            {interviewDates.map((date, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => updateInterviewDate(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {interviewDates.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeInterviewDate(index)}
                    className="p-2 text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Follow-up Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Follow-up Date
          </label>
          <input
            type="date"
            name="followUpDate"
            value={formData.followUpDate}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        
        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Add any notes about this application..."
          />
        </div>
        
        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {application ? "Update Application" : "Create Application"}
          </button>
        </div>
      </form>
    </div>
  );
}