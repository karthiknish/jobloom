/**
 * Company name utilities
 * Normalization, legal suffix stripping, placeholder detection
 */

export function normalizeCompanyName(raw: string): string {
  if (!raw) return "";

  let text = raw.replace(/\s+/g, " ").trim();

  // Common LinkedIn patterns: "Company · ..." or "Company • ..." or multi-line blobs.
  for (const sep of ["\n", " · ", " • ", " | ", " – ", " — ", " ·"]) {
    const idx = text.indexOf(sep);
    if (idx > 0) {
      text = text.slice(0, idx).trim();
    }
  }

  // Remove trailing punctuation that often sneaks in from cards.
  text = text.replace(/[\s\-–—|•·,:;]+$/g, "").trim();

  return text;
}

export function stripLegalSuffixes(name: string): string {
  let text = normalizeCompanyName(name);
  if (!text) return "";

  // Strip a single trailing legal suffix (conservative; keep main name intact).
  text = text.replace(
    /\s+(?:inc\.?|incorporated|ltd\.?|limited|llc|llp|lp|plc|gmbh|ag|s\.a\.?|sa|bv|b\.v\.?|pte\.?\s*ltd\.?|pty\.?\s*ltd\.?)$/i,
    ""
  );

  return text.trim();
}

export function isLikelyPlaceholderCompany(name: string): boolean {
  const normalized = normalizeCompanyName(name).toLowerCase();
  if (!normalized) return true;

  if (normalized === "unknown company") return true;

  // Common placeholders when recruiters hide company identity.
  const placeholders = [
    "confidential",
    "stealth",
    "undisclosed",
    "not disclosed",
    "private",
    "n/a",
    "na",
    "tbd",
    "not specified",
  ];

  return placeholders.some((p) => normalized === p || normalized.includes(p));
}

export function buildCompanyQueryCandidates(input: string): string[] {
  const base = normalizeCompanyName(input);
  if (!base) return [];

  const candidates: string[] = [base];

  const withoutSuffix = stripLegalSuffixes(base);
  if (withoutSuffix && withoutSuffix.toLowerCase() !== base.toLowerCase()) {
    candidates.push(withoutSuffix);
  }

  // Ensure uniqueness while preserving order.
  const seen = new Set<string>();
  return candidates.filter((c) => {
    const key = c.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
