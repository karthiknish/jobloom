import { NextRequest, NextResponse } from "next/server";
import { isUserAdmin } from "@/firebase/admin";

const INTERNAL_API_SECRET =
  process.env.INTERNAL_API_SECRET ??
  (process.env.NODE_ENV === "development" ? "dev-internal-secret" : undefined);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  if (!INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const providedSecret = request.headers.get("x-internal-secret");
  if (providedSecret !== INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await params;

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  try {
    const isAdmin = await isUserAdmin(userId);
    return NextResponse.json({ isAdmin });
  } catch (error) {
    console.error("Failed to resolve admin status", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const revalidate = 0;
