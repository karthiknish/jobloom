import { userService } from "./UserService";
import { jobsService } from "./JobsService";
import { applicationsService } from "./ApplicationsService";
import { sponsorshipService } from "./SponsorshipService";
import { cvService } from "./CvService";
import { contactService } from "./ContactService";
import { apiClient } from "../../lib/api/client";

class AppApiClient {
  // User endpoints
  getUserById(userId: string) { return userService.getById(userId); }
  getAllUsers() { return userService.getAll(); }

  // Job endpoints
  getJobStats(userId: string) { return jobsService.getStats(userId); }

  // Application endpoints
  getApplicationsByUser(userId: string) { return applicationsService.getByUser(userId); }
  updateApplicationStatus(applicationId: string, status: string) { 
    return applicationsService.updateStatus(applicationId, status); 
  }

  // Sponsorship endpoints
  getAllSponsoredCompanies(filters?: any) { return sponsorshipService.getAllCompanies(filters); }
  getSponsorshipStats() { return sponsorshipService.getStats(); }
  addSponsoredCompany(data: any) { return sponsorshipService.addCompany(data); }
  getAllSponsorshipRules() { return sponsorshipService.getAllRules(); }
  addSponsorshipRule(data: any) { return sponsorshipService.addRule(data); }
  updateSponsorshipRuleStatus(ruleId: string, isActive: boolean) { 
    return sponsorshipService.updateRuleStatus(ruleId, isActive); 
  }

  // CV Analysis endpoints
  getUserCvAnalyses(userId: string) { return cvService.getUserAnalyses(userId); }
  getCvAnalysisStats(userId: string) { return cvService.getAnalysisStats(userId); }

  // Contact endpoints
  createContact(data: any) { return contactService.create(data); }
  getAllContacts(token: string, options?: any) { return contactService.getAll(token, options); }
  getContact(token: string, contactId: string) { return contactService.getById(token, contactId); }
  updateContactStatus(token: string, contactId: string, status: string, response?: string) { 
    return contactService.updateStatus(token, contactId, status, response); 
  }
  deleteContact(token: string, contactId: string) { return contactService.delete(token, contactId); }

  // Admin endpoints
  isUserAdmin(userId: string) { return userService.isAdmin(userId); }
  setAdminUser(userId: string, requesterId: string) { return userService.setAdmin(userId, requesterId); }
  removeAdminUser(userId: string, requesterId: string) { return userService.removeAdmin(userId, requesterId); }

  // Helper for direct requests if needed
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return apiClient.request<T>(`/app${endpoint}`, options);
  }
}

export const appApi = new AppApiClient();
export { appApi as default };
