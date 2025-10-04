/* app/admin/layout.tsx
 * Server-side admin route protection layout.
 *
 * This layout wraps every /admin/* page and:
 * 1. Extracts the Firebase user id from the cookie (__firebase_user) set by the client auth provider
 * 2. Uses the Firebase Admin SDK (via firebase/admin module) to load the user document
 * 3. Checks the isAdmin flag
 * 4. If not authenticated -> redirect to sign-in (with redirect back)
 * 5. If authenticated but not admin -> show access denied component (no client fetch flash)
 *
 * Adjust the import logic below if your firebase/admin module exposes different helpers.
 */

import { ReactNode } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

// Reuse existing client component for consistent styling if available
// (Safe to import a client component inside a server component tree)
import { AdminAccessDenied } from "@/components/admin/AdminAccessDenied";

export const dynamic = "force-dynamic";

// Helper to extract UID from the lightweight cookie the client auth provider sets.
// The cookie only contains {"id":"<uid>"} — no token. For stronger security you may
// want to add a signed or verified ID token cookie and verify it here.
async function getUidFromCookie(): Promise<string | null> {
  const store = await cookies();
  const raw = store.get("__firebase_user")?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    const uid = typeof parsed?.id === "string" ? parsed.id : null;
    return uid || null;
  } catch {
    return null;
  }
}

// Attempt to obtain a Firestore Admin instance from the firebase/admin module.
// This is defensive: it tries multiple common export names to reduce coupling.
async function getAdminDb(): Promise<any | null> {
  try {
    const mod: any = await import("@/firebase/admin");
    // Try a list of likely exports
    const db =
      mod.getAdminDb?.() ||
      mod.getAdminFirestore?.() ||
      mod.getDb?.() ||
      mod.db ||
      mod.adminDb ||
      mod.firestore ||
      null;
    return db ?? null;
  } catch {
    return null;
  }
}

async function loadUserRecord(uid: string): Promise<{
  isAdmin: boolean;
  exists: boolean;
} | null> {
  const db = await getAdminDb();
  if (!db) return null;

  try {
    // Support either the Admin SDK style (db.collection) or modular (db.doc)
    let snap: any;
    if (typeof db.collection === "function") {
      snap = await db.collection("users").doc(uid).get();
      if (!snap.exists) {
        return { isAdmin: false, exists: false };
      }
      const data = snap.data() || {};
      return {
        isAdmin: !!data.isAdmin,
        exists: true,
      };
    } else if (typeof db.doc === "function") {
      // Fallback path (if someone attached admin Firestore differently)
      snap = await db.doc(`users/${uid}`).get();
      if (!snap.exists) {
        return { isAdmin: false, exists: false };
      }
      const data = snap.data() || {};
      return {
        isAdmin: !!data.isAdmin,
        exists: true,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const uid = await getUidFromCookie();

  // No UID -> not signed in
  if (!uid) {
    const currentPath = "/admin";
    redirect(`/sign-in?redirect_url=${encodeURIComponent(currentPath)}`);
  }

  // Load user record from Firestore (server-side)
  const userRecord = await loadUserRecord(uid);

  // If we cannot load user OR user record missing, push them to dashboard (or sign-in)
  if (!userRecord) {
    // Could also redirect to /sign-in, but a silent redirect to dashboard is friendlier
    redirect("/dashboard");
  }

  // If user doc exists but not admin -> show access denied UI (no client flicker)
  if (!userRecord.isAdmin) {
    // Optionally: redirect("/dashboard"); instead of rendering a component.
    return <AdminAccessDenied />;
  }

  // All good — render children (admin pages)
  return <>{children}</>;
}

/*
 * Optional: You can enhance security further by:
 * - Adding a verified ID token (Firebase Admin verifyIdToken) in a secure cookie
 * - Periodically re-validating admin status with caching headers disabled
 * - Logging unauthorized access attempts (headers().get('x-forwarded-for'))
 *
 * Since we export dynamic = 'force-dynamic', each request will evaluate auth status freshly.
 */
