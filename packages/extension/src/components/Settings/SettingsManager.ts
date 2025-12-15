import { sanitizeBaseUrl, DEFAULT_WEB_APP_URL } from "../../constants";
import { popupUI } from "../UI/PopupUI";

export interface ExtensionSettings {
  showJobBadges: boolean;
  ukFiltersEnabled: boolean;
  overlayEnabled: boolean;
  ukEligibilityCriteria?: {
    minSalary: number;
    requiredSkills: string[];
    jobTypes: string[];
  };
  webAppUrl: string;
  syncFrequency: number;
}

export class SettingsManager {
  private static instance: SettingsManager;
  private defaultSettings: ExtensionSettings = {
    showJobBadges: true,
    ukFiltersEnabled: true, // Default to true so sponsor button shows by default
    overlayEnabled: true, // Default to true - show floating buttons on LinkedIn
    webAppUrl: DEFAULT_WEB_APP_URL,
    syncFrequency: 5, // minutes
  };
  
  private constructor() {
    this.loadSettings();
  }
  
  public static getInstance(): SettingsManager {
    if (!SettingsManager.instance) {
      SettingsManager.instance = new SettingsManager();
    }
    return SettingsManager.instance;
  }
  
  public async loadSettings(): Promise<void> {
    try {
      const settings = await this.getSettings();
      this.updateSettingsUI(settings);
    } catch (error) {
      console.error('Error loading settings:', error);
      popupUI.showError('Failed to load settings');
    }
  }
  
  public async saveSettings(): Promise<void> {
    try {
      const settings = this.getSettingsFromUI();
      await this.storeSettings(settings);
      popupUI.showSuccess('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      popupUI.showError('Failed to save settings');
    }
  }
  
  public async getSettings(): Promise<ExtensionSettings> {
    return new Promise((resolve) => {
      chrome.storage.local.get(['extensionSettings'], (result) => {
        const settings = { ...this.defaultSettings, ...result.extensionSettings };
        resolve(settings);
      });
    });
  }
  
  public async storeSettings(settings: ExtensionSettings): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set({ extensionSettings: settings }, () => {
        resolve();
      });
    });
  }
  
  private updateSettingsUI(settings: ExtensionSettings): void {
    // Update toggle states
    popupUI.setElementChecked('show-badges-toggle', settings.showJobBadges);
    popupUI.setElementChecked('uk-filters-toggle', settings.ukFiltersEnabled);
    popupUI.setElementChecked('overlay-toggle', settings.overlayEnabled);
    
    // Update input values
    popupUI.setElementValue('web-app-url-input', settings.webAppUrl);
    popupUI.setElementValue('sync-frequency-select', settings.syncFrequency.toString());
    
    // Show/hide UK filters details based on toggle state
    popupUI.toggleElement('uk-filters-details', settings.ukFiltersEnabled);
    
    // Sync sponsor button visibility with UK filters state
    this.syncSponsorButtonSetting(settings.ukFiltersEnabled);
    
    // Sync overlay visibility
    this.syncOverlaySetting(settings.overlayEnabled);
    
    // Update UK eligibility criteria if available
    if (settings.ukEligibilityCriteria) {
      popupUI.setElementValue('uk-min-salary', settings.ukEligibilityCriteria.minSalary.toString());
      
      // Update skills (comma-separated)
      if (settings.ukEligibilityCriteria.requiredSkills) {
        popupUI.setElementValue('uk-required-skills', settings.ukEligibilityCriteria.requiredSkills.join(', '));
      }
      
      // Update job types
      if (settings.ukEligibilityCriteria.jobTypes) {
        popupUI.setElementValue('uk-job-types', settings.ukEligibilityCriteria.jobTypes.join(', '));
      }
    }
  }
  
  private syncSponsorButtonSetting(enabled: boolean): void {
    // Update the enableSponsorshipChecks setting in chrome.storage.sync
    // This controls whether the "Check Sponsor" button appears on job cards
    chrome.storage.sync.set({ enableSponsorshipChecks: enabled }, () => {
      console.debug('Sponsor button visibility synced:', enabled);
    });
  }
  
  private syncOverlaySetting(enabled: boolean): void {
    // Update the overlayEnabled setting in chrome.storage.sync
    // This controls whether floating buttons appear on LinkedIn
    chrome.storage.sync.set({ overlayEnabled: enabled }, () => {
      console.debug('Overlay visibility synced:', enabled);
      // Send message to all LinkedIn tabs to update overlay visibility
      this.notifyLinkedInTabs(enabled);
    });
  }
  
  private async notifyLinkedInTabs(overlayEnabled: boolean): Promise<void> {
    try {
      const tabs = await chrome.tabs.query({ url: '*://*.linkedin.com/*' });
      tabs.forEach(tab => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            action: 'updateOverlayVisibility',
            enabled: overlayEnabled
          }).catch(() => {
            // Tab might not have content script loaded, ignore
          });
        }
      });
    } catch (error) {
      console.debug('Could not notify LinkedIn tabs:', error);
    }
  }
  
  private getSettingsFromUI(): ExtensionSettings {
    const showJobBadges = popupUI.getElementValue('show-badges-toggle') === 'true';
    const ukFiltersEnabled = popupUI.getElementValue('uk-filters-toggle') === 'true';
    const overlayEnabled = popupUI.getElementValue('overlay-toggle') === 'true';
    
    let webAppUrl = popupUI.getElementValue('web-app-url-input').trim();
    webAppUrl = sanitizeBaseUrl(webAppUrl || DEFAULT_WEB_APP_URL);
    
    const syncFrequency = parseInt(popupUI.getElementValue('sync-frequency-select')) || 5;
    
    const settings: ExtensionSettings = {
      showJobBadges,
      ukFiltersEnabled,
      overlayEnabled,
      webAppUrl,
      syncFrequency,
    };
    
    // Add UK eligibility criteria if enabled
    if (ukFiltersEnabled) {
      const minSalary = parseInt(popupUI.getElementValue('uk-min-salary')) || 0;
      const requiredSkills = popupUI.getElementValue('uk-required-skills')
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0);
      
      const jobTypes = popupUI.getElementValue('uk-job-types')
        .split(',')
        .map(type => type.trim())
        .filter(type => type.length > 0);
      
      if (minSalary > 0 || requiredSkills.length > 0 || jobTypes.length > 0) {
        settings.ukEligibilityCriteria = {
          minSalary,
          requiredSkills,
          jobTypes,
        };
      }
    }
    
    return settings;
  }
  
  public async resetToDefaults(): Promise<void> {
    try {
      await this.storeSettings(this.defaultSettings);
      this.updateSettingsUI(this.defaultSettings);
      popupUI.showSuccess('Settings reset to defaults');
    } catch (error) {
      console.error('Error resetting settings:', error);
      popupUI.showError('Failed to reset settings');
    }
  }
  
  public async exportSettings(): Promise<void> {
    try {
      const settings = await this.getSettings();
      const dataStr = JSON.stringify(settings, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = 'hireall-extension-settings.json';
      link.click();
      
      URL.revokeObjectURL(url);
      popupUI.showSuccess('Settings exported successfully');
    } catch (error) {
      console.error('Error exporting settings:', error);
      popupUI.showError('Failed to export settings');
    }
  }
  
  public async importSettings(file: File): Promise<void> {
    try {
      const text = await file.text();
      const settings = JSON.parse(text);
      
      // Validate settings structure
      const validSettings = this.validateSettings(settings);
      if (!validSettings) {
        throw new Error('Invalid settings file format');
      }
      
      await this.storeSettings(validSettings);
      this.updateSettingsUI(validSettings);
      popupUI.showSuccess('Settings imported successfully');
    } catch (error) {
      console.error('Error importing settings:', error);
      popupUI.showError('Failed to import settings: ' + (error instanceof Error ? error.message : 'Invalid file'));
    }
  }
  
  private validateSettings(settings: any): ExtensionSettings | null {
    if (!settings || typeof settings !== 'object') {
      return null;
    }
    
    return {
      showJobBadges: typeof settings.showJobBadges === 'boolean' ? settings.showJobBadges : this.defaultSettings.showJobBadges,
      ukFiltersEnabled: typeof settings.ukFiltersEnabled === 'boolean' ? settings.ukFiltersEnabled : this.defaultSettings.ukFiltersEnabled,
      overlayEnabled: typeof settings.overlayEnabled === 'boolean' ? settings.overlayEnabled : this.defaultSettings.overlayEnabled,
      webAppUrl: typeof settings.webAppUrl === 'string' ? settings.webAppUrl : this.defaultSettings.webAppUrl,
      syncFrequency: typeof settings.syncFrequency === 'number' ? settings.syncFrequency : this.defaultSettings.syncFrequency,
      ukEligibilityCriteria: settings.ukEligibilityCriteria && typeof settings.ukEligibilityCriteria === 'object' 
        ? settings.ukEligibilityCriteria 
        : undefined,
    };
  }

  public setupEventListeners(): void {
    // Toggle switches
    ['show-badges-toggle', 'uk-filters-toggle'].forEach(id => {
      const toggle = document.getElementById(id);
      if (toggle) {
        toggle.addEventListener('change', () => {
          // Special handling for UK filters toggle
          if (id === 'uk-filters-toggle') {
            const isChecked = (toggle as HTMLInputElement).checked;
            popupUI.toggleElement('uk-filters-details', isChecked);
            // Sync sponsor button visibility with UK filters
            this.syncSponsorButtonSetting(isChecked);
          }
          // Save settings on toggle change
          this.saveSettings();
        });
      }
    });
    
    // Overlay toggle in header
    const overlayToggle = document.getElementById('overlay-toggle');
    if (overlayToggle) {
      overlayToggle.addEventListener('change', () => {
        const isChecked = (overlayToggle as HTMLInputElement).checked;
        this.syncOverlaySetting(isChecked);
        this.saveSettings();
      });
    }
    
    // Web app URL validation
    const webAppUrlInput = document.getElementById('web-app-url-input') as HTMLInputElement;
    if (webAppUrlInput) {
      webAppUrlInput.addEventListener('blur', () => {
        let url = webAppUrlInput.value.trim();
        if (url) {
          url = sanitizeBaseUrl(url);
          webAppUrlInput.value = url;
        }
        this.saveSettings();
      });
    }
    
    // Configure profile button
    const configureProfileBtn = document.getElementById('configure-profile-btn');
    if (configureProfileBtn) {
      configureProfileBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: `${DEFAULT_WEB_APP_URL}/settings` });
      });
    }
    
    // Configure UK filters button
    const configureUkFiltersBtn = document.getElementById('configure-uk-filters');
    if (configureUkFiltersBtn) {
      configureUkFiltersBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: `${DEFAULT_WEB_APP_URL}/settings` });
      });
    }
  }
}

// Export singleton instance
export const settingsManager = SettingsManager.getInstance();
