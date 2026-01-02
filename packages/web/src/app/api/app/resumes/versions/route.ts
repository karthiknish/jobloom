import { z } from "zod";
import { withApi } from "@/lib/api/withApi";
import { getAdminDb } from "@/firebase/admin";
import { AuthorizationError, NotFoundError } from "@/lib/api/errorResponse";

const resumeVersionSchema = z.object({
  data: z.unknown(),
  options: z.unknown(),
  score: z.unknown(),
  name: z.string().max(200).optional(),
});

export const GET = withApi(
  {
    auth: "required",
  },
  async ({ request, user }) => {
    const uid = user!.uid;
    const url = new URL(request.url);
    const latest = url.searchParams.get("latest") === "1";

    const db = getAdminDb();

    let query = db
      .collection("resumes")
      .where("userId", "==", uid)
      .orderBy("createdAt", "desc");

    if (latest) {
      query = query.limit(1);
    }

    const snapshot = await query.get();

    const versions = snapshot.docs.map((docSnap) => {
      const docData: any = docSnap.data();
      const createdAtMs = docData?.createdAt?.toMillis
        ? docData.createdAt.toMillis()
        : typeof docData?.createdAt === "number"
          ? docData.createdAt
          : Date.now();

      return {
        id: docSnap.id,
        userId: docData.userId,
        data: docData.data,
        options: docData.options,
        score: docData.score,
        createdAt: createdAtMs,
        name: docData.name,
      };
    });

    return latest ? { version: versions[0] ?? null } : { versions };
  }
);

export const POST = withApi(
  {
    auth: "required",
    bodySchema: resumeVersionSchema,
  },
  async ({ body, user }) => {
    const uid = user!.uid;
    const db = getAdminDb();

    const versionData = {
      userId: uid,
      data: body.data,
      options: body.options,
      score: body.score,
      name: body.name || `Revision at ${new Date().toLocaleString()}`,
      createdAt: new Date(),
    };

    const docRef = await db.collection("resumes").add(versionData);

    return {
      id: docRef.id,
    };
  }
);

export { OPTIONS } from "@/lib/api/withApi";
