import { NextResponse } from "next/server";

// Main API route handler for /api/app
export async function GET() {
  return NextResponse.json({
    message: "Jobloom API is running",
    version: "1.0.0",
    endpoints: [
      "/api/app/users",
      "/api/app/jobs",
      "/api/app/applications",
      "/api/app/sponsorship",
      "/api/app/cv-analysis",
      "/api/app/admin"
    ]
  });
}

export async function POST() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}