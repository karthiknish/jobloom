import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";
import { authenticateRequest } from "@/lib/api/auth";
import { withErrorHandling, generateRequestId } from "@/lib/api/errors";

// POST /api/app/users/[userId]/admin - Toggle admin status
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const requestId = generateRequestId();

  return withErrorHandling(async () => {
    const { userId } = await params;
    
    const auth = await authenticateRequest(request, {
      requireAdmin: true,
      loadUser: true,
    });

    if (!auth.ok) {
      return auth.response;
    }

    const { makeAdmin } = await request.json();
    
    if (typeof makeAdmin !== 'boolean') {
      return NextResponse.json(
        { error: "makeAdmin must be a boolean" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    await db.collection("users").doc(userId).update({
      isAdmin: makeAdmin,
      updatedAt: Date.now(),
      updatedBy: auth.token.uid
    });

    return NextResponse.json({
      message: `User ${makeAdmin ? 'granted' : 'removed'} admin privileges successfully`
    });
  }, {
    endpoint: '/api/app/users/[userId]/admin',
    method: 'POST',
    requestId
  });
}
