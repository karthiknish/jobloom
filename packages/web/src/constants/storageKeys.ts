import { safeParseJson, safeLocalStorageGet, safeLocalStorageSet, safeLocalStorageRemove } from "@hireall/shared";

export const STORAGE_KEYS = {
  jobDraft: "hireall:draft:job",
  resumeData: "hireall:draft:resume",
  resumeDraft: "hireall:draft:resume-v2",
  aiResumeDraft: "hireall:draft:ai-resume",
  coverLetterDraft: "hireall:draft:cover-letter",
  resumeBuilderTab: "hireall:ui:resume-builder-tab",
  careerToolsSection: "hireall:ui:career-tools-section",
  careerToolsResumeMode: "hireall:ui:career-tools-resume-mode",
  careerToolsCvTab: "hireall:ui:career-tools-cv-tab",
  careerToolsCoverLetterMode: "hireall:ui:career-tools-cover-letter-mode",
  goals: "hireall:goals",
} as const;

export const LEGACY_STORAGE_KEYS = {
  jobDraft: ["hireall_job_draft"],
  resumeData: ["hireall_resume_data"],
  resumeDraft: [],
  aiResumeDraft: [],
  coverLetterDraft: [],
  resumeBuilderTab: [],
  careerToolsSection: [],
  careerToolsResumeMode: [],
  careerToolsCvTab: [],
  careerToolsCoverLetterMode: [],
  goals: ["hireall-goals"],
} as const;

export function readAndMigrateJsonFromStorage<T>(
  primaryKey: string,
  legacyKeys: readonly string[] = []
): T | null {
  const primaryRaw = safeLocalStorageGet(primaryKey);
  if (primaryRaw) {
    return safeParseJson<T>(primaryRaw);
  }

  for (const legacyKey of legacyKeys) {
    const legacyRaw = safeLocalStorageGet(legacyKey);
    if (!legacyRaw) continue;

    const parsed = safeParseJson<T>(legacyRaw);
    if (parsed === null) continue;

    try {
      safeLocalStorageSet(primaryKey, JSON.stringify(parsed));
      safeLocalStorageRemove(legacyKey);
    } catch {
      // Ignore migration errors; still return parsed value.
    }

    return parsed;
  }

  return null;
}

export function writeJsonToStorage(
  key: string,
  value: unknown,
  legacyKeysToRemove: readonly string[] = []
) {
  safeLocalStorageSet(key, JSON.stringify(value));
  for (const legacyKey of legacyKeysToRemove) {
    safeLocalStorageRemove(legacyKey);
  }
}
