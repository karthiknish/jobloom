import { withApi } from "@/lib/api/withApi";
import { isUserAdmin } from "@/firebase/admin";

// GET /api/admin/check - Check if current user is admin
export const GET = withApi({
  auth: "required",
}, async ({ user }) => {
  const isAdmin = await isUserAdmin(user!.uid);

  return {
    isAdmin,
    userId: user!.uid,
    email: user!.email,
  };
});
