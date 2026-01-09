/**
 * Quick Notes Component for Job Cards
 * 
 * Provides inline note-taking functionality on job cards
 */

import { EXT_COLORS } from "../theme";
import { UIComponents } from "./UIComponents";
import { EnhancedJobBoardManager } from "../enhancedAddToBoard";

interface QuickNotesConfig {
  maxLength?: number;
  placeholder?: string;
  onSave?: (note: string) => void;
}

export class QuickNotes {
  private container: HTMLDivElement | null = null;
  private textarea: HTMLTextAreaElement | null = null;
  private isExpanded = false;
  private jobId: string;
  private currentNote: string;
  private config: QuickNotesConfig;
  private abortController = new AbortController();

  constructor(jobId: string, currentNote: string = "", config: QuickNotesConfig = {}) {
    this.jobId = jobId;
    this.currentNote = currentNote;
    this.config = {
      maxLength: 500,
      placeholder: "Add a quick note...",
      ...config
    };
  }

  /**
   * Create the notes button that expands to show the input
   */
  createButton(): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "hireall-quick-note-btn";
    button.style.cssText = `
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 6px 10px;
      border-radius: 6px;
      border: none;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      background: ${this.currentNote ? EXT_COLORS.warning : 'rgba(107, 114, 128, 0.8)'};
      color: #fff;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      transition: all 0.2s ease;
    `;

    const icon = this.currentNote ? "fileText" : "edit3";
    const label = this.currentNote ? "View Note" : "Add Note";
    button.innerHTML = `${UIComponents.createIcon(icon, 12, "#fff")} <span>${label}</span>`;

    button.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggle(button);
    }, { signal: this.abortController.signal });

    return button;
  }

  /**
   * Toggle the notes input panel
   */
  private toggle(button: HTMLButtonElement): void {
    if (this.isExpanded) {
      this.collapse();
    } else {
      this.expand(button);
    }
  }

  /**
   * Expand to show the notes input
   */
  private expand(button: HTMLButtonElement): void {
    if (this.container) return;

    this.isExpanded = true;

    // Create container
    this.container = document.createElement("div");
    this.container.className = "hireall-quick-notes-panel";
    this.container.style.cssText = `
      position: absolute;
      bottom: 100%;
      right: 0;
      width: 280px;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      padding: 12px;
      margin-bottom: 8px;
      z-index: 10000;
      animation: hireallSlideUp 0.2s ease;
    `;

    // Header
    const header = document.createElement("div");
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    `;
    header.innerHTML = `
      <span style="font-weight: 600; font-size: 13px; color: #1f2937;">Quick Note</span>
      <span style="font-size: 11px; color: #6b7280;">
        ${this.currentNote.length}/${this.config.maxLength}
      </span>
    `;
    this.container.appendChild(header);

    // Textarea
    this.textarea = document.createElement("textarea");
    this.textarea.className = "hireall-quick-notes-input";
    this.textarea.placeholder = this.config.placeholder!;
    this.textarea.value = this.currentNote;
    this.textarea.maxLength = this.config.maxLength!;
    this.textarea.style.cssText = `
      width: 100%;
      min-height: 80px;
      max-height: 150px;
      padding: 10px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-size: 13px;
      font-family: inherit;
      resize: vertical;
      outline: none;
      transition: border-color 0.2s ease;
      box-sizing: border-box;
    `;

    this.textarea.addEventListener("input", () => {
      this.currentNote = this.textarea!.value;
      const counter = header.querySelector("span:last-child");
      if (counter) {
        counter.textContent = `${this.currentNote.length}/${this.config.maxLength}`;
      }
    }, { signal: this.abortController.signal });

    this.textarea.addEventListener("focus", () => {
      this.textarea!.style.borderColor = EXT_COLORS.success;
    }, { signal: this.abortController.signal });

    this.textarea.addEventListener("blur", () => {
      this.textarea!.style.borderColor = "#e5e7eb";
    }, { signal: this.abortController.signal });

    this.container.appendChild(this.textarea);

    // Action buttons
    const actions = document.createElement("div");
    actions.style.cssText = `
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 10px;
    `;

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.style.cssText = `
      padding: 6px 12px;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
      background: #fff;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      color: #6b7280;
    `;
    cancelBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.collapse();
    }, { signal: this.abortController.signal });

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Save Note";
    saveBtn.style.cssText = `
      padding: 6px 12px;
      border-radius: 6px;
      border: none;
      background: linear-gradient(135deg, ${EXT_COLORS.success}, ${EXT_COLORS.greenDark});
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      color: #fff;
      box-shadow: 0 2px 8px rgba(5, 150, 105, 0.3);
    `;
    saveBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.save(button);
    }, { signal: this.abortController.signal });

    actions.appendChild(cancelBtn);
    actions.appendChild(saveBtn);
    this.container.appendChild(actions);

    // Insert into DOM
    const parent = button.parentElement;
    if (parent) {
      parent.style.position = "relative";
      parent.appendChild(this.container);
    }

    // Focus textarea
    setTimeout(() => this.textarea?.focus(), 50);

    // Close on outside click
    const closeHandler = (e: MouseEvent) => {
      if (!this.container?.contains(e.target as Node) && e.target !== button) {
        this.collapse();
      }
    };
    setTimeout(() => document.addEventListener("click", closeHandler, { signal: this.abortController.signal }), 100);
  }

  /**
   * Collapse the notes panel
   */
  private collapse(): void {
    this.abortController.abort();
    // Re-initialize for next expansion if needed
    this.abortController = new AbortController();

    if (this.container) {
      this.container.remove();
      this.container = null;
    }
    this.textarea = null;
    this.isExpanded = false;
  }

  /**
   * Save the note
   */
  private async save(button: HTMLButtonElement): Promise<void> {
    const saveBtn = this.container?.querySelector("button:last-child") as HTMLButtonElement;
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = "Saving...";
    }

    try {
      // Update via EnhancedJobBoardManager
      const manager = EnhancedJobBoardManager.getInstance();
      await manager.updateJobStatus(this.jobId, "interested", this.currentNote);

      // Update button appearance
      button.style.background = this.currentNote ? EXT_COLORS.warning : 'rgba(107, 114, 128, 0.8)';
      const icon = this.currentNote ? "fileText" : "edit3";
      const label = this.currentNote ? "View Note" : "Add Note";
      button.innerHTML = `${UIComponents.createIcon(icon, 12, "#fff")} <span>${label}</span>`;

      // Callback
      this.config.onSave?.(this.currentNote);

      UIComponents.showToast("Note saved", { type: "success" });
      this.collapse();
    } catch (error) {
      console.error("Failed to save note:", error);
      UIComponents.showToast("Failed to save note", { type: "error" });

      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = "Save Note";
      }
    }
  }
}

// Add animation keyframes
const style = document.createElement("style");
style.textContent = `
  @keyframes hireallSlideUp {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
if (!document.getElementById("hireall-quick-notes-styles")) {
  style.id = "hireall-quick-notes-styles";
  document.head.appendChild(style);
}
