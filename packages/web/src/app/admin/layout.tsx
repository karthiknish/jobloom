/* app/admin/layout.tsx
 * Server-side admin route protection layout.
 *
 * This layout wraps every /admin/* page and:
 * 1. Verifies the secure session cookie (__session) that the server trusts
 * 2. Uses the Firebase Admin SDK (via firebase/admin module) to load the user document when claims are missing
 * 3. Checks the isAdmin flag
 * 4. If not authenticated -> redirect to sign-in (with redirect back)
 * 5. If authenticated but not admin -> show access denied component (no client fetch flash)
 *
 * Adjust the import logic below if your firebase/admin module exposes different helpers.
 */

import { ReactNode } from "react";
import { redirect } from "next/navigation";

// Reuse existing client component for consistent styling if available
// (Safe to import a client component inside a server component tree)
import { AdminAccessDenied } from "@/components/admin/AdminAccessDenied";
import { verifySessionFromCookies } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

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
  const session = await verifySessionFromCookies();

  if (!session) {
    const currentPath = "/admin";
    redirect(`/sign-in?redirect_url=${encodeURIComponent(currentPath)}`);
  }

  const uid = session.uid;
  const hasAdminClaim =
    (session as Record<string, unknown>).admin === true ||
    (session as Record<string, unknown>).role === "admin";

  if (!hasAdminClaim) {
    const userRecord = await loadUserRecord(uid);

    if (!userRecord) {
      redirect("/dashboard");
    }

    if (!userRecord.exists) {
      redirect("/dashboard");
    }

    if (!userRecord.isAdmin) {
      return <AdminAccessDenied />;
    }
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
