import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/firebase/admin";

// GET /api/app/sponsorship/companies - Get all sponsored companies (requires authentication)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);

    if (!decodedToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // For now, return empty array (no sponsored companies configured)
    // In a real implementation, this would fetch from Firestore
    const companies: any[] = [];

    return NextResponse.json(companies);
  } catch (error) {
    console.error("Error fetching sponsored companies:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/app/sponsorship/companies - Add sponsored company
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);

    if (!decodedToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const data = await request.json();

    // For now, return mock response
    console.log("Adding sponsored company:", data);
    // In a real implementation, this would save to Firestore
    const result = { companyId: "mock-company-id" };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error adding sponsored company:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}