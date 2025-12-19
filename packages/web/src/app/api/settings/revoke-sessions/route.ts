import { withApi } from "@/lib/api/withApi";
import { getAdminAuth } from "@/firebase/admin";

export const runtime = "nodejs";

export const POST = withApi({
  auth: 'required',
  rateLimit: 'user-settings',
}, async ({ user }) => {
  const auth = getAdminAuth();
  await auth.revokeRefreshTokens(user!.uid);

  return {
    success: true,
    message: "All active sessions have been revoked. Some devices may take up to a minute to sign out.",
  };
});

export { OPTIONS } from "@/lib/api/withApi";
