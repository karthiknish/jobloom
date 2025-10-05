/**
 * Rate limit status indicator for the extension
 */
export class RateLimitStatus {
  private element: HTMLElement;
  private updateInterval: ReturnType<typeof setInterval> | null = null;
  private lastUpdate = 0;

  constructor(containerSelector: string) {
  const container = document.querySelector<HTMLElement>(containerSelector);
    if (!container) {
      console.warn('Rate limit status container not found:', containerSelector);
      throw new Error(`Container ${containerSelector} not found`);
    }
    this.element = container;
    this.init();
  }

  private init() {
    this.element.innerHTML = `
      <div class="rate-limit-status">
        <div class="rate-limit-header">
          <div class="rate-limit-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 14"></polyline>
            </svg>
          </div>
          <span class="rate-limit-title">API Usage</span>
        </div>
        <div class="rate-limit-content">
          <div class="rate-limit-stats">
            <div class="rate-limit-stat">
              <span class="rate-limit-label">Requests:</span>
              <span class="rate-limit-value">--/--</span>
            </div>
            <div class="rate-limit-stat">
              <span class="rate-limit-label">Reset:</span>
              <span class="rate-limit-value">--</span>
            </div>
          </div>
          <div class="rate-limit-progress">
            <div class="rate-limit-bar">
              <div class="rate-limit-fill"></div>
            </div>
          </div>
          <div class="rate-limit-message">Checking...</div>
        </div>
      </div>
    `;

    this.addStyles();
  }

  private addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .rate-limit-status {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 8px;
        padding: 12px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 12px;
        color: #333;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        min-width: 200px;
      }

      .rate-limit-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        font-weight: 600;
      }

      .rate-limit-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
      }

      .rate-limit-stats {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
      }

      .rate-limit-stat {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
      }

      .rate-limit-label {
        font-size: 10px;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .rate-limit-value {
        font-weight: 600;
        font-size: 11px;
      }

      .rate-limit-progress {
        margin-bottom: 8px;
      }

      .rate-limit-bar {
        width: 100%;
        height: 6px;
        background: #e5e7eb;
        border-radius: 3px;
        overflow: hidden;
      }

      .rate-limit-fill {
        height: 100%;
        border-radius: 3px;
        transition: width 0.3s ease, background-color 0.3s ease;
        background: #10b981;
      }

      .rate-limit-fill.warning {
        background: #f59e0b;
      }

      .rate-limit-fill.danger {
        background: #dc2626;
      }

      .rate-limit-message {
        font-size: 11px;
        text-align: center;
        color: #666;
      }

      .rate-limit-message.warning {
        color: #d97706;
        font-weight: 500;
      }

      .rate-limit-message.danger {
        color: #dc2626;
        font-weight: 600;
      }
    `;
    document.head.appendChild(style);
  }

  update(status: {
    remaining: number;
    maxRequests: number;
    resetIn: number;
    tier?: string;
  }) {
    if (!this.element) return;

    const percentage = Math.max(0, Math.min(100, (status.remaining / status.maxRequests) * 100));
    const remainingEl = this.element.querySelector('.rate-limit-value') as HTMLElement;
    const resetEl = this.element.querySelectorAll('.rate-limit-value')[1] as HTMLElement;
    const fillEl = this.element.querySelector('.rate-limit-fill') as HTMLElement;
    const messageEl = this.element.querySelector('.rate-limit-message') as HTMLElement;

    if (remainingEl) {
      remainingEl.textContent = `${status.remaining}/${status.maxRequests}`;
    }

    if (resetEl) {
      const formatTime = (ms: number) => {
        if (ms === 0) return 'Ready';
        const seconds = Math.ceil(ms / 1000);
        if (seconds < 60) return `${seconds}s`;
        return `${Math.ceil(seconds / 60)}m`;
      };
      resetEl.textContent = formatTime(status.resetIn);
    }

    if (fillEl) {
      fillEl.style.width = `${percentage}%`;
      
      // Update color based on percentage
      fillEl.className = 'rate-limit-fill';
      if (percentage === 0) {
        fillEl.classList.add('danger');
      } else if (percentage < 20) {
        fillEl.classList.add('warning');
      }
    }

    if (messageEl) {
      // Update message color based on percentage
      messageEl.className = 'rate-limit-message';
      if (percentage === 0) {
        messageEl.classList.add('danger');
        messageEl.textContent = 'Rate limit reached. Please wait.';
      } else if (percentage < 20) {
        messageEl.classList.add('warning');
        messageEl.textContent = 'Approaching limit.';
      } else {
        messageEl.textContent = `${Math.round(percentage)}% available`;
      }
    }

    // Add tier badge if available
    if (status.tier && status.tier !== 'free') {
      this.addTierBadge(status.tier, status.maxRequests);
    }

    this.lastUpdate = Date.now();
  }

  private addTierBadge(tier: string, maxRequests: number) {
    const header = this.element.querySelector('.rate-limit-header');
    if (!header) return;

    // Remove existing badge
    const existingBadge = header.querySelector('.tier-badge');
    if (existingBadge) {
      existingBadge.remove();
    }

    const badge = document.createElement('div');
    badge.className = 'tier-badge';
    badge.textContent = `${tier.charAt(0).toUpperCase() + tier.slice(1)} (${maxRequests}/min)`;
    
    const badgeStyle = document.createElement('style');
    badgeStyle.textContent = `
      .tier-badge {
        display: inline-block;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 9px;
        font-weight: 600;
        margin-left: auto;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
    `;
    
    if (!document.querySelector('style[data-tier-badge]')) {
      badgeStyle.setAttribute('data-tier-badge', 'true');
      document.head.appendChild(badgeStyle);
    }
    
    header.appendChild(badge);
  }

  startAutoUpdate(getStatus: () => {
    remaining: number;
    maxRequests: number;
    resetIn: number;
    tier?: string;
  }): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    const initialStatus = getStatus();
    this.update(initialStatus);

    let previousStatus = initialStatus;

    this.updateInterval = setInterval(() => {
      const currentStatus = getStatus();

      if (
        currentStatus.remaining !== previousStatus.remaining ||
        currentStatus.maxRequests !== previousStatus.maxRequests ||
        currentStatus.resetIn !== previousStatus.resetIn ||
        currentStatus.tier !== previousStatus.tier
      ) {
        this.update(currentStatus);
        previousStatus = currentStatus;
      }
    }, 1000);
  }

  stopAutoUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  destroy() {
    this.stopAutoUpdate();
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}
