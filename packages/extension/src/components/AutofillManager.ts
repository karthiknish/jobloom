import { get } from "../apiClient";

export interface AutofillProfile {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  professional: {
    currentTitle: string;
    experience: string;
    education: string;
    skills: string;
    linkedinUrl: string;
    portfolioUrl: string;
    githubUrl: string;
  };
  preferences: {
    salaryExpectation: string;
    availableStartDate: string;
    workAuthorization: string;
    relocate: boolean;
    coverLetter: string;
  };
}

interface FormField {
  element: HTMLElement;
  name: string;
  type: string;
}

export class AutofillManager {
  private static readonly FORM_SELECTORS = [
    'form[action*="apply"]',
    'form[action*="application"]',
    'form[id*="apply"]',
    'form[id*="application"]',
    'form[class*="apply"]',
    'form[class*="application"]',
    ".application-form",
    ".job-application",
    ".apply-form",
    "#application-form",
    '[data-testid*="application"]',
    '[data-testid*="apply"]',
  ];

  private static readonly INPUT_SELECTORS = [
    'input[name*="name"]',
    'input[name*="email"]',
    'input[name*="phone"]',
    'input[type="email"]',
    'textarea[name*="cover"]',
    'input[name*="resume"]',
    'input[type="file"]',
  ];

  private static readonly FIELD_PATTERNS = [
    // Personal Information
    { pattern: /first.*name|fname|given.*name/i, type: "firstName" },
    { pattern: /last.*name|lname|family.*name|surname/i, type: "lastName" },
    { pattern: /full.*name|name/i, type: "fullName" },
    { pattern: /email/i, type: "email" },
    { pattern: /phone|mobile|tel/i, type: "phone" },
    { pattern: /address|street/i, type: "address" },
    { pattern: /city/i, type: "city" },
    { pattern: /state|province/i, type: "state" },
    { pattern: /zip|postal/i, type: "zipCode" },
    { pattern: /country/i, type: "country" },

    // Professional Information
    { pattern: /current.*title|job.*title|position/i, type: "currentTitle" },
    { pattern: /experience|years/i, type: "experience" },
    { pattern: /education|degree|school|university/i, type: "education" },
    { pattern: /skills|expertise/i, type: "skills" },
    { pattern: /linkedin|profile/i, type: "linkedinUrl" },
    { pattern: /portfolio|website/i, type: "portfolioUrl" },
    { pattern: /github/i, type: "githubUrl" },

    // Application Specific
    {
      pattern: /salary|compensation|expected.*pay/i,
      type: "salaryExpectation",
    },
    { pattern: /start.*date|available|when/i, type: "availableStartDate" },
    {
      pattern: /authorization|visa|work.*status/i,
      type: "workAuthorization",
    },
    { pattern: /relocate|move|willing/i, type: "relocate" },
    { pattern: /cover.*letter|motivation|why/i, type: "coverLetter" },
  ];

  static async loadAutofillProfile(): Promise<AutofillProfile | null> {
    try {
      // First try to load from web app API
      const userId = await this.getUserId();
      if (userId) {
        try {
          const response = await get<{ success?: boolean; data?: AutofillProfile | null }>(
            `/api/app/autofill/profile/${encodeURIComponent(userId)}`
          );

          const profile = response?.data ?? null;
          if (response?.success && profile) {
            chrome.storage.sync.set({ autofillProfile: profile });
            return profile;
          }
        } catch (error) {
          console.warn("Failed to load autofill profile from web app, using local storage:", error);
        }
      }

      // Fallback to local storage
      return new Promise((resolve) => {
        chrome.storage.sync.get(["autofillProfile"], (result: { autofillProfile?: AutofillProfile }) => {
          resolve(result.autofillProfile || null);
        });
      });
    } catch (error) {
      console.error("Error loading autofill profile:", error);
      return null;
    }
  }

  private static async getUserId(): Promise<string | null> {
    return new Promise((resolve) => {
      chrome.storage.sync.get(["firebaseUid", "userId"], (result: { firebaseUid?: string; userId?: string }) => {
        resolve(result.firebaseUid || result.userId || null);
      });
    });
  }

  static detectApplicationForms(): boolean {
    // Check for common application form patterns
    const hasApplicationForm =
      this.FORM_SELECTORS.some((selector) => document.querySelector(selector)) ||
      this.INPUT_SELECTORS.some(
        (selector) => document.querySelectorAll(selector).length >= 2
      );

    const autofillButton = document.getElementById("hireall-autofill");
    if (autofillButton) {
      autofillButton.style.display = hasApplicationForm ? "block" : "none";
    }

    return hasApplicationForm;
  }

  static findFormFields(): FormField[] {
    const fields: FormField[] = [];

    // Find input fields
    const inputs = document.querySelectorAll("input, textarea, select");
    inputs.forEach((input) => {
      const element = input as HTMLElement;
      const name =
        element.getAttribute("name") ||
        element.getAttribute("id") ||
        element.getAttribute("placeholder") ||
        "";
      const label = this.findFieldLabel(element);
      const searchText = `${name} ${label}`.toLowerCase();

      for (const pattern of this.FIELD_PATTERNS) {
        if (pattern.pattern.test(searchText)) {
          fields.push({
            element,
            name: searchText,
            type: pattern.type,
          });
          break;
        }
      }
    });

    return fields;
  }

  static findFieldLabel(element: HTMLElement): string {
    // Try to find associated label
    const id = element.getAttribute("id");
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) return label.textContent || "";
    }

    // Look for nearby label or text
    const parent = element.parentElement;
    if (parent) {
      const label = parent.querySelector("label");
      if (label) return label.textContent || "";

      // Check for text content in parent
      const textContent = parent.textContent || "";
      return textContent.replace(element.textContent || "", "").trim();
    }

    return element.getAttribute("placeholder") || "";
  }

  static getValueForField(
    field: FormField,
    profile: AutofillProfile
  ): string {
    switch (field.type) {
      // Personal Information
      case "firstName":
        return profile.personalInfo.firstName;
      case "lastName":
        return profile.personalInfo.lastName;
      case "fullName":
        return `${profile.personalInfo.firstName} ${profile.personalInfo.lastName}`;
      case "email":
        return profile.personalInfo.email;
      case "phone":
        return profile.personalInfo.phone;
      case "address":
        return profile.personalInfo.address;
      case "city":
        return profile.personalInfo.city;
      case "state":
        return profile.personalInfo.state;
      case "zipCode":
        return profile.personalInfo.zipCode;
      case "country":
        return profile.personalInfo.country;

      // Professional Information
      case "currentTitle":
        return profile.professional.currentTitle;
      case "experience":
        return profile.professional.experience;
      case "education":
        return profile.professional.education;
      case "skills":
        return profile.professional.skills;
      case "linkedinUrl":
        return profile.professional.linkedinUrl;
      case "portfolioUrl":
        return profile.professional.portfolioUrl;
      case "githubUrl":
        return profile.professional.githubUrl;

      // Application Specific
      case "salaryExpectation":
        return profile.preferences.salaryExpectation;
      case "availableStartDate":
        return profile.preferences.availableStartDate;
      case "workAuthorization":
        return profile.preferences.workAuthorization;
      case "relocate":
        return profile.preferences.relocate ? "Yes" : "No";
      case "coverLetter":
        return profile.preferences.coverLetter;

      default:
        return "";
    }
  }

  static fillField(element: HTMLElement, value: string): boolean {
    try {
      const input = element as
        | HTMLInputElement
        | HTMLTextAreaElement
        | HTMLSelectElement;

      if (input.type === "checkbox" || input.type === "radio") {
        const checkboxInput = input as HTMLInputElement;
        const shouldCheck =
          value.toLowerCase() === "yes" || value.toLowerCase() === "true";
        if (checkboxInput.checked !== shouldCheck) {
          checkboxInput.checked = shouldCheck;
          checkboxInput.dispatchEvent(new Event("change", { bubbles: true }));
        }
        return true;
      }

      if (input.tagName === "SELECT") {
        const select = input as HTMLSelectElement;
        // Try to find matching option
        for (let i = 0; i < select.options.length; i++) {
          const option = select.options[i];
          if (
            option.text.toLowerCase().includes(value.toLowerCase()) ||
            option.value.toLowerCase().includes(value.toLowerCase())
          ) {
            select.selectedIndex = i;
            select.dispatchEvent(new Event("change", { bubbles: true }));
            return true;
          }
        }
        return false;
      }

      // Regular input or textarea
      if (input.value !== value) {
        input.value = value;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }

      return true;
    } catch (error) {
      console.warn("Failed to fill field:", error);
      return false;
    }
  }

  static async autofillApplication(): Promise<void> {
    // Load user profile data
    const profile = await this.loadAutofillProfile();
    if (!profile) {
      throw new Error(
        "No autofill profile configured. Please set up your profile in settings."
      );
    }

    // Find and fill form fields
    const fieldsToFill = this.findFormFields();
    let filledCount = 0;

    for (const field of fieldsToFill) {
      try {
        const value = this.getValueForField(field, profile);
        if (value && this.fillField(field.element, value)) {
          filledCount++;
          // Small delay between fills to appear more natural
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.warn("Failed to fill field:", field.name, error);
      }
    }

    console.log(`Autofilled ${filledCount} fields`);

    if (filledCount === 0) {
      throw new Error("No compatible form fields found on this page.");
    }
  }

  static startFormDetection(): void {
    // Re-check periodically as forms may load dynamically
    setTimeout(() => this.detectApplicationForms(), 3000);
  }
}
