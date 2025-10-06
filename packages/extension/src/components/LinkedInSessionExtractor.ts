// LinkedIn Session Extractor for HireAll Extension
// Extracts user authentication information from LinkedIn to enable seamless auth

interface LinkedInUserInfo {
  userId?: string;
  userEmail?: string;
  isAuthenticated: boolean;
  sessionToken?: string;
}

class LinkedInSessionExtractor {
  private static readonly LINKEDIN_AUTH_COOKIE = 'li_at';
  private static readonly LINKEDIN_USER_COOKIE = 'liap';
  private static readonly LINKEDIN_SESSION_KEY = 'linkedin_session';

  /**
   * Extract LinkedIn user session information
   */
  static extractSession(): LinkedInUserInfo {
    const result: LinkedInUserInfo = {
      isAuthenticated: false
    };

    try {
      // Method 1: Check for LinkedIn authentication cookie
      const authCookie = this.getCookie(this.LINKEDIN_AUTH_COOKIE);
      if (authCookie) {
        result.sessionToken = authCookie;
        result.isAuthenticated = true;
      }

      // Method 2: Check for LinkedIn user profile data in localStorage
      const storedUserData = localStorage.getItem('linkedin_user');
      if (storedUserData) {
        try {
          const userData = JSON.parse(storedUserData);
          if (userData.id) {
            result.userId = userData.id;
          }
          if (userData.email) {
            result.userEmail = userData.email;
          }
        } catch (e) {
          console.debug('Failed to parse LinkedIn user data from localStorage');
        }
      }

      // Method 3: Extract from DOM (LinkedIn profile data)
      if (!result.userId || !result.userEmail) {
        const profileData = this.extractFromDOM();
        if (profileData.userId) result.userId = profileData.userId;
        if (profileData.userEmail) result.userEmail = profileData.userEmail;
      }

      // Method 4: Check sessionStorage for LinkedIn auth data
      if (!result.userId) {
        const sessionData = sessionStorage.getItem(this.LINKEDIN_SESSION_KEY);
        if (sessionData) {
          try {
            const session = JSON.parse(sessionData);
            if (session.userId) result.userId = session.userId;
            if (session.userEmail) result.userEmail = session.userEmail;
          } catch (e) {
            console.debug('Failed to parse LinkedIn session data');
          }
        }
      }

    } catch (error) {
      console.error('Error extracting LinkedIn session:', error);
    }

    return result;
  }

  /**
   * Get a cookie value by name
   */
  private static getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null;
    }
    return null;
  }

  /**
   * Extract user information from LinkedIn DOM
   */
  private static extractFromDOM(): { userId?: string; userEmail?: string } {
    const result: { userId?: string; userEmail?: string } = {};

    try {
      // Look for user ID in data attributes
      const userElements = Array.from(document.querySelectorAll('[data-member-id], [data-user-id]'));
      for (const element of userElements) {
        const userId = element.getAttribute('data-member-id') || element.getAttribute('data-user-id');
        if (userId && userId.length > 0) {
          result.userId = userId;
          break;
        }
      }

      // Look for email in profile data
      const emailElements = Array.from(document.querySelectorAll('[data-email], [data-contact-email]'));
      for (const element of emailElements) {
        const email = element.getAttribute('data-email') || element.getAttribute('data-contact-email');
        if (email && email.includes('@')) {
          result.userEmail = email;
          break;
        }
      }

      // Try to extract from LinkedIn's global objects
      if (window && (window as any).LinkedIn) {
        const linkedinData = (window as any).LinkedIn;
        if (linkedinData.user && linkedinData.user.id) {
          result.userId = linkedinData.user.id;
        }
        if (linkedinData.user && linkedinData.user.email) {
          result.userEmail = linkedinData.user.email;
        }
      }

    } catch (error) {
      console.debug('Error extracting from LinkedIn DOM:', error);
    }

    return result;
  }

  /**
   * Check if user is authenticated on LinkedIn
   */
  static isAuthenticated(): boolean {
    const session = this.extractSession();
    return session.isAuthenticated || !!(session.userId || session.userEmail);
  }

  /**
   * Get user ID from LinkedIn session
   */
  static getUserId(): string | null {
    const session = this.extractSession();
    return session.userId || null;
  }

  /**
   * Get user email from LinkedIn session
   */
  static getUserEmail(): string | null {
    const session = this.extractSession();
    return session.userEmail || null;
  }

  /**
   * Store LinkedIn session data for later use
   */
  static storeSession(sessionData: LinkedInUserInfo): void {
    try {
      if (sessionData.userId || sessionData.userEmail) {
        const dataToStore = {
          userId: sessionData.userId,
          userEmail: sessionData.userEmail,
          extractedAt: Date.now(),
          source: 'linkedin'
        };
        sessionStorage.setItem(this.LINKEDIN_SESSION_KEY, JSON.stringify(dataToStore));
      }
    } catch (error) {
      console.error('Error storing LinkedIn session:', error);
    }
  }
}

// Export for use in other modules
export { LinkedInSessionExtractor, LinkedInUserInfo };