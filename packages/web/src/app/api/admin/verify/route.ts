import { withApi } from "@/lib/api/withApi";

// POST /api/admin/verify - Verify if current user has admin access
export const POST = withApi({
  auth: "admin",
  rateLimit: "admin",
}, async ({ user }) => {
  return {
    success: true,
    user: {
      uid: user!.uid,
      email: user!.email,
      isAdmin: true,
    },
  };
});
