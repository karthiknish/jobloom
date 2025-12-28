import { getAdminDb } from "@/firebase/admin";
import { withApi } from "@/lib/api/withApi";

// POST /api/cv/user - ensure user doc exists & return minimal user record
export const POST = withApi({
  auth: 'required',
  rateLimit: 'user-profile',
}, async ({ user }) => {
  const db = getAdminDb();
  const ref = db.collection("users").doc(user!.uid);
  const snap = await ref.get();
  
  if (!snap.exists) {
    await ref.set({
      email: user!.email ?? "",
      name: user!.name ?? "",
      createdAt: Date.now(),
      isAdmin: false,
    }, { merge: true });
  }
  
  return { _id: user!.uid };
});

// GET /api/cv/user - fetch current user doc
export const GET = withApi({
  auth: 'required',
  rateLimit: 'user-profile',
}, async ({ user }) => {
  const db = getAdminDb();
  const ref = db.collection("users").doc(user!.uid);
  const snap = await ref.get();
  
  if (!snap.exists) {
    throw new Error("User not found");
  }

  return { _id: user!.uid };
});
