import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // Temporarily disabled - Stripe integration coming soon
  return NextResponse.json(
    { error: "Stripe webhooks are not yet configured" },
    { status: 503 }
  );
}
