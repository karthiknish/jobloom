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
    // Remove existing listener if present to avoid duplicates
    if (this.messageListener) {
      chrome.runtime.onMessage.removeListener(this.messageListener);
    }

    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
      this.messageListener = (request: any, sender: any, sendResponse: any) => {
        // Check if this is a message meant for this handler
        if (!request.target || request.target === 'ExtensionMessageHandler') {
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
        }
        // Return undefined to let other handlers process the message
        return undefined;
      };
      chrome.runtime.onMessage.addListener(this.messageListener);
    }
  }

  private static messageListener?: (request: any, sender: any, sendResponse: any) => boolean | undefined;

  static isExtensionContextValid(): boolean {
    return typeof chrome !== 'undefined' && chrome.runtime && !!chrome.runtime.id;
  }

  static sendMessage(action: string, data?: any, retries = 2): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.isExtensionContextValid()) {
        reject(new Error('Chrome extension context not available'));
        return;
      }

      const attemptSend = (attempt = 0) => {
        chrome.runtime.sendMessage({ action, data }, (response) => {
          if (chrome.runtime.lastError) {
            const errorMessage = chrome.runtime.lastError.message || '';
            
            // Check if it's a port closure or context invalidation error
            if (errorMessage.includes('message port closed') || 
                errorMessage.includes('Receiving end does not exist') ||
                errorMessage.includes('Extension context invalidated')) {
              
              if (attempt < retries) {
                const delay = Math.min(100 * Math.pow(2, attempt), 1000); // Exponential backoff
                console.debug(`Message port closed for action ${action}, retry ${attempt + 1}/${retries} in ${delay}ms`);
                setTimeout(() => {
                  if (!this.isExtensionContextValid()) {
                    reject(new Error('Chrome extension context invalidated during retry'));
                    return;
                  }
                  attemptSend(attempt + 1);
                }, delay);
              } else {
                console.debug(`All retries failed for action ${action}: ${errorMessage}`);
                reject(new Error(`Extension communication failed after ${retries} retries: ${errorMessage}`));
              }
            } else {
              reject(new Error(errorMessage));
            }
          } else {
            resolve(response);
          }
        });
      };

      attemptSend();
    });
  }
}
