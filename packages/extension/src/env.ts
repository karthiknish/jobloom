type EnvRecord = Record<string, string | undefined>;

declare const __EXTENSION_BUILD_ENV__: EnvRecord | undefined;

const buildTimeEnv: EnvRecord =
  typeof __EXTENSION_BUILD_ENV__ !== "undefined" ? __EXTENSION_BUILD_ENV__ : {};

const FALLBACKS: EnvRecord = {
  WEB_APP_URL: "https://hireall.app",
};

const runtimeEnv: EnvRecord = (() => {
  if (typeof globalThis === "undefined") return {};

  // Prefer process.env when bundled via webpack DefinePlugin
  const maybeProcess = (globalThis as any).process;
  if (maybeProcess && typeof maybeProcess === "object" && maybeProcess.env) {
    return maybeProcess.env as EnvRecord;
  }

  // Allow injecting a global override (useful for testing)
  if ((globalThis as any).__EXTENSION_ENV && typeof (globalThis as any).__EXTENSION_ENV === "object") {
    return (globalThis as any).__EXTENSION_ENV as EnvRecord;
  }

  return {};
})();

function normalizeValue(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed === "undefined" || trimmed === "null") {
    return undefined;
  }
  return trimmed;
}

export function getEnv(key: string, fallback?: string): string | undefined {
  const candidates = [runtimeEnv[key], buildTimeEnv[key]];
  const value = normalizeValue(candidates.find((v) => normalizeValue(v) !== undefined));
  if (value) {
    return value;
  }
  if (fallback !== undefined) {
    return fallback;
  }
  return FALLBACKS[key] ?? undefined;
}

export function requireEnv(key: string): string {
  const value = getEnv(key);
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}
