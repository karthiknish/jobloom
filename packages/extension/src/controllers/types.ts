// Global type declarations for the extension popup

declare global {
  interface Window {
    popupController: import('./PopupController').PopupController;
    changeJobStatus: (jobId: string, newStatus: string) => void;
    checkJobSponsor: (jobId: string, companyName: string) => void;
    openJobUrl: (url: string) => void;
    saveExtensionSettings: () => void;
    resetSettings: () => void;
    exportSettings: () => void;
    importSettings: () => void;
  }
}

export {};
