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
        const result = handler(request);
        if (sendResponse) {
          sendResponse({ success: true, result });
        }
      } catch (error) {
        console.error(`Error handling message action ${request.action}:`, error);
        if (sendResponse) {
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
      return false;
    }

    // Handle built-in actions
    switch (request.action) {
      case "togglePeopleSearch":
        this.handleTogglePeopleSearch();
        sendResponse?.({ success: true });
        return false;

      case "triggerAutofill":
        this.handleTriggerAutofill();
        sendResponse?.({ success: true });
        return false;

      case "toggleHighlight":
        this.handleToggleHighlight();
        sendResponse?.({ success: true });
        return false;

      case "clearHighlights":
        this.handleClearHighlights();
        sendResponse?.({ success: true });
        return false;

      case "getUserId":
        if (sendResponse && typeof chrome !== "undefined" && chrome.storage?.sync) {
          // Check if runtime is still valid before making storage call
          if (!chrome.runtime?.id) {
            sendResponse({ success: false, userId: null, error: "Extension context invalid" });
            return false;
          }

          chrome.storage.sync.get(["firebaseUid", "userId"], (result: { firebaseUid?: string; userId?: string }) => {
            if (chrome.runtime?.lastError) {
              sendResponse({
                success: false,
                error: chrome.runtime.lastError.message,
                userId: null,
              });
              return;
            }

            const userId = result.firebaseUid || result.userId || null;
            sendResponse({ success: true, userId });
          });
          return true; // async response
        }

        sendResponse?.({ success: false, userId: null, error: "Storage unavailable" });
        return false;

      default:
        console.log("Unhandled action:", request.action);
        sendResponse?.({ success: false, error: "Unhandled action" });
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
      // Toggle functionality removed - highlights are now automatic
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
        // Wrap handler in try-catch to prevent unhandled exceptions
        try {
          return this.handleMessage(request, sender, sendResponse);
        } catch (error) {
          console.error('Error in ExtensionMessageHandler:', error);
          if (sendResponse) {
            sendResponse({ 
              success: false, 
              error: error instanceof Error ? error.message : 'Unknown handler error' 
            });
          }
          return false;
        }
      });
    }
  }

  static isExtensionContextValid(): boolean {
    return typeof chrome !== 'undefined' && chrome.runtime && !!chrome.runtime.id;
  }

  static sendMessage(action: string, data?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.isExtensionContextValid()) {
        reject(new Error('Chrome extension context not available'));
        return;
      }

      chrome.runtime.sendMessage({ action, data }, (response) => {
        if (chrome.runtime.lastError) {
          const errorMessage = chrome.runtime.lastError.message || '';
          // Check if it's a port closure error
          if (errorMessage.includes('message port closed') || errorMessage.includes('Receiving end does not exist')) {
            console.debug(`Message port closed for action ${action}, will retry`);
            // Retry once after a short delay
            setTimeout(() => {
              if (!this.isExtensionContextValid()) {
                reject(new Error('Chrome extension context not available on retry'));
                return;
              }
              
              chrome.runtime.sendMessage({ action, data }, (retryResponse) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(retryResponse);
                }
              });
            }, 100);
          } else {
            reject(new Error(errorMessage));
          }
        } else {
          resolve(response);
        }
      });
    });
  }
}
