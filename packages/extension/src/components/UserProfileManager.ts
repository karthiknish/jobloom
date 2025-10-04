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
    return new Promise((resolve) => {
      chrome.storage.sync.get(["userVisaCriteria"], (result: { userVisaCriteria?: UserVisaCriteria }) => {
        resolve({
          ...this.DEFAULT_VISA_CRITERIA,
          ...(result.userVisaCriteria || {}),
        });
      });
    });
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
    return new Promise((resolve) => {
      chrome.storage.sync.get(
        ["defaultJobStatus", "webAppUrl", "enableAutoDetection", "enableSponsorshipChecks", "enableJobBoardIntegration"],
        (result: UserPreferences) => {
          resolve(result);
        }
      );
    });
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
    return new Promise((resolve) => {
      chrome.storage.sync.get(["firebaseUid", "userId"], (result: { firebaseUid?: string; userId?: string }) => {
        const uid = result.firebaseUid || result.userId;
        resolve(!!uid);
      });
    });
  }

  static async getUserId(): Promise<string | null> {
    return new Promise((resolve) => {
      chrome.storage.sync.get(["firebaseUid", "userId"], (result: { firebaseUid?: string; userId?: string }) => {
        resolve(result.firebaseUid || result.userId || null);
      });
    });
  }

  static async getWebAppUrl(): Promise<string> {
    return new Promise((resolve) => {
      chrome.storage.sync.get(["webAppUrl"], (result: { webAppUrl?: string }) => {
        resolve(result.webAppUrl || process.env.DEFAULT_WEB_APP_URL || "https://hireall.app");
      });
    });
  }

  static async getDefaultJobStatus(): Promise<string> {
    return new Promise((resolve) => {
      chrome.storage.sync.get(["defaultJobStatus"], (result: { defaultJobStatus?: string }) => {
        resolve(result.defaultJobStatus || "interested");
      });
    });
  }

  static async isAutoDetectionEnabled(): Promise<boolean> {
    return new Promise((resolve) => {
      chrome.storage.sync.get(["enableAutoDetection"], (result: { enableAutoDetection?: boolean }) => {
        resolve(result.enableAutoDetection !== false); // Default to true
      });
    });
  }

  static async isSponsorshipCheckEnabled(): Promise<boolean> {
    return new Promise((resolve) => {
      chrome.storage.sync.get(["enableSponsorshipChecks"], (result: { enableSponsorshipChecks?: boolean }) => {
        resolve(result.enableSponsorshipChecks !== false); // Default to true
      });
    });
  }

  static async isJobBoardIntegrationEnabled(): Promise<boolean> {
    return new Promise((resolve) => {
      chrome.storage.sync.get(["enableJobBoardIntegration"], (result: { enableJobBoardIntegration?: boolean }) => {
        resolve(result.enableJobBoardIntegration !== false); // Default to true
      });
    });
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
