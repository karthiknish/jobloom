import { DEFAULT_WEB_APP_URL, sanitizeBaseUrl } from "../constants";
import { safeChromeStorageGet } from "../utils/safeStorage";
import { ExtensionMessageHandler } from "./ExtensionMessageHandler";
export interface UserVisaCriteria {
  ukFiltersEnabled: boolean;
  ageCategory: "under26" | "adult";
  educationStatus: "none" | "student" | "recentGraduate" | "graduateVisa" | "professionalTraining";
  phdStatus: "none" | "stemPhd" | "nonStemPhd" | "postdoctoral";
  professionalStatus: "none" | "workingTowards" | "fullRegistration" | "charteredStatus";
  minimumSalary: number;
  jobCategories: string[];
  locationPreference: "uk" | "remote" | "global";
}

export interface UserPreferences {
  defaultJobStatus?: string;
  webAppUrl?: string;
  enableAutoDetection?: boolean;
  enableSponsorshipChecks?: boolean;
  enableJobBoardIntegration?: boolean;
}

export class UserProfileManager {
  private static readonly DEFAULT_VISA_CRITERIA: UserVisaCriteria = {
    ukFiltersEnabled: true,
    ageCategory: "adult",
    educationStatus: "graduateVisa",
    phdStatus: "none",
    professionalStatus: "fullRegistration",
    minimumSalary: 25600,
    jobCategories: [],
    locationPreference: "uk",
  };

  static async getUserVisaCriteria(): Promise<UserVisaCriteria> {
    // Try to sync from Firebase if authenticated
    await this.syncWithFirebase();

    const result = await safeChromeStorageGet<{ userVisaCriteria?: Partial<UserVisaCriteria> }>(
      "sync",
      ["userVisaCriteria"],
      {},
      "UserProfileManager.getUserVisaCriteria"
    );

    return {
      ...this.DEFAULT_VISA_CRITERIA,
      ...(result.userVisaCriteria || {}),
    };
  }

  private static async syncWithFirebase(): Promise<void> {
    try {
      const userId = await this.getUserId();
      if (!userId) return;

      // Check if we've synced recently (within last 5 minutes)
      const lastSync = await safeChromeStorageGet<{ lastFirebaseSync: number }>(
        "local",
        ["lastFirebaseSync"],
        { lastFirebaseSync: 0 },
        "UserProfileManager.syncWithFirebase"
      );

      if (Date.now() - lastSync.lastFirebaseSync < 5 * 60 * 1000) {
        return;
      }

      const response = await ExtensionMessageHandler.sendMessage("fetchUserPreferences", {}, 3);

      if (response?.preferences) {
        const prefs = response.preferences;
        
        // Map Firebase preferences to extension structure
        // This ensures consistency with the web app's mapping in SettingsPage.tsx
        const visaCriteria: Partial<UserVisaCriteria> = {
          ukFiltersEnabled: prefs.ukFiltersEnabled,
          ageCategory: (prefs.ageCategory === 'youngAdult' || prefs.ageCategory === 'student') ? 'under26' : 'adult',
          educationStatus: (prefs.educationStatus === 'bachelor' || prefs.educationStatus === 'master' || prefs.educationStatus === 'phd') 
                           ? 'graduateVisa' : prefs.educationStatus,
          phdStatus: prefs.phdStatus === 'completed' ? 'stemPhd' : 
                     prefs.phdStatus === 'in-progress' ? 'nonStemPhd' : 'none',
          professionalStatus: (prefs.professionalStatus === 'entry-level' || prefs.professionalStatus === 'junior') ? 'workingTowards' :
                              (prefs.professionalStatus === 'mid-level') ? 'fullRegistration' :
                              (prefs.professionalStatus === 'senior' || prefs.professionalStatus === 'expert') ? 'charteredStatus' : 'none',
          minimumSalary: prefs.minimumSalary,
          jobCategories: prefs.jobCategories,
          locationPreference: prefs.locationPreference,
        };

        const preferences: Partial<UserPreferences> = {
          enableSponsorshipChecks: prefs.showSponsorButton,
          enableAutoDetection: prefs.autoDetectJobs,
        };

        await this.updateUserProfile({ visaCriteria, preferences });
        
        // Update last sync time
        await chrome.storage.local.set({ lastFirebaseSync: Date.now() });
        console.debug("Hireall: User profile synced with Firebase");
      }
    } catch (error) {
      console.warn("Hireall: Failed to sync profile with Firebase", error);
    }
  }

  static async setUserVisaCriteria(criteria: Partial<UserVisaCriteria>): Promise<void> {
    const currentCriteria = await this.getUserVisaCriteria();
    const updatedCriteria = { ...currentCriteria, ...criteria };

    return new Promise((resolve, reject) => {
      chrome.storage.sync.set({ userVisaCriteria: updatedCriteria }, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  static async getUserPreferences(): Promise<UserPreferences> {
    const result = await safeChromeStorageGet<Record<string, unknown>>(
      "sync",
      [
        "defaultJobStatus",
        "webAppUrl",
        "enableAutoDetection",
        "enableSponsorshipChecks",
        "enableJobBoardIntegration",
      ],
      {},
      "UserProfileManager.getUserPreferences"
    );

    return result as UserPreferences;
  }

  static async setUserPreferences(preferences: Partial<UserPreferences>): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.set(preferences, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  static async isUserAuthenticated(): Promise<boolean> {
    const result = await safeChromeStorageGet<{ firebaseUid?: string; userId?: string }>(
      "sync",
      ["firebaseUid", "userId"],
      {},
      "UserProfileManager.isUserAuthenticated"
    );

    const uid = result.firebaseUid || result.userId;
    return !!uid;
  }

  static async getUserId(): Promise<string | null> {
    const result = await safeChromeStorageGet<{ firebaseUid?: string; userId?: string }>(
      "sync",
      ["firebaseUid", "userId"],
      {},
      "UserProfileManager.getUserId"
    );

    return result.firebaseUid || result.userId || null;
  }

  static async getWebAppUrl(): Promise<string> {
    const result = await safeChromeStorageGet<{ webAppUrl?: string }>(
      "sync",
      ["webAppUrl"],
      {},
      "UserProfileManager.getWebAppUrl"
    );

    return sanitizeBaseUrl(result.webAppUrl || DEFAULT_WEB_APP_URL);
  }

  static async getDefaultJobStatus(): Promise<string> {
    const result = await safeChromeStorageGet<{ defaultJobStatus?: string }>(
      "sync",
      ["defaultJobStatus"],
      {},
      "UserProfileManager.getDefaultJobStatus"
    );

    return result.defaultJobStatus || "interested";
  }

  static async isAutoDetectionEnabled(): Promise<boolean> {
    const result = await safeChromeStorageGet<{ enableAutoDetection?: boolean }>(
      "sync",
      ["enableAutoDetection"],
      {},
      "UserProfileManager.isAutoDetectionEnabled"
    );

    return result.enableAutoDetection !== false;
  }

  static async isSponsorshipCheckEnabled(): Promise<boolean> {
    const result = await safeChromeStorageGet<{ enableSponsorshipChecks?: boolean }>(
      "sync",
      ["enableSponsorshipChecks"],
      {},
      "UserProfileManager.isSponsorshipCheckEnabled"
    );

    return result.enableSponsorshipChecks !== false;
  }

  static async isJobBoardIntegrationEnabled(): Promise<boolean> {
    const result = await safeChromeStorageGet<{ enableJobBoardIntegration?: boolean }>(
      "sync",
      ["enableJobBoardIntegration"],
      {},
      "UserProfileManager.isJobBoardIntegrationEnabled"
    );

    return result.enableJobBoardIntegration !== false;
  }

  static async updateUserProfile(profile: {
    visaCriteria?: Partial<UserVisaCriteria>;
    preferences?: Partial<UserPreferences>;
  }): Promise<void> {
    const promises: Promise<void>[] = [];

    if (profile.visaCriteria) {
      promises.push(this.setUserVisaCriteria(profile.visaCriteria));
    }

    if (profile.preferences) {
      promises.push(this.setUserPreferences(profile.preferences));
    }

    await Promise.all(promises);
  }

  static async resetToDefaults(): Promise<void> {
    await Promise.all([
      this.setUserVisaCriteria(this.DEFAULT_VISA_CRITERIA),
      this.setUserPreferences({
        defaultJobStatus: "interested",
        enableAutoDetection: true,
        enableSponsorshipChecks: true,
        enableJobBoardIntegration: true,
      }),
    ]);
  }

  static async exportUserSettings(): Promise<{
    visaCriteria: UserVisaCriteria;
    preferences: UserPreferences;
  }> {
    const [visaCriteria, preferences] = await Promise.all([
      this.getUserVisaCriteria(),
      this.getUserPreferences(),
    ]);

    return {
      visaCriteria,
      preferences,
    };
  }

  static async importUserSettings(settings: {
    visaCriteria?: Partial<UserVisaCriteria>;
    preferences?: Partial<UserPreferences>;
  }): Promise<void> {
    return this.updateUserProfile(settings);
  }
}
