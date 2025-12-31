import { withApi } from "@/lib/api/withApi";
import { getAdminDb } from "@/firebase/admin";

// GET /api/ai/cover-letter/history - Get cover letter history for the current user
export const GET = withApi({
  auth: 'required',
}, async ({ user }) => {
  const db = getAdminDb();
  
  try {
    const historySnapshot = await db
      .collection('users')
      .doc(user!.uid)
      .collection('coverLetters')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const history = historySnapshot.docs.map(doc => ({
      _id: doc.id,
      ...doc.data()
    }));

    return history;
  } catch (error) {
    console.error('Failed to fetch cover letter history:', error);
    throw error;
  }
});

// DELETE /api/ai/cover-letter/history - Delete a record from history
export const DELETE = withApi({
  auth: 'required',
}, async ({ user, request }) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  if (!id) {
    return { success: false, error: "Missing ID" };
  }

  const db = getAdminDb();
  await db
    .collection('users')
    .doc(user!.uid)
    .collection('coverLetters')
    .doc(id)
    .delete();

  return { success: true };
});
