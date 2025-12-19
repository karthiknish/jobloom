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
    note: "Firebase Auth limitations prevent listing all active sessions. Only the current session is shown."
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
