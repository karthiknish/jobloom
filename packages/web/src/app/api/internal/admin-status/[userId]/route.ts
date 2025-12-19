import { NextRequest, NextResponse } from "next/server";
import { isUserAdmin } from "@/firebase/admin";
import { withApi } from "@/lib/api/withApi";
import { z } from "zod";

const INTERNAL_API_SECRET =
  process.env.INTERNAL_API_SECRET ??
  (process.env.NODE_ENV === "development" ? "dev-internal-secret" : undefined);

const userParamsSchema = z.object({
  userId: z.string(),
});

export const GET = withApi({
  auth: "none",
  paramsSchema: userParamsSchema,
}, async ({ request, params }) => {
  if (!INTERNAL_API_SECRET) {
    throw new Error("Server misconfigured");
  }

  const providedSecret = request.headers.get("x-internal-secret");
  if (providedSecret !== INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = params;

  const isAdmin = await isUserAdmin(userId);
  return { isAdmin };
});

export const revalidate = 0;
