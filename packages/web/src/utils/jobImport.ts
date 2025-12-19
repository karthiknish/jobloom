// utils/jobImport.ts
import { parse } from "csv-parse/browser/esm/sync";
import { apiClient } from "@/lib/api/client";

export interface ImportJob {
  title: string;
  company: string;
  location: string;
  url: string;
  description?: string;
  salary?: string;
  isSponsored: boolean;
  isRecruitmentAgency?: boolean;
  source: string;
}

export interface ImportResult {
  importedCount: number;
  skippedCount: number;
  importedJobIds: string[];
  skippedUrls: string[];
  source?: string;
}

/**
 * Parse CSV data into job objects
 * @param csvData - CSV string content
 * @returns Array of job objects
 */
export function parseCSVJobs(csvData: string): ImportJob[] {
  try {
    // Parse CSV data
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    // Map CSV records to job objects
    return records.map((value) => {
      // Type guard to ensure we have a record object
      if (typeof value !== 'object' || value === null) {
        throw new Error('Invalid CSV record format');
      }
      
      const record = value as Record<string, unknown>;
      
      // Convert values to proper types
      const title = String(record.title || '');
      const company = String(record.company || '');
      const location = String(record.location || '');
      const url = String(record.url || '');
      const description = record.description ? String(record.description) : undefined;
      const salary = record.salary ? String(record.salary) : undefined;
      
      // Convert boolean values
      const isSponsored = 
        String(record.isSponsored)?.toLowerCase() === 'true' || 
        String(record.isSponsored) === '1';
      
      const isRecruitmentAgency = record.isRecruitmentAgency !== undefined
        ? (String(record.isRecruitmentAgency)?.toLowerCase() === 'true' || 
           String(record.isRecruitmentAgency) === '1')
        : undefined;

      return {
        title,
        company,
        location,
        url,
        description,
        salary,
        isSponsored: isSponsored || false,
        isRecruitmentAgency: isRecruitmentAgency || undefined,
        source: String(record.source || 'csv'),
      };
    }).filter((job: ImportJob) => job.title && job.company && job.url); // Filter out incomplete jobs
  } catch (error) {
    console.error("Error parsing CSV:", error);
    throw new Error("Failed to parse CSV file. Please check the format and try again.");
  }
}

/**
 * Validate job data
 * @param jobs - Array of job objects
 * @returns Validation result
 */
export function validateJobs(jobs: ImportJob[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (jobs.length === 0) {
    errors.push("No jobs found in the file");
    return { isValid: false, errors };
  }
  
  // Check for required fields
  jobs.forEach((job, index) => {
    if (!job.title) {
      errors.push(`Job ${index + 1}: Missing title`);
    }
    if (!job.company) {
      errors.push(`Job ${index + 1}: Missing company`);
    }
    if (!job.url) {
      errors.push(`Job ${index + 1}: Missing URL`);
    }
    if (!job.location) {
      errors.push(`Job ${index + 1}: Missing location`);
    }
  });
  
  return { 
    isValid: errors.length === 0, 
    errors 
  };
}

/**
 * Import jobs from CSV file
 * @param userId - User ID
 * @param csvData - CSV string content
 * @returns Import result
 */
export async function importJobsFromCSV(userId: string, csvData: string): Promise<ImportResult> {
  try {
    // Parse CSV data
    const jobs = parseCSVJobs(csvData);
    
    // Validate jobs
    const validation = validateJobs(jobs);
    if (!validation.isValid) {
      throw new Error(`Validation errors: ${validation.errors.join(', ')}`);
    }
    
    // Send to API
    const result = await apiClient.post<ImportResult>("/app/jobs/import", {
      userId,
      jobs,
      source: "csv",
    });
    
    return result;
  } catch (error) {
    console.error("Error importing jobs from CSV:", error);
    throw error;
  }
}

/**
 * Import jobs from job board API
 * @param userId - User ID
 * @param source - Job board source (e.g., "linkedin", "indeed")
 * @param searchQuery - Search query
 * @param location - Location filter
 * @returns Import result
 */
export async function importJobsFromAPI(
  userId: string, 
  source: string, 
  searchQuery?: string, 
  location?: string
): Promise<ImportResult> {
  try {
    // Send to API
    const result = await apiClient.post<ImportResult>("/app/jobs/import-api", {
      userId,
      source,
      searchQuery,
      location,
    });
    
    return result;
  } catch (error) {
    console.error("Error importing jobs from API:", error);
    throw error;
  }
}

/**
 * Download sample CSV template
 */
export function downloadSampleCSV(): void {
  const csvContent = `title,company,location,url,description,salary,isSponsored,isRecruitmentAgency,source
Software Engineer,Google,Mountain View, CA,https://google.com/jobs/123,"Exciting opportunity for a software engineer", "£120,000 - £150,000",true,false,manual
Product Manager,Apple,Cupertino, CA,https://apple.com/jobs/456,"Lead product development for our flagship product", "£130,000 - £160,000",false,false,manual
Data Scientist,Microsoft,Seattle, WA,https://microsoft.com/jobs/789,"Analyze large datasets to drive business insights", "£110,000 - £140,000",true,true,manual`;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'hireall_job_import_template.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}