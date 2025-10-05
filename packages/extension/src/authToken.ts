import { getAuthInstance } from "./firebase";

async function getTokenFromActiveTab(): Promise<string | null> {
  if (typeof chrome === "undefined" || !chrome.tabs) {
    return null;
  }

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      return null;
    }

    const response = await chrome.tabs.sendMessage(tab.id, { action: "getAuthToken" });
    if (response?.token && typeof response.token === "string") {
      return response.token;
    }
  } catch (error) {
    console.warn("Failed to get token from active tab:", error);
  }

  return null;
}

export async function acquireIdToken(forceRefresh = false): Promise<string | null> {
  try {
    const auth = getAuthInstance();
    const user = auth.currentUser;

    if (user) {
      return await user.getIdToken(forceRefresh);
    }

    const tabToken = await getTokenFromActiveTab();
    if (tabToken) {
      return tabToken;
    }

    return null;
  } catch (error) {
    console.warn("Failed to acquire ID token:", error);
    return null;
  }
}
