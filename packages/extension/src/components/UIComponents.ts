import { NotificationType as ToastType, DURATIONS, EASING } from "@hireall/shared";

const ICON_PATHS: Record<string, string> = {
  target: '<circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />',
  clock:
    '<circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />',
  checkCircle:
    '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14 9 11" />',
  xCircle:
    '<circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />',
  flag: '<path d="M4 15s1-1 4-4 5 5 8 2V3H4v18" />',
  clipboardPlus:
    '<rect x="8" y="7" width="8" height="13" rx="2" /><path d="M12 11v5" /><path d="M9.5 13.5h5" /><path d="M9 4h6" /><rect x="9" y="2" width="6" height="4" rx="1" />',
  info:
    '<circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><circle cx="12" cy="8" r="1" />',
  alertTriangle:
    '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />',
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />',
};

interface FloatingButtonOptions {
  id: string;
  label: string;
  icon?: string;
  onClick: () => void;
  position?: Partial<Record<"top" | "right" | "bottom" | "left", number>>;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
}

export class UIComponents {
  static createIcon(name: string, size = 16, color = "currentColor"): string {
    const path = ICON_PATHS[name] ?? ICON_PATHS.info;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
  }

  static showToast(
    message: string,
    options: { type?: ToastType; duration?: number } = {}
  ): void {
    const { type = "info", duration = 2500 } = options;
    const root = this.ensureToastRoot();

    const toast = document.createElement("div");
    toast.className = `hireall-toast hireall-toast-${type}`;
    toast.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      border-radius: var(--radius);
      font-size: 13px;
      color: #fff;
      box-shadow: var(--shadow-lg);
      animation: hireall-toast-in var(--motion-duration-fast) var(--motion-ease-out);
      background: ${this.toastBackground(type)};
    `;

    const iconName =
      type === "success" ? "checkCircle" : type === "error" ? "xCircle" : type === "warning" ? "alertTriangle" : "info";
    toast.innerHTML = `
      <span>${this.createIcon(iconName, 16)}</span>
      <span style="flex:1;">${message}</span>
      <button style="background:none;border:none;color:inherit;cursor:pointer;font-size:16px;line-height:1;">×</button>
    `;

    const remove = () => {
      toast.style.animation = `hireall-toast-out ${DURATIONS.fast}ms ${EASING.easeIn} forwards`;
      window.setTimeout(() => toast.remove(), DURATIONS.fast + 40);
    };

    toast.querySelector("button")?.addEventListener("click", remove);
    root.appendChild(toast);
    window.setTimeout(remove, duration);
  }

  static createFloatingButton(options: FloatingButtonOptions): HTMLButtonElement {
    const existing = document.getElementById(options.id) as HTMLButtonElement | null;
    if (existing) {
      existing.onclick = options.onClick;
      existing.textContent = options.label;
      if (options.icon) {
        existing.innerHTML = `${options.icon} <span>${options.label}</span>`;
      }
      existing.disabled = options.disabled ?? false;
      return existing;
    }

    const button = document.createElement("button");
    button.id = options.id;
    button.type = "button";
    button.className = "hireall-floating-button";
    button.style.cssText = this.floatingButtonStyle(options.variant);
    button.style.position = "fixed";
    button.style.zIndex = "10000";

    const position = options.position ?? { top: 140, right: 24 };
    Object.entries(position).forEach(([key, value]) => {
      if (typeof value === "number") {
        (button.style as any)[key] = `${value}px`;
      }
    });

    button.innerHTML = options.icon
      ? `${options.icon} <span>${options.label}</span>`
      : `<span>${options.label}</span>`;

    button.onclick = options.onClick;
    button.disabled = options.disabled ?? false;

    document.body.appendChild(button);
    return button;
  }

  static createBadge(text: string, variant: "default" | "success" | "warning" | "error" | "info"): HTMLElement {
    const badge = document.createElement("span");
    badge.className = "hireall-badge";
    badge.textContent = text;
    badge.style.cssText = this.badgeStyle(variant);
    return badge;
  }

  private static ensureToastRoot(): HTMLElement {
    let root = document.getElementById("hireall-toast-root");
    if (!root) {
      root = document.createElement("div");
      root.id = "hireall-toast-root";
      root.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        z-index: 10001;
      `;
      document.body.appendChild(root);
      this.injectToastAnimations();
    }
    return root;
  }

  private static injectToastAnimations(): void {
    if (document.getElementById("hireall-toast-animations")) {
      return;
    }

    const style = document.createElement("style");
    style.id = "hireall-toast-animations";
    style.textContent = `
      @keyframes hireall-toast-in {
        from { opacity: 0; transform: translateY(-6px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes hireall-toast-out {
        to { opacity: 0; transform: translateY(-6px); }
      }
    `;
    document.head.appendChild(style);
  }

  private static toastBackground(type: ToastType): string {
    switch (type) {
      case "success":
        return "var(--color-success)";
      case "warning":
        return "var(--color-warning)";
      case "error":
        return "var(--color-error)";
      default:
        return "var(--color-info)";
    }
  }

  private static floatingButtonStyle(variant: "primary" | "secondary" | "danger" = "primary"): string {
    const background =
      variant === "secondary"
        ? "var(--color-muted-foreground)"
        : variant === "danger"
        ? "var(--color-error)"
        : "var(--color-primary)";

    return `
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border-radius: 9999px;
      border: none;
      color: #fff;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: var(--shadow-lg);
      background: ${background};
      transition: transform var(--motion-duration-fast) var(--motion-ease-out), box-shadow var(--motion-duration-fast) var(--motion-ease-out);
    `;
  }

  private static badgeStyle(variant: "default" | "success" | "warning" | "error" | "info"): string {
    const colors: Record<typeof variant, { bg: string; color: string; border: string }> = {
      default: { bg: "rgba(226, 232, 240, 0.7)", color: "#1f2937", border: "rgba(15, 23, 42, 0.12)" },
      success: { bg: "rgba(5, 150, 105, 0.15)", color: "#047857", border: "rgba(4, 120, 87, 0.25)" },
      warning: { bg: "rgba(217, 119, 6, 0.18)", color: "#92400e", border: "rgba(146, 64, 14, 0.25)" },
      error: { bg: "rgba(220, 38, 38, 0.18)", color: "#991b1b", border: "rgba(153, 27, 27, 0.25)" },
      info: { bg: "rgba(2, 132, 199, 0.18)", color: "#0369a1", border: "rgba(3, 105, 161, 0.25)" },
    };

    const palette = colors[variant];
    return `
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 2px 8px;
      font-size: 11px;
      font-weight: 600;
      border-radius: 12px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      border: 1px solid ${palette.border};
      background: ${palette.bg};
      color: ${palette.color};
    `;
  }
}
