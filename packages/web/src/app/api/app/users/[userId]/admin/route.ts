import { getAdminDb } from "@/firebase/admin";
import { withApi } from "@/lib/api/withApi";
import { z } from "zod";

const adminParamsSchema = z.object({
  userId: z.string(),
});

const adminBodySchema = z.object({
  makeAdmin: z.boolean(),
});

// POST /api/app/users/[userId]/admin - Toggle admin status
export const POST = withApi({
  auth: "admin",
  paramsSchema: adminParamsSchema,
  bodySchema: adminBodySchema,
  handler: async ({ params, body, user }) => {
    const { userId } = params;
    const { makeAdmin } = body;

    const db = getAdminDb();
    await db.collection("users").doc(userId).update({
      isAdmin: makeAdmin,
      updatedAt: Date.now(),
      updatedBy: user!.uid
    });

    return {
      message: `User ${makeAdmin ? 'granted' : 'removed'} admin privileges successfully`
    };
  }
});
