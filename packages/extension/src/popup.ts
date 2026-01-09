/// <reference types="chrome" />
import { popupController } from "./controllers/PopupController";
import { logger } from "./utils/logger";
import { EXT_COLORS } from "./theme";
import "./popup.css";

/**
 * Injects theme colors as CSS variables into the document root.
 * This ensures that theme.ts is the single source of truth for colors.
 */
function injectThemeVariables() {
  const root = document.documentElement;

  // Map EXT_COLORS to CSS variable names
  // Note: We convert camelCase to kebab-case
  Object.entries(EXT_COLORS).forEach(([key, value]) => {
    if (typeof value === 'string') {
      const cssVarName = `--${key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`;
      root.style.setProperty(cssVarName, value);
    }
  });

  logger.debug('Popup', 'Theme variables injected');
}

// Initialize the popup when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  try {
    logger.info('Popup', 'Initializing popup...');

    // Inject theme variables first
    injectThemeVariables();

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
