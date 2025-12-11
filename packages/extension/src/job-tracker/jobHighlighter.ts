import { hexToRgb } from "./icons";
import { HighlightConfig } from "./types";
import { createTransition } from "../animations";

const HIGHLIGHT_STYLE_ID = "hireall-job-highlight-style";
const DEFAULT_ACCENTS: Record<HighlightConfig["status"], string> = {
  eligible: "#2563eb",
  ineligible: "#dc2626",
  neutral: "#64748b",
};

export function highlightJobElement(element: Element, config: HighlightConfig): void {
  const container = resolveContainer(element);
  if (!container) return;

  ensureStyles();

  const accentColor = config.accentColor ?? DEFAULT_ACCENTS[config.status];
  const surfaceColor = `rgba(${hexToRgb(accentColor)}, 0.12)`;
  const borderColor = `rgba(${hexToRgb(accentColor)}, 0.6)`;

  container.classList.add("hireall-highlighted-job");
  container.style.setProperty("--hireall-accent", accentColor);
  container.style.setProperty("--hireall-surface", surfaceColor);
  container.style.setProperty("--hireall-border", borderColor);

  upsertBadge(container, config);
}

export function clearJobHighlight(element: Element): void {
  const container = resolveContainer(element);
  if (!container) return;

  container.classList.remove("hireall-highlighted-job");
  container.style.removeProperty("--hireall-accent");
  container.style.removeProperty("--hireall-surface");
  container.style.removeProperty("--hireall-border");

  const badge = container.querySelector<HTMLElement>(".hireall-highlight-badge");
  if (badge) {
    badge.remove();
  }
}

function resolveContainer(element: Element): HTMLElement | null {
  if (element instanceof HTMLElement) {
    if (element.classList.contains("hireall-highlight-card")) {
      return element;
    }

    if (element.matches("section, article, li")) {
      return element;
    }
  }

  return element.closest<HTMLElement>("section, article, li, div");
}

function ensureStyles(): void {
  if (document.getElementById(HIGHLIGHT_STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = HIGHLIGHT_STYLE_ID;
  style.textContent = `
    .hireall-highlighted-job {
      position: relative;
      border-radius: 12px;
      border: 1px solid var(--hireall-border, rgba(37, 99, 235, 0.6));
      background: var(--hireall-surface, rgba(37, 99, 235, 0.12));
      transition: ${createTransition(["border-color", "background", "box-shadow"], "fast", "easeInOut")};
      box-shadow: 0 6px 16px rgba(17, 24, 39, 0.08);
      overflow: hidden;
    }

    .hireall-highlighted-job .hireall-highlight-badge {
      position: absolute;
      top: 12px;
      right: 12px;
      padding: 6px 10px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      line-height: 1;
      background: var(--hireall-accent, #2563eb);
      color: #fff;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.18);
      z-index: 2;
    }

    .hireall-highlighted-job .hireall-highlight-badge svg {
      width: 14px;
      height: 14px;
    }

    .hireall-highlighted-job .hireall-highlight-message {
      display: block;
      margin-top: 6px;
      font-size: 12px;
      color: rgb(71, 85, 105);
    }
  `;

  document.head.appendChild(style);
}

function upsertBadge(container: HTMLElement, config: HighlightConfig): void {
  const existingBadge = container.querySelector<HTMLElement>(".hireall-highlight-badge");
  const badge = existingBadge ?? document.createElement("span");

  badge.classList.add("hireall-highlight-badge");
  badge.textContent = config.message ?? labelForStatus(config.status);

  if (config.tooltip) {
    badge.title = config.tooltip;
  }

  if (!existingBadge) {
    container.appendChild(badge);
  }
}

function labelForStatus(status: HighlightConfig["status"]): string {
  switch (status) {
    case "eligible":
      return "Sponsorship Friendly";
    case "ineligible":
      return "Not Sponsoring";
    default:
      return "Review";
  }
}
