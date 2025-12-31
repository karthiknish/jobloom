import { getAdminDb } from "@/firebase/admin";
import { withApi } from "@/lib/api/withApi";
import { z } from "zod";
import { AuthorizationError } from "@/lib/api/errorResponse";

const profileUpdateSchema = z.object({
  name: z.string().optional(),
  photoURL: z.string().optional(),
});

// PATCH /api/app/profile - Update current user's root profile
export const PATCH = withApi({
  auth: "required",
  bodySchema: profileUpdateSchema,
}, async ({ body, user }) => {
  const uid = user!.uid;
  const db = getAdminDb();
  
  const updateData: Record<string, any> = {
    updatedAt: Date.now(),
  };

  if (body.name !== undefined) updateData.name = body.name;
  if (body.photoURL !== undefined) updateData.photoURL = body.photoURL;

  await db.collection("users").doc(uid).set(updateData, { merge: true });

  return { 
    message: 'Profile synchronized successfully',
    updated: updateData
  };
});

export { OPTIONS } from "@/lib/api/withApi";
