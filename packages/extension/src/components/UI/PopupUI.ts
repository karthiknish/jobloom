import { showToast, ToastOptions } from "../../utils/toast";
import { addMicroInteractions, addRippleAnimation, addLoadingSpinner, removeLoadingSpinner } from "../../utils/animations";

export class PopupUI {
  private static instance: PopupUI;

  private constructor() {
    this.initialize();
  }

  public static getInstance(): PopupUI {
    if (!PopupUI.instance) {
      PopupUI.instance = new PopupUI();
    }
    return PopupUI.instance;
  }

  private initialize(): void {
    // Add animations when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        addRippleAnimation();
        addMicroInteractions();
      });
    } else {
      addRippleAnimation();
      addMicroInteractions();
    }
  }

  // Toast methods
  public showSuccess(message: string, action?: ToastOptions['action']): void {
    showToast(message, { type: 'success', action });
  }

  public showError(message: string, action?: ToastOptions['action']): void {
    showToast(message, { type: 'error', action });
  }

  public showWarning(message: string, action?: ToastOptions['action']): void {
    showToast(message, { type: 'warning', action });
  }

  public showInfo(message: string, action?: ToastOptions['action']): void {
    showToast(message, { type: 'info', action });
  }

  // UI state methods
  public showLoading(buttonId: string): void {
    const button = document.getElementById(buttonId) as HTMLButtonElement;
    if (button) {
      addLoadingSpinner(button);
      button.disabled = true;
    }
  }

  public hideLoading(buttonId: string): void {
    const button = document.getElementById(buttonId) as HTMLButtonElement;
    if (button) {
      removeLoadingSpinner(button);
      button.disabled = false;
    }
  }

  public toggleElement(elementId: string, force?: boolean): void {
    const element = document.getElementById(elementId) as HTMLElement;
    if (element) {
      if (force !== undefined) {
        element.style.display = force ? 'block' : 'none';
      } else {
        element.style.display = element.style.display === 'none' ? 'block' : 'none';
      }
    }
  }

  public toggleClass(elementId: string, className: string, force?: boolean): void {
    const element = document.getElementById(elementId) as HTMLElement;
    if (element) {
      if (force !== undefined) {
        element.classList.toggle(className, force);
      } else {
        element.classList.toggle(className);
      }
    }
  }

  public setElementText(elementId: string, text: string): void {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = text;
    }
  }

  public setElementHTML(elementId: string, html: string): void {
    const element = document.getElementById(elementId);
    if (element) {
      element.innerHTML = html;
    }
  }

  public getElementValue(elementId: string): string {
    const element = document.getElementById(elementId) as HTMLInputElement;
    if (!element) return '';

    if (element.type === 'checkbox') {
      return element.checked ? 'true' : 'false';
    }

    return element.value || '';
  }

  public setElementValue(elementId: string, value: string): void {
    const element = document.getElementById(elementId) as HTMLInputElement;
    if (element) {
      if (element.type === 'checkbox') {
        element.checked = value === 'true';
      } else {
        element.value = value;
      }
    }
  }

  public setElementChecked(elementId: string, checked: boolean): void {
    const element = document.getElementById(elementId) as HTMLInputElement;
    if (element && element.type === 'checkbox') {
      element.checked = checked;
    }
  }

  public clearElement(elementId: string): void {
    const element = document.getElementById(elementId);
    if (element) {
      element.innerHTML = '';
    }
  }

  public focusElement(elementId: string): void {
    const element = document.getElementById(elementId) as HTMLElement;
    if (element && element.focus) {
      element.focus();
    }
  }

  // Tab navigation
  public switchTab(tabId: string): void {
    const tabs = document.querySelectorAll('.nav-item');
    const contents = document.querySelectorAll('.tab-view');

    // Remove active class from all tabs and contents
    tabs.forEach(tab => tab.classList.remove('active'));
    contents.forEach(content => content.classList.remove('active'));

    // Add active class to selected tab and content
    const selectedTab = document.querySelector(`[data-tab="${tabId}"]`) as HTMLElement;
    // HTML uses *-content IDs (e.g., jobs-content, settings-content, auth-content)
    const selectedContent = document.getElementById(`${tabId}-content`);

    if (selectedTab) selectedTab.classList.add('active');
    if (selectedContent) {
      selectedContent.classList.add('active');
    } else {
      console.warn(`PopupUI: Tab content element not found for tab "${tabId}"`);
    }
  }

  // Filter methods
  public setActiveFilter(filterType?: string): void {
    const filters = document.querySelectorAll('.filter-pill');
    filters.forEach(filter => filter.classList.remove('active'));

    if (filterType) {
      const activeFilter = document.querySelector(`[data-filter="${filterType}"]`) as HTMLElement;
      if (activeFilter) activeFilter.classList.add('active');
    }
  }

  // Form methods
  public clearForm(formId: string): void {
    const form = document.getElementById(formId) as HTMLFormElement;
    if (form) {
      form.reset();
    }
  }

  public getFormData(formId: string): Record<string, string> {
    const form = document.getElementById(formId) as HTMLFormElement;
    const data: Record<string, string> = {};

    if (form) {
      const inputs = form.querySelectorAll('input, select, textarea');
      inputs.forEach(input => {
        const element = input as HTMLInputElement;
        if (element.name) {
          data[element.name] = element.value;
        }
      });
    }

    return data;
  }

  // Modal methods
  public showModal(modalId: string): void {
    const modal = document.getElementById(modalId) as HTMLElement;
    if (modal) {
      modal.style.display = 'flex';
      modal.setAttribute('aria-hidden', 'false');
    }
  }

  public hideModal(modalId: string): void {
    const modal = document.getElementById(modalId) as HTMLElement;
    if (modal) {
      modal.style.display = 'none';
      modal.setAttribute('aria-hidden', 'true');
    }
  }

  // Animation helpers
  public addPulseAnimation(elementId: string): void {
    const element = document.getElementById(elementId) as HTMLElement;
    if (element) {
      element.classList.add('pulse-once');
      setTimeout(() => element.classList.remove('pulse-once'), 500);
    }
  }

  public shakeElement(elementId: string): void {
    const element = document.getElementById(elementId) as HTMLElement;
    if (element) {
      element.classList.add('shake');
      setTimeout(() => element.classList.remove('shake'), 600);
    }
  }

  public toggleGlobalLoading(isLoading: boolean) {
    const loader = document.querySelector('.loading-state');

    if (isLoading) {
      loader?.classList.remove('hidden');
    } else {
      loader?.classList.add('hidden');
    }
  }

  async showSkeletonLoader(show: boolean, count?: number) {
    const skeleton = document.getElementById('jobs-skeleton');
    const emptyState = document.querySelector('.empty-state');
    const loadingState = document.querySelector('.loading-state');
    const loadingText = loadingState?.querySelector('span');

    if (show) {
      // Get cached job count for dynamic skeleton
      let skeletonCount = count ?? 3;
      
      if (!count) {
        try {
          const result = await new Promise<{ cachedJobCount?: number }>((resolve) => {
            chrome.storage.local.get(['cachedJobCount'], (data) => resolve(data));
          });
          if (result.cachedJobCount && result.cachedJobCount > 0) {
            skeletonCount = Math.min(result.cachedJobCount, 10); // Cap at 10 skeletons
          }
        } catch (e) {
          // Fallback to default
        }
      }
      
      // Update loading message with count
      if (loadingText && skeletonCount > 1) {
        loadingText.textContent = `Loading ${skeletonCount} jobs...`;
      }
      
      // Generate dynamic skeleton cards
      if (skeleton) {
        const skeletonHTML = Array(skeletonCount).fill(0).map(() => `
          <div class="skeleton-card">
            <div class="skeleton-line title"></div>
            <div class="skeleton-line subtitle"></div>
            <div class="skeleton-line meta"></div>
          </div>
        `).join('');
        skeleton.innerHTML = skeletonHTML;
        skeleton.classList.remove('hidden');
      }
      
      emptyState?.classList.add('hidden');
    } else {
      skeleton?.classList.add('hidden');
      if (loadingText) {
        loadingText.textContent = 'Syncing jobs...';
      }
    }
  }


  setSyncing(isSyncing: boolean) {
    const syncBtn = document.getElementById('sync-btn');
    if (syncBtn) {
      if (isSyncing) {
        syncBtn.classList.add('spinning');
        syncBtn.setAttribute('disabled', 'true');
      } else {
        syncBtn.classList.remove('spinning');
        syncBtn.removeAttribute('disabled');
      }
    }
  }

  public setAuthLoading(isLoading: boolean) {
    const submitBtn = document.getElementById('email-auth-submit') as HTMLButtonElement;
    const btnText = submitBtn?.querySelector('.btn-text');
    const btnSpinner = submitBtn?.querySelector('.btn-spinner');

    if (submitBtn && btnText && btnSpinner) {
      if (isLoading) {
        submitBtn.disabled = true;
        btnText.classList.add('hidden');
        btnSpinner.classList.remove('hidden');
      } else {
        submitBtn.disabled = false;
        btnText.classList.remove('hidden');
        btnSpinner.classList.add('hidden');
      }
    }
  }

  public updateUserProfile(user: { email: string; photoUrl?: string; displayName?: string }) {
    const emailDisplay = document.getElementById('user-email-display');
    const nameDisplay = document.querySelector('.user-name');
    const avatarPlaceholder = document.querySelector('.avatar-placeholder');

    if (emailDisplay) {
      emailDisplay.textContent = user.email;
    }

    if (nameDisplay && user.displayName) {
      nameDisplay.textContent = user.displayName;
    }

    if (avatarPlaceholder) {
      if (user.photoUrl) {
        avatarPlaceholder.innerHTML = `<img src="${user.photoUrl}" alt="Profile" class="user-avatar-img" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
      } else {
        // Generate colored avatar if no photo
        const initial = (user.displayName || user.email).charAt(0).toUpperCase();
        const colors = ['#EF4444', '#F97316', '#F59E0B', '#84CC16', '#10B981', '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899'];
        let hash = 0;
        const str = user.email;
        for (let i = 0; i < str.length; i++) {
          hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const color = colors[Math.abs(hash) % colors.length];

        avatarPlaceholder.innerHTML = `<div style="width: 100%; height: 100%; background-color: ${color}; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1.2rem; border-radius: 50%;">${initial}</div>`;
      }
    }
  }
}

// Export singleton instance
export const popupUI = PopupUI.getInstance();
