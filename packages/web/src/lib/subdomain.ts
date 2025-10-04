const RESERVED_NAMES = new Set([
  "www",
  "app",
  "admin",
  "api",
  "support",
  "help",
  "blog",
  "cdn",
  "static",
  "assets",
  "portal",
  "hireall",
  "dev",
  "stage",
  "test",
]);

export const SUBDOMAIN_LENGTH = {
  min: 3,
  max: 32,
} as const;

export function normalizeSubdomain(value: string): string {
  if (!value) return "";
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

export function validateSubdomain(name: string): string | null {
  if (!name) return "Enter a subdomain";
  if (name.length < SUBDOMAIN_LENGTH.min) return `Too short (min ${SUBDOMAIN_LENGTH.min} characters)`;
  if (name.length > SUBDOMAIN_LENGTH.max) return `Too long (max ${SUBDOMAIN_LENGTH.max} characters)`;
  if (!/^[a-z0-9-]+$/.test(name)) return "Use lowercase letters, numbers, hyphen";
  if (name.startsWith("-") || name.endsWith("-")) return "Cannot start or end with hyphen";
  if (name.includes("--")) return "No consecutive hyphens";
  if (/^[0-9]+$/.test(name)) return "Cannot be only numbers";
  if (RESERVED_NAMES.has(name)) return "That name is reserved";
  return null;
}

export function isReservedSubdomain(name: string): boolean {
  return RESERVED_NAMES.has(name);
}

export function getSubdomainSuggestions(context: { email?: string | null; displayName?: string | null }): string[] {
  const candidates = [
    context.displayName ?? "",
    context.email ? context.email.split("@")[0] : "",
    `hire-${Math.random().toString(36).slice(2, 8)}`,
  ];

  const normalized = candidates
    .map((candidate) => normalizeSubdomain(candidate))
    .filter(Boolean) as string[];

  return Array.from(new Set(normalized)).filter((value) => !isReservedSubdomain(value)).slice(0, 4);
}

export function hydrateSubdomain(input: string): { normalized: string; error: string | null } {
  const normalized = normalizeSubdomain(input);
  return { normalized, error: validateSubdomain(normalized) };
}
