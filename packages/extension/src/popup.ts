/// <reference types="chrome" />
import { popupController } from "./controllers/PopupController";
import { logger } from "./utils/logger";

// Initialize the popup when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  try {
    logger.info('Popup', 'Initializing popup...');
    await popupController.initialize();
    logger.info('Popup', 'Popup initialized successfully');
  } catch (error) {
    logger.error('Popup', 'Failed to initialize popup', error);
  }
});

// Handle extension updates
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'EXTENSION_UPDATED') {
    popupController.handleExtensionUpdate();
    sendResponse({ success: true });
  }
});

// Export for global access
(window as any).popupController = popupController;
