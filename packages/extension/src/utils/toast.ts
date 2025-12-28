import { NotificationOptions as ToastOptions } from "@hireall/shared";
import { createSVGString } from "./icons";

export type { ToastOptions };

export function showToast(
  message: string,
  opts: ToastOptions = {}
): void {
  const { type = "info", duration = 3000, action } = opts;
  const root = document.getElementById("toast-root");
  if (!root) return;

  // Remove existing toasts of the same type to avoid stacking
  const existingToasts = root.querySelectorAll<HTMLElement>(`.toast.${type}`);
  existingToasts.forEach((toast) => {
    toast.style.animation = "toast-out 150ms ease-in forwards";
    setTimeout(() => toast.remove(), 160);
  });
  
  const el = document.createElement("div");
  el.className = `toast ${type} animate-slide-in-down`;
  
  const icon =
    type === "success"
      ? createSVGString("checkCircle")
      : type === "warning"
      ? createSVGString("alertTriangle")
      : type === "error"
      ? createSVGString("xCircle")
      : createSVGString("bell");
      
  const actionHtml = action ? `<button class="toast-action" data-action="true">${action.label}</button>` : '';
  
  el.innerHTML = `
    <span class="icon">${icon}</span>
    <div class="message">${message}</div>
    ${actionHtml}
    <button class="close" aria-label="Close">×</button>
  `;
  
  const remove = () => {
    el.classList.remove('animate-slide-in-down');
    el.classList.add('animate-slide-out-up');
    setTimeout(() => el.remove(), 300);
  };
  
  el.querySelector(".close")?.addEventListener("click", remove);
  
  if (action) {
    el.querySelector(".toast-action")?.addEventListener("click", () => {
      action.onClick();
      remove();
    });
  }
  
  root.appendChild(el);
  setTimeout(remove, duration);
}
