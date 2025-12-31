import { withApi, z } from "@/lib/api/withApi";
import { getAdminAuth } from "@/firebase/admin";

export const runtime = "nodejs";

interface SessionInfo {
  id: string;
  device: string;
  browser: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export const GET = withApi({
  auth: 'required',
  rateLimit: 'user-settings',
}, async ({ user, request }) => {
  const adminAuth = getAdminAuth();
  await adminAuth.getUser(user!.uid);

  const sessions: SessionInfo[] = [
    {
      id: 'current',
      device: 'Current Device',
      browser: request.headers.get('user-agent') || 'Unknown Browser',
      location: 'Unknown Location',
      lastActive: new Date().toISOString(),
      isCurrent: true
    }
  ];

  return {
    sessions,
    note: "Due to Firebase Auth's privacy model, individual session tracking is limited. Only your current session is displayed here. If you suspect unauthorized access, we recommend using 'Revoke All Sessions' to secure your account immediately."
  };
});

export const DELETE = withApi({
  auth: 'required',
  rateLimit: 'user-settings',
  querySchema: z.object({
    sessionId: z.string().min(1, "Session ID is required"),
  }),
}, async ({ query }) => {
  return {
    success: false,
    message: "Individual session revocation is not supported by Firebase Auth. Use 'Revoke All Sessions' instead.",
    requestedSessionId: query.sessionId
  };
});

export { OPTIONS } from "@/lib/api/withApi";
