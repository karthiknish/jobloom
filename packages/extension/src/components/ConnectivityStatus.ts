/**
 * Connectivity Status Component
 * 
 * Monitors online/offline status, sync state, and pending changes
 */

import { EXT_COLORS } from "../theme";
import { UIComponents } from "./UIComponents";

interface SyncState {
  lastSyncTime: number | null;
  pendingChanges: number;
  isOnline: boolean;
  isSyncing: boolean;
  lastError: string | null;
}

export class ConnectivityStatus {
  private static instance: ConnectivityStatus;
  private state: SyncState = {
    lastSyncTime: null,
    pendingChanges: 0,
    isOnline: navigator.onLine,
    isSyncing: false,
    lastError: null
  };
  private statusBar: HTMLElement | null = null;
  private retryCount = 0;
  private maxRetries = 3;
  private retryTimeouts: NodeJS.Timeout[] = [];

  private constructor() {
    this.initialize();
  }

  static getInstance(): ConnectivityStatus {
    if (!ConnectivityStatus.instance) {
      ConnectivityStatus.instance = new ConnectivityStatus();
    }
    return ConnectivityStatus.instance;
  }

  private async initialize(): Promise<void> {
    // Load cached state
    await this.loadState();
    
    // Listen for online/offline events
    window.addEventListener('online', () => this.handleOnlineChange(true));
    window.addEventListener('offline', () => this.handleOnlineChange(false));
    
    // Create status bar
    this.createStatusBar();
    this.updateUI();
  }

  private async loadState(): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.get(['lastSyncTime', 'pendingJobs'], (result) => {
        this.state.lastSyncTime = result.lastSyncTime || null;
        this.state.pendingChanges = (result.pendingJobs || []).length;
        resolve();
      });
    });
  }

  private handleOnlineChange(isOnline: boolean): void {
    this.state.isOnline = isOnline;
    this.updateUI();
    
    if (isOnline && this.state.pendingChanges > 0) {
      // Auto-retry sync when coming back online
      UIComponents.showToast(
        `Back online. ${this.state.pendingChanges} pending changes.`,
        { type: 'info' }
      );
    } else if (!isOnline) {
      UIComponents.showToast('You are offline. Changes will sync when connected.', { type: 'warning' });
    }
  }

  private createStatusBar(): void {
    // Check if status bar already exists
    if (document.getElementById('sync-status-bar')) {
      this.statusBar = document.getElementById('sync-status-bar');
      return;
    }

    this.statusBar = document.createElement('div');
    this.statusBar.id = 'sync-status-bar';
    this.statusBar.className = 'sync-status-bar';
    
    // Insert after header
    const header = document.querySelector('.app-header');
    if (header && header.parentNode) {
      header.parentNode.insertBefore(this.statusBar, header.nextSibling);
    }
  }

  updateUI(): void {
    if (!this.statusBar) return;

    const { isOnline, isSyncing, lastSyncTime, pendingChanges, lastError } = this.state;

    // Offline banner
    if (!isOnline) {
      this.statusBar.innerHTML = `
        <div class="status-offline">
          <span class="status-dot offline"></span>
          <span>Offline</span>
          ${pendingChanges > 0 ? `<span class="pending-badge">${pendingChanges} pending</span>` : ''}
        </div>
      `;
      this.statusBar.classList.add('visible');
      return;
    }

    // Syncing state
    if (isSyncing) {
      this.statusBar.innerHTML = `
        <div class="status-syncing">
          <div class="sync-spinner"></div>
          <span>Syncing...</span>
        </div>
      `;
      this.statusBar.classList.add('visible');
      return;
    }

    // Error state with retry
    if (lastError) {
      this.statusBar.innerHTML = `
        <div class="status-error">
          <span class="status-dot error"></span>
          <span>Sync failed</span>
          <button class="retry-btn" id="retry-sync-btn">Retry</button>
        </div>
      `;
      this.statusBar.classList.add('visible');
      
      // Add retry listener
      document.getElementById('retry-sync-btn')?.addEventListener('click', () => {
        this.triggerRetry();
      });
      return;
    }

    // Success state - show last sync time
    if (lastSyncTime) {
      const timeAgo = this.formatTimeAgo(lastSyncTime);
      const showPending = pendingChanges > 0;
      
      this.statusBar.innerHTML = `
        <div class="status-success">
          <span class="status-dot online"></span>
          <span>Last synced ${timeAgo}</span>
          ${showPending ? `<span class="pending-badge">${pendingChanges} pending</span>` : ''}
        </div>
      `;
      this.statusBar.classList.add('visible');
    } else {
      // No sync yet
      this.statusBar.classList.remove('visible');
    }
  }

  private formatTimeAgo(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }

  // Public methods for sync management
  setSyncing(isSyncing: boolean): void {
    this.state.isSyncing = isSyncing;
    this.updateUI();
  }

  setError(error: string | null): void {
    this.state.lastError = error;
    this.updateUI();
  }

  setSyncSuccess(): void {
    this.state.lastSyncTime = Date.now();
    this.state.lastError = null;
    this.retryCount = 0;
    
    // Persist last sync time
    chrome.storage.local.set({ lastSyncTime: this.state.lastSyncTime });
    
    this.updateUI();
  }

  async updatePendingCount(): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.get(['pendingJobs'], (result) => {
        this.state.pendingChanges = (result.pendingJobs || []).length;
        this.updateUI();
        resolve();
      });
    });
  }

  private triggerRetry(): void {
    // Dispatch custom event for PopupController to handle
    window.dispatchEvent(new CustomEvent('sync-retry'));
  }

  // Retry with exponential backoff
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    onRetry?: (attempt: number, delay: number) => void
  ): Promise<T> {
    this.retryCount = 0;
    this.clearRetryTimeouts();
    
    const execute = async (): Promise<T> => {
      try {
        this.setSyncing(true);
        this.setError(null);
        
        const result = await this.withTimeout(operation(), 15000);
        
        this.setSyncing(false);
        this.setSyncSuccess();
        return result;
      } catch (error) {
        this.setSyncing(false);
        
        if (this.retryCount < this.maxRetries && this.state.isOnline) {
          this.retryCount++;
          const delay = Math.pow(2, this.retryCount) * 1000; // 2s, 4s, 8s
          
          onRetry?.(this.retryCount, delay);
          
          UIComponents.showToast(
            `Sync failed. Retrying in ${delay / 1000}s... (${this.retryCount}/${this.maxRetries})`,
            { type: 'warning' }
          );
          
          return new Promise((resolve, reject) => {
            const timeout = setTimeout(async () => {
              try {
                const result = await execute();
                resolve(result);
              } catch (e) {
                reject(e);
              }
            }, delay);
            this.retryTimeouts.push(timeout);
          });
        }
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.setError(errorMessage);
        throw error;
      }
    };
    
    return execute();
  }

  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Sync timed out. Please try again.')), ms)
      )
    ]);
  }

  private clearRetryTimeouts(): void {
    this.retryTimeouts.forEach(t => clearTimeout(t));
    this.retryTimeouts = [];
  }

  isOnline(): boolean {
    return this.state.isOnline;
  }

  getPendingCount(): number {
    return this.state.pendingChanges;
  }

  getLastSyncTime(): number | null {
    return this.state.lastSyncTime;
  }
}

// Export singleton
export const connectivityStatus = ConnectivityStatus.getInstance();
