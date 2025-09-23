import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // Temporarily disabled - Stripe integration coming soon
  return NextResponse.json(
    {
      error: "Stripe integration is currently being set up. Please check back soon!",
      message: "Premium subscriptions will be available shortly."
    },
    { status: 503 }
  );
}
