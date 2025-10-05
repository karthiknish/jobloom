export type StorageArea = "sync" | "local";

interface ChromeStorageArea {
  get:
    | ((keys: string[] | Record<string, unknown>, callback: (items: Record<string, unknown>) => void) => void)
    | ((keys: string[] | Record<string, unknown>) => Promise<Record<string, unknown>>);
}

function cloneFallback<T extends Record<string, unknown>>(fallback: T): T {
  return { ...fallback };
}

export async function safeChromeStorageGet<T extends Record<string, unknown>>(
  area: StorageArea,
  keys: string[] | Record<string, unknown>,
  fallback: T,
  logContext: string
): Promise<T> {
  if (typeof chrome === "undefined" || !chrome.storage?.[area]) {
    return cloneFallback(fallback);
  }

  const storageArea = chrome.storage[area] as ChromeStorageArea;

  return new Promise((resolve) => {
    const resolveWith = (items: Record<string, unknown> | null) => {
      if (!items) {
        resolve(cloneFallback(fallback));
        return;
      }

      resolve({ ...fallback, ...items } as T);
    };

    try {
      let settled = false;
      const maybePromise = (storageArea.get as unknown as (
        keys: string[] | Record<string, unknown>,
        callback?: (items: Record<string, unknown>) => void
      ) => any).call(storageArea, keys, (items: Record<string, unknown>) => {
        if (settled) return;
        if (chrome.runtime?.lastError) {
          console.warn(`Hireall: ${logContext} storage read failed`, chrome.runtime.lastError.message);
          settled = true;
          resolve(cloneFallback(fallback));
          return;
        }
        settled = true;
        resolveWith(items);
      });

      if (maybePromise && typeof (maybePromise as PromiseLike<unknown>).then === "function") {
        (maybePromise as PromiseLike<Record<string, unknown>>).then(
          (items) => {
            if (settled) return;
            settled = true;
            resolveWith(items);
          },
          (error: unknown) => {
            if (settled) return;
            console.warn(`Hireall: ${logContext} storage promise rejected`, error);
            settled = true;
            resolve(cloneFallback(fallback));
          }
        );
      }
    } catch (error) {
      console.warn(`Hireall: ${logContext} storage access threw`, error);
      resolve(cloneFallback(fallback));
    }
  });
}
