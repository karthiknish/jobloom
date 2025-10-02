import { NextResponse } from "next/server";
import {
  withErrorHandling,
  generateRequestId
} from "@/lib/api/errors";

// Main API route handler for /api/app
export async function GET() {
  const requestId = generateRequestId();

  return withErrorHandling(async () => {
    return NextResponse.json({
      message: "Hireall API is running",
      version: "1.0.0",
      status: "healthy",
      timestamp: Date.now(),
      endpoints: [
        "/api/app/users",
        "/api/app/jobs",
        "/api/app/applications",
        "/api/app/sponsorship",
        "/api/app/cv-analysis",
        "/api/app/admin"
      ],
      documentation: {
        baseUrl: process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://hireall.app',
        version: "1.0.0",
        status: "active"
      }
    }, {
      headers: {
        'X-Request-ID': requestId
      }
    });
  }, {
    endpoint: '/api/app',
    method: 'GET',
    requestId
  });
}

export async function POST() {
  const requestId = generateRequestId();

  return withErrorHandling(async () => {
    // For now, return a helpful error message
    return NextResponse.json({
      error: "Method not allowed",
      message: "This endpoint only supports GET requests",
      allowedMethods: ["GET"],
      timestamp: Date.now()
    }, { status: 405 });
  }, {
    endpoint: '/api/app',
    method: 'POST',
    requestId
  });
}