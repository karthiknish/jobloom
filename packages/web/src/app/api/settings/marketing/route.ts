import { getAdminDb } from "@/firebase/admin";
import { withApi, z, OPTIONS } from "@/lib/api/withApi";

export { OPTIONS };

const marketingUpdateSchema = z.object({
  marketingEmails: z.boolean(),
});

export const PUT = withApi({
  auth: 'required',
  bodySchema: marketingUpdateSchema,
}, async ({ user, body }) => {
  const { marketingEmails } = body;
  const db = getAdminDb();
  const userRef = db.collection('users').doc(user!.uid);

  // Update the user's email preferences in Firestore
  await userRef.set({
    emailPreferences: {
      marketing: marketingEmails,
      updatedAt: new Date().toISOString()
    },
    updatedAt: new Date().toISOString()
  }, { merge: true });

  // Also update the preferences collection for consistency
  await db.collection('preferences').doc(user!.uid).set({
    marketingEmails,
    updatedAt: new Date().toISOString()
  }, { merge: true });

  return {
    success: true,
    marketingEmails
  };
});

export const GET = withApi({
  auth: 'required',
}, async ({ user }) => {
  const db = getAdminDb();
  const userDoc = await db.collection('users').doc(user!.uid).get();
  const userData = userDoc.data();

  const marketingEmails = userData?.emailPreferences?.marketing ?? true;

  return {
    marketingEmails
  };
});
