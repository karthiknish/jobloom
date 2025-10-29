export {}; // ensure this file is a module

declare global {
  interface ChromeRuntime {
    sendMessage?: (...args: any[]) => void;
    getManifest?: () => Record<string, any>;
    onMessage?: {
      addListener?: (...args: any[]) => void;
      removeListener?: (...args: any[]) => void;
    };
    lastError?: { message?: string };
    id?: string;
  }

  interface ChromeStorageArea {
    set?: (items: Record<string, unknown>, callback?: () => void) => void;
  }

  interface ChromeStorage {
    sync?: ChromeStorageArea;
  }

  interface Chrome {
    runtime?: ChromeRuntime;
    storage?: ChromeStorage;
  }

  interface Window {
    chrome?: Chrome;
    __hireall_extension?: Record<string, unknown>;
  }

  const chrome: Chrome;
}
