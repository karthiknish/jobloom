export interface ExtensionMessage {
  action: string;
  data?: any;
}

export class ExtensionMessageHandler {
  private static handlers: Map<string, (message: ExtensionMessage) => void> = new Map();

  private static resolveJobTracker(): import("./JobTracker").JobTracker | null {
    const tracker = (window as unknown as { hireallJobTracker?: import("./JobTracker").JobTracker }).hireallJobTracker;
    return tracker ?? null;
  }

  static registerHandler(action: string, handler: (message: ExtensionMessage) => void): void {
    this.handlers.set(action, handler);
  }

  static unregisterHandler(action: string): void {
    this.handlers.delete(action);
  }

  static handleMessage(request: ExtensionMessage, sender?: any, sendResponse?: any): boolean {
    const handler = this.handlers.get(request.action);
    
    if (handler) {
      try {
        handler(request);
        if (sendResponse) {
          sendResponse({ success: true });
        }
        return true;
      } catch (error) {
        console.error(`Error handling message action ${request.action}:`, error);
        if (sendResponse) {
          sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
        }
        return false;
      }
    }

    // Handle built-in actions
    switch (request.action) {
      case "togglePeopleSearch":
        this.handleTogglePeopleSearch();
        return true;

      case "triggerAutofill":
        this.handleTriggerAutofill();
        return true;

      case "toggleHighlight":
        this.handleToggleHighlight();
        return true;

      case "clearHighlights":
        this.handleClearHighlights();
        return true;

      default:
        console.log("Unhandled action:", request.action);
        return false;
    }
  }

  private static handleTogglePeopleSearch(): void {
    const peopleSearchBtn = document.getElementById(
      "hireall-people-search"
    ) as HTMLButtonElement;
    if (peopleSearchBtn) {
      peopleSearchBtn.click();
    }
  }

  private static handleTriggerAutofill(): void {
    const autofillBtn = document.getElementById(
      "hireall-autofill"
    ) as HTMLButtonElement;
    if (autofillBtn && autofillBtn.style.display !== "none") {
      autofillBtn.click();
    }
  }

  private static handleToggleHighlight(): void {
    const tracker = this.resolveJobTracker();
    if (tracker) {
      void tracker.handleToggle();
      return;
    }

    const highlightBtn = document.getElementById(
      "hireall-sponsor-toggle"
    ) as HTMLButtonElement;
    highlightBtn?.click();
  }

  private static handleClearHighlights(): void {
    const tracker = this.resolveJobTracker();
    if (tracker) {
      tracker.clearHighlights();
      return;
    }

    import("./JobTracker")
      .then(({ JobTracker }) => {
        const jobTracker = new JobTracker();
        jobTracker.initialize();
        jobTracker.clearHighlights();
      })
      .catch((error) => {
        console.error("Failed to import JobTracker:", error);
      });
  }

  static initialize(): void {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener((request: any, sender: any, sendResponse: any) => {
        return this.handleMessage(request, sender, sendResponse);
      });
    }
  }

  static sendMessage(action: string, data?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage({ action, data }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      } else {
        reject(new Error('Chrome runtime not available'));
      }
    });
  }
}
