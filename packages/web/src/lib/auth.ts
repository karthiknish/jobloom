// Auth utilities shared across auth pages

export function getClerkErrorMessage(err: unknown, fallback: string): string {
  if (typeof err === "object" && err !== null) {
    const withArray = err as { errors?: Array<{ message?: string }> };
    const arrMsg = withArray.errors?.[0]?.message;
    if (arrMsg) return arrMsg;
    const withMsg = err as { message?: string };
    if (typeof withMsg.message === "string") return withMsg.message;
  }
  return fallback;
}

export function getRedirectUrlComplete(defaultAfterPath: string): string {
  const normalizedDefault = defaultAfterPath.replace(/\/$/, "");
  if (typeof window === "undefined") return normalizedDefault;
  const qp = new URLSearchParams(window.location.search);
  return qp.get("redirect_url") || normalizedDefault;
}

export function getAfterPath(kind: "sign-in" | "sign-up"): string {
  const env =
    kind === "sign-in"
      ? process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL
      : process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL;
  return (env || "/dashboard").replace(/\/$/, "");
}


