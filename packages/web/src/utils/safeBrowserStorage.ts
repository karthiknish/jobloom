export function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function tryGetStorage(kind: "local" | "session"): Storage | null {
  if (!isBrowser()) return null;

  try {
    const storage = kind === "local" ? window.localStorage : window.sessionStorage;
    // In some restricted contexts, merely accessing the property can throw.
    if (!storage) return null;
    return storage;
  } catch {
    return null;
  }
}

export function safeLocalStorageGet(key: string): string | null {
  const storage = tryGetStorage("local");
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

export function safeLocalStorageSet(key: string, value: string): boolean {
  const storage = tryGetStorage("local");
  if (!storage) return false;
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function safeLocalStorageRemove(key: string): boolean {
  const storage = tryGetStorage("local");
  if (!storage) return false;
  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function safeSessionStorageGet(key: string): string | null {
  const storage = tryGetStorage("session");
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSessionStorageSet(key: string, value: string): boolean {
  const storage = tryGetStorage("session");
  if (!storage) return false;
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function safeSessionStorageClear(): boolean {
  const storage = tryGetStorage("session");
  if (!storage) return false;
  try {
    storage.clear();
    return true;
  } catch {
    return false;
  }
}
