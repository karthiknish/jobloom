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
    return element?.value || '';
  }
  
  public setElementValue(elementId: string, value: string): void {
    const element = document.getElementById(elementId) as HTMLInputElement;
    if (element) {
      element.value = value;
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
    const tabs = document.querySelectorAll('.nav-tab');
    const contents = document.querySelectorAll('.tab-content');
    
    // Remove active class from all tabs and contents
    tabs.forEach(tab => tab.classList.remove('active'));
    contents.forEach(content => content.classList.remove('active'));
    
    // Add active class to selected tab and content
    const selectedTab = document.querySelector(`[data-tab="${tabId}"]`) as HTMLElement;
    const selectedContent = document.getElementById(`${tabId}-content`);
    
    if (selectedTab) selectedTab.classList.add('active');
    if (selectedContent) selectedContent.classList.add('active');
  }
  
  // Filter methods
  public setActiveFilter(filterType?: string): void {
    const filters = document.querySelectorAll('.filter-btn');
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
}

// Export singleton instance
export const popupUI = PopupUI.getInstance();
