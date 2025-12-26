/**
 * Onboarding Component
 * 
 * Multi-step onboarding flow for new users with:
 * - Welcome & value proposition
 * - Key features overview
 * - How to use tutorial
 * - Sign-in prompt
 */

import { EXT_COLORS } from "../theme";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  features?: string[];
  action?: {
    label: string;
    onClick: () => void;
  };
}

export class Onboarding {
  private container: HTMLDivElement | null = null;
  private currentStep = 0;
  private onComplete?: () => void;
  private onSkip?: () => void;

  private readonly steps: OnboardingStep[] = [
    {
      id: "welcome",
      title: "Welcome to HireAll",
      description: "Your intelligent job search companion. Track applications, check visa sponsorship, and land your dream role faster.",
      icon: "rocket",
      features: [
        "Track all your job applications in one place",
        "Instantly check UK visa sponsorship status",
        "Smart job analysis with SOC code matching",
        "Sync across devices with cloud backup"
      ]
    },
    {
      id: "features",
      title: "Powerful Features",
      description: "Everything you need to supercharge your job search.",
      icon: "zap",
      features: [
        "🎯 One-click job tracking from LinkedIn, Indeed & more",
        "🇬🇧 UK Visa sponsor verification in seconds",
        "📊 Application analytics & insights",
        "💼 SOC code matching for Skilled Worker visa"
      ]
    },
    {
      id: "how-it-works",
      title: "How It Works",
      description: "Get started in 3 simple steps.",
      icon: "play",
      features: [
        "1. Browse job listings on LinkedIn or Indeed",
        "2. Click 'Add to Board' to track interesting jobs",
        "3. Use 'Check Sponsor' to verify visa eligibility"
      ]
    },
    {
      id: "get-started",
      title: "Ready to Start?",
      description: "Sign in to sync your data across devices and unlock all features.",
      icon: "user-plus",
      action: {
        label: "Sign In to Get Started",
        onClick: () => this.goToAuth()
      }
    }
  ];

  constructor(options?: { onComplete?: () => void; onSkip?: () => void }) {
    this.onComplete = options?.onComplete;
    this.onSkip = options?.onSkip;
  }

  /**
   * Check if onboarding should be shown
   */
  static async shouldShow(): Promise<boolean> {
    return new Promise((resolve) => {
      chrome.storage.local.get(["hasCompletedOnboarding", "onboardingDismissed"], (result) => {
        resolve(!result.hasCompletedOnboarding && !result.onboardingDismissed);
      });
    });
  }

  /**
   * Mark onboarding as completed
   */
  static async markCompleted(): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set({ hasCompletedOnboarding: true }, () => resolve());
    });
  }

  /**
   * Show the onboarding flow
   */
  show(): void {
    if (this.container) return;

    this.container = document.createElement("div");
    this.container.className = "onboarding-overlay";
    this.container.innerHTML = this.renderStep();
    
    // Add styles
    this.injectStyles();
    
    document.body.appendChild(this.container);
    
    // Animate in
    requestAnimationFrame(() => {
      this.container?.classList.add("visible");
    });
  }

  /**
   * Hide the onboarding
   */
  hide(): void {
    if (!this.container) return;
    
    this.container.classList.remove("visible");
    setTimeout(() => {
      this.container?.remove();
      this.container = null;
    }, 300);
  }

  /**
   * Render current step
   */
  private renderStep(): string {
    const step = this.steps[this.currentStep];
    const isLastStep = this.currentStep === this.steps.length - 1;
    const isFirstStep = this.currentStep === 0;

    const featuresHtml = step.features?.map(f => `
      <li class="onboarding-feature">${f}</li>
    `).join("") || "";

    return `
      <div class="onboarding-modal">
        <button class="onboarding-skip" onclick="window.onboardingInstance?.skip()">
          Skip Tour
        </button>
        
        <div class="onboarding-content">
          <div class="onboarding-icon ${step.id}">
            ${this.getIcon(step.icon)}
          </div>
          
          <h1 class="onboarding-title">${step.title}</h1>
          <p class="onboarding-description">${step.description}</p>
          
          ${featuresHtml ? `<ul class="onboarding-features">${featuresHtml}</ul>` : ""}
        </div>
        
        <div class="onboarding-footer">
          <div class="onboarding-progress">
            ${this.steps.map((_, i) => `
              <div class="progress-dot ${i === this.currentStep ? 'active' : ''} ${i < this.currentStep ? 'completed' : ''}"></div>
            `).join("")}
          </div>
          
          <div class="onboarding-actions">
            ${!isFirstStep ? `
              <button class="onboarding-btn secondary" onclick="window.onboardingInstance?.prev()">
                Back
              </button>
            ` : ""}
            
            ${step.action ? `
              <button class="onboarding-btn primary action" onclick="window.onboardingInstance?.handleAction()">
                ${step.action.label}
              </button>
            ` : `
              <button class="onboarding-btn primary" onclick="window.onboardingInstance?.${isLastStep ? 'complete' : 'next'}()">
                ${isLastStep ? 'Get Started' : 'Continue'}
              </button>
            `}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Go to next step
   */
  next(): void {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      this.updateView();
    }
  }

  /**
   * Go to previous step
   */
  prev(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.updateView();
    }
  }

  /**
   * Skip onboarding
   */
  async skip(): Promise<void> {
    await new Promise<void>((resolve) => {
      chrome.storage.local.set({ onboardingDismissed: true }, () => resolve());
    });
    this.hide();
    this.onSkip?.();
  }

  /**
   * Complete onboarding
   */
  async complete(): Promise<void> {
    await Onboarding.markCompleted();
    this.hide();
    this.onComplete?.();
  }

  /**
   * Handle custom action
   */
  handleAction(): void {
    const step = this.steps[this.currentStep];
    if (step.action) {
      step.action.onClick();
    }
  }

  /**
   * Go to auth tab
   */
  private goToAuth(): void {
    this.hide();
    Onboarding.markCompleted();
    
    // Trigger auth tab click
    const authTab = document.querySelector('[data-tab="auth"]') as HTMLElement;
    authTab?.click();
  }

  /**
   * Update the view
   */
  private updateView(): void {
    if (!this.container) return;
    
    const modal = this.container.querySelector(".onboarding-modal");
    if (modal) {
      modal.classList.add("transitioning");
      setTimeout(() => {
        if (this.container) {
          this.container.innerHTML = this.renderStep();
        }
      }, 150);
    }
  }

  /**
   * Get icon SVG
   */
  private getIcon(name: string): string {
    const icons: Record<string, string> = {
      rocket: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
        <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
        <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
        <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
      </svg>`,
      zap: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>`,
      play: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polygon points="10 8 16 12 10 16 10 8"/>
      </svg>`,
      "user-plus": `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="8.5" cy="7" r="4"/>
        <line x1="20" y1="8" x2="20" y2="14"/>
        <line x1="23" y1="11" x2="17" y2="11"/>
      </svg>`
    };
    return icons[name] || "";
  }

  /**
   * Inject styles
   */
  private injectStyles(): void {
    if (document.getElementById("onboarding-styles")) return;

    const style = document.createElement("style");
    style.id = "onboarding-styles";
    style.textContent = `
      .onboarding-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(4px);
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      .onboarding-overlay.visible {
        opacity: 1;
      }
      
      .onboarding-modal {
        background: linear-gradient(145deg, #1f2937, #111827);
        border-radius: 20px;
        width: 340px;
        max-height: 90vh;
        overflow: hidden;
        position: relative;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.1);
        animation: slideIn 0.3s ease;
      }
      
      .onboarding-modal.transitioning {
        opacity: 0.5;
        transform: scale(0.98);
        transition: all 0.15s ease;
      }
      
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(20px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      
      .onboarding-skip {
        position: absolute;
        top: 16px;
        right: 16px;
        background: rgba(255, 255, 255, 0.1);
        border: none;
        color: #9ca3af;
        font-size: 12px;
        padding: 6px 12px;
        border-radius: 20px;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .onboarding-skip:hover {
        background: rgba(255, 255, 255, 0.15);
        color: #fff;
      }
      
      .onboarding-content {
        padding: 48px 28px 24px;
        text-align: center;
      }
      
      .onboarding-icon {
        width: 80px;
        height: 80px;
        margin: 0 auto 24px;
        border-radius: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
      }
      
      .onboarding-icon.welcome {
        background: linear-gradient(135deg, ${EXT_COLORS.success}, ${EXT_COLORS.greenDark});
      }
      
      .onboarding-icon.features {
        background: linear-gradient(135deg, ${EXT_COLORS.info}, ${EXT_COLORS.brandBlue});
      }
      
      .onboarding-icon.how-it-works {
        background: linear-gradient(135deg, ${EXT_COLORS.warning}, #f59e0b);
      }
      
      .onboarding-icon.get-started {
        background: linear-gradient(135deg, ${EXT_COLORS.accentPurple}, #7c3aed);
      }
      
      .onboarding-title {
        font-size: 22px;
        font-weight: 700;
        color: #fff;
        margin: 0 0 12px;
        line-height: 1.3;
      }
      
      .onboarding-description {
        font-size: 14px;
        color: #9ca3af;
        margin: 0 0 20px;
        line-height: 1.6;
      }
      
      .onboarding-features {
        list-style: none;
        padding: 0;
        margin: 0;
        text-align: left;
      }
      
      .onboarding-feature {
        font-size: 13px;
        color: #d1d5db;
        padding: 10px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        display: flex;
        align-items: center;
        gap: 10px;
      }
      
      .onboarding-feature:last-child {
        border-bottom: none;
      }
      
      .onboarding-footer {
        padding: 20px 28px;
        background: rgba(0, 0, 0, 0.2);
        border-top: 1px solid rgba(255, 255, 255, 0.08);
      }
      
      .onboarding-progress {
        display: flex;
        justify-content: center;
        gap: 8px;
        margin-bottom: 20px;
      }
      
      .progress-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.2);
        transition: all 0.3s ease;
      }
      
      .progress-dot.active {
        background: ${EXT_COLORS.success};
        width: 24px;
        border-radius: 4px;
      }
      
      .progress-dot.completed {
        background: ${EXT_COLORS.success};
      }
      
      .onboarding-actions {
        display: flex;
        gap: 12px;
      }
      
      .onboarding-btn {
        flex: 1;
        padding: 12px 16px;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        border: none;
      }
      
      .onboarding-btn.primary {
        background: linear-gradient(135deg, ${EXT_COLORS.success}, ${EXT_COLORS.greenDark});
        color: #fff;
        box-shadow: 0 4px 14px rgba(5, 150, 105, 0.4);
      }
      
      .onboarding-btn.primary:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(5, 150, 105, 0.5);
      }
      
      .onboarding-btn.primary.action {
        background: linear-gradient(135deg, ${EXT_COLORS.accentPurple}, #7c3aed);
        box-shadow: 0 4px 14px rgba(139, 92, 246, 0.4);
      }
      
      .onboarding-btn.secondary {
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
      }
      
      .onboarding-btn.secondary:hover {
        background: rgba(255, 255, 255, 0.15);
      }
    `;
    
    document.head.appendChild(style);
  }
}

// Export instance for global access
(window as any).Onboarding = Onboarding;
