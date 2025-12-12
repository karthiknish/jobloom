export const CHROME_EXTENSION_ID =
  process.env.NEXT_PUBLIC_CHROME_EXTENSION_ID?.trim() ||
  "kpjchfnohkfolgnenhpdhinehfdghgjm";

const DEFAULT_CHROME_WEBSTORE_URL = `https://chromewebstore.google.com/detail/hireall/${CHROME_EXTENSION_ID}`;

export const CHROME_EXTENSION_URL =
  process.env.NEXT_PUBLIC_CHROME_WEBSTORE_URL?.trim() || DEFAULT_CHROME_WEBSTORE_URL;

export const TWITTER_URL =
  process.env.NEXT_PUBLIC_TWITTER_URL?.trim() || "https://twitter.com/hireall";

export const LINKEDIN_URL =
  process.env.NEXT_PUBLIC_LINKEDIN_URL?.trim() ||
  "https://www.linkedin.com/company/hireall";

export const GITHUB_URL = process.env.NEXT_PUBLIC_GITHUB_URL?.trim() || "";

export function isExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}
