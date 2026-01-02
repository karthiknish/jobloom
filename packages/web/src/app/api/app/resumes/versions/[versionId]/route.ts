import { withApi } from "@/lib/api/withApi";
import { getAdminDb } from "@/firebase/admin";
import { AuthorizationError, NotFoundError } from "@/lib/api/errorResponse";

export const DELETE = withApi(
  {
    auth: "required",
  },
  async ({ params, user }) => {
    const uid = user!.uid;
    const db = getAdminDb();

    const versionId = params.versionId;
    if (!versionId) {
      throw new NotFoundError("Resume version not found");
    }

    const docRef = db.collection("resumes").doc(versionId);
    const snap = await docRef.get();

    if (!snap.exists) {
      // Idempotent delete
      return { ok: true };
    }

    const data: any = snap.data();
    if (data?.userId !== uid) {
      throw new AuthorizationError("You don't have permission to delete this version");
    }

    await docRef.delete();

    return { ok: true };
  }
);

export { OPTIONS } from "@/lib/api/withApi";
