export const STORAGE_KEYS = {
  jobDraft: "hireall:draft:job",
  resumeData: "hireall:draft:resume",
  goals: "hireall:goals",
} as const;

export const LEGACY_STORAGE_KEYS = {
  jobDraft: ["hireall_job_draft"],
  resumeData: ["hireall_resume_data"],
  goals: ["hireall-goals"],
} as const;

function safeParseJson<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function readAndMigrateJsonFromStorage<T>(
  primaryKey: string,
  legacyKeys: readonly string[] = []
): T | null {
  if (typeof window === "undefined") return null;

  const primaryRaw = window.localStorage.getItem(primaryKey);
  if (primaryRaw) {
    return safeParseJson<T>(primaryRaw);
  }

  for (const legacyKey of legacyKeys) {
    const legacyRaw = window.localStorage.getItem(legacyKey);
    if (!legacyRaw) continue;

    const parsed = safeParseJson<T>(legacyRaw);
    if (parsed === null) continue;

    try {
      window.localStorage.setItem(primaryKey, JSON.stringify(parsed));
      window.localStorage.removeItem(legacyKey);
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
  if (typeof window === "undefined") return;

  window.localStorage.setItem(key, JSON.stringify(value));
  for (const legacyKey of legacyKeysToRemove) {
    window.localStorage.removeItem(legacyKey);
  }
}
