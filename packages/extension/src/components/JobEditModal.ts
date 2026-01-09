/**
 * Job Edit Modal Component
 * 
 * Allows editing job details directly from the card
 */

import { EXT_COLORS } from "../theme";
import { UIComponents } from "./UIComponents";
import { EnhancedJobBoardManager } from "../enhancedAddToBoard";
import { put } from "../apiClient";
import { safeChromeStorageGet } from "../utils/safeStorage";

interface JobEditData {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  status?: string;
}

export class JobEditModal {
  private modal: HTMLDivElement | null = null;
  private overlay: HTMLDivElement | null = null;
  private jobData: JobEditData;
  private onSave?: (data: JobEditData) => void;
  private abortController = new AbortController();

  constructor(jobData: JobEditData, onSave?: (data: JobEditData) => void) {
    this.jobData = { ...jobData };
    this.onSave = onSave;
  }

  /**
   * Create the edit button
   */
  static createEditButton(jobData: JobEditData, onSave?: (data: JobEditData) => void): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "hireall-edit-job-btn";
    button.style.cssText = `
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 6px;
      border: none;
      font-size: 11px;
      cursor: pointer;
      background: rgba(107, 114, 128, 0.15);
      color: #6b7280;
      transition: all 0.2s ease;
    `;
    button.innerHTML = UIComponents.createIcon("edit2", 14, "#6b7280");
    button.title = "Edit job details";

    button.addEventListener("mouseenter", () => {
      button.style.background = EXT_COLORS.info;
      button.innerHTML = UIComponents.createIcon("edit2", 14, "#fff");
    });

    button.addEventListener("mouseleave", () => {
      button.style.background = "rgba(107, 114, 128, 0.15)";
      button.innerHTML = UIComponents.createIcon("edit2", 14, "#6b7280");
    });

    button.addEventListener("click", (e) => {
      e.stopPropagation();
      const modal = new JobEditModal(jobData, onSave);
      modal.show();
    });

    return button;
  }

  /**
   * Show the edit modal
   */
  show(): void {
    // Create overlay
    this.overlay = document.createElement("div");
    this.overlay.className = "hireall-modal-overlay";
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: hireallFadeIn 0.2s ease;
    `;

    // Create modal
    this.modal = document.createElement("div");
    this.modal.className = "hireall-edit-modal";
    this.modal.style.cssText = `
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      width: 400px;
      max-width: 90vw;
      max-height: 90vh;
      overflow: hidden;
      animation: hireallSlideIn 0.25s ease;
    `;

    // Header
    const header = document.createElement("div");
    header.style.cssText = `
      padding: 16px 20px;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    header.innerHTML = `
      <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #1f2937;">Edit Job Details</h3>
    `;

    const closeBtn = document.createElement("button");
    closeBtn.innerHTML = UIComponents.createIcon("x", 18, "#6b7280");
    closeBtn.style.cssText = `
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    closeBtn.addEventListener("click", () => this.close(), { signal: this.abortController.signal });
    header.appendChild(closeBtn);

    this.modal.appendChild(header);

    // Form
    const form = document.createElement("form");
    form.style.cssText = `padding: 20px;`;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.save();
    }, { signal: this.abortController.signal });

    // Form fields
    const fields = [
      { name: "title", label: "Job Title", value: this.jobData.title, required: true },
      { name: "company", label: "Company", value: this.jobData.company, required: true },
      { name: "location", label: "Location", value: this.jobData.location, required: false },
      { name: "salary", label: "Salary", value: this.jobData.salary || "", required: false },
    ];

    fields.forEach(field => {
      const group = this.createFormGroup(field.name, field.label, field.value, field.required);
      form.appendChild(group);
    });

    // Status select
    const statusGroup = document.createElement("div");
    statusGroup.style.cssText = `margin-bottom: 16px;`;
    statusGroup.innerHTML = `
      <label style="display: block; font-size: 13px; font-weight: 500; color: #374151; margin-bottom: 6px;">
        Status
      </label>
    `;

    const statusSelect = document.createElement("select");
    statusSelect.name = "status";
    statusSelect.style.cssText = `
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-size: 14px;
      background: #fff;
      color: #1f2937;
      outline: none;
      cursor: pointer;
    `;

    const statuses = [
      { value: "interested", label: "Interested" },
      { value: "applied", label: "Applied" },
      { value: "interviewing", label: "Interviewing" },
      { value: "offered", label: "Offered" },
      { value: "rejected", label: "Rejected" },
      { value: "withdrawn", label: "Withdrawn" },
    ];

    statuses.forEach(status => {
      const option = document.createElement("option");
      option.value = status.value;
      option.textContent = status.label;
      if (this.jobData.status === status.value) {
        option.selected = true;
      }
      statusSelect.appendChild(option);
    });

    statusGroup.appendChild(statusSelect);
    form.appendChild(statusGroup);

    // Actions
    const actions = document.createElement("div");
    actions.style.cssText = `
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
    `;

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.textContent = "Cancel";
    cancelBtn.style.cssText = `
      padding: 10px 20px;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      background: #fff;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      color: #6b7280;
    `;
    cancelBtn.addEventListener("click", () => this.close(), { signal: this.abortController.signal });

    const saveBtn = document.createElement("button");
    saveBtn.type = "submit";
    saveBtn.textContent = "Save Changes";
    saveBtn.style.cssText = `
      padding: 10px 20px;
      border-radius: 8px;
      border: none;
      background: linear-gradient(135deg, ${EXT_COLORS.success}, ${EXT_COLORS.greenDark});
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      color: #fff;
      box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
    `;

    actions.appendChild(cancelBtn);
    actions.appendChild(saveBtn);
    form.appendChild(actions);

    this.modal.appendChild(form);
    this.overlay.appendChild(this.modal);
    document.body.appendChild(this.overlay);

    // Close on overlay click
    this.overlay.addEventListener("click", (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    }, { signal: this.abortController.signal });

    // Close on Escape
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        this.close();
      }
    };
    document.addEventListener("keydown", escHandler, { signal: this.abortController.signal });

    // Focus first input
    const firstInput = form.querySelector("input");
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }
  }

  /**
   * Create a form group
   */
  private createFormGroup(name: string, label: string, value: string, required: boolean): HTMLDivElement {
    const group = document.createElement("div");
    group.style.cssText = `margin-bottom: 16px;`;

    const labelEl = document.createElement("label");
    labelEl.style.cssText = `
      display: block;
      font-size: 13px;
      font-weight: 500;
      color: #374151;
      margin-bottom: 6px;
    `;
    labelEl.textContent = label;
    if (required) {
      labelEl.innerHTML += ` <span style="color: #ef4444;">*</span>`;
    }

    const input = document.createElement("input");
    input.type = "text";
    input.name = name;
    input.value = value;
    input.required = required;
    input.style.cssText = `
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s ease;
      box-sizing: border-box;
    `;

    input.addEventListener("focus", () => {
      input.style.borderColor = EXT_COLORS.success;
    }, { signal: this.abortController.signal });

    input.addEventListener("blur", () => {
      input.style.borderColor = "#e5e7eb";
    }, { signal: this.abortController.signal });

    group.appendChild(labelEl);
    group.appendChild(input);

    return group;
  }

  /**
   * Save the changes
   */
  private async save(): Promise<void> {
    const form = this.modal?.querySelector("form");
    if (!form) return;

    const saveBtn = form.querySelector("button[type='submit']") as HTMLButtonElement;
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = "Saving...";
    }

    // Collect form data
    const formData = new FormData(form);
    const updatedData: JobEditData = {
      id: this.jobData.id,
      title: formData.get("title") as string,
      company: formData.get("company") as string,
      location: formData.get("location") as string,
      salary: formData.get("salary") as string,
      status: formData.get("status") as string,
    };

    try {
      // Get user ID
      const { firebaseUid, userId } = await safeChromeStorageGet("sync", ["firebaseUid", "userId"], { firebaseUid: null, userId: null }, "JobEditModal");
      const uid = firebaseUid || userId;

      if (!uid) {
        throw new Error("User not authenticated");
      }

      // Update via API
      await put(`/api/app/jobs/${this.jobData.id}`, {
        title: updatedData.title,
        company: updatedData.company,
        location: updatedData.location,
        salary: updatedData.salary,
        userId: uid,
      });

      // Update status if changed
      if (updatedData.status && updatedData.status !== this.jobData.status) {
        const manager = EnhancedJobBoardManager.getInstance();
        await manager.updateJobStatus(this.jobData.id, updatedData.status);
      }

      // Callback
      this.onSave?.(updatedData);

      UIComponents.showToast("Job updated successfully", { type: "success" });
      this.close();
    } catch (error) {
      console.error("Failed to update job:", error);
      UIComponents.showToast("Failed to update job", { type: "error" });

      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = "Save Changes";
      }
    }
  }

  /**
   * Close the modal
   */
  private close(): void {
    this.abortController.abort();
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
      this.modal = null;
    }
  }
}

// Add animation keyframes
const style = document.createElement("style");
style.textContent = `
  @keyframes hireallFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes hireallSlideIn {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(-10px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
`;
if (!document.getElementById("hireall-edit-modal-styles")) {
  style.id = "hireall-edit-modal-styles";
  document.head.appendChild(style);
}
