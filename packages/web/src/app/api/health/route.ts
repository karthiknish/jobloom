import { NextRequest, NextResponse } from "next/server";
import { applyCorsHeaders, preflightResponse } from "@/lib/api/cors";
import { checkFirebaseHealth, getInitializationStatus } from "@/firebase/admin";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const detailed = url.searchParams.get('detailed') === 'true';
  
  const basicHealth = {
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "hireall-api",
    version: "1.0.0"
  };
  
  // For simple health checks, return quickly
  if (!detailed) {
    return applyCorsHeaders(NextResponse.json(basicHealth), request);
  }
  
  // For detailed health checks, include Firebase status
  try {
    const firebaseHealth = await checkFirebaseHealth();
    const initStatus = getInitializationStatus();
    
    const detailedHealth = {
      ...basicHealth,
      status: firebaseHealth.healthy ? "ok" : "degraded",
      firebase: {
        healthy: firebaseHealth.healthy,
        latencyMs: firebaseHealth.latencyMs,
        initialized: initStatus.initialized,
        projectId: initStatus.projectId,
        error: firebaseHealth.error
      },
      environment: process.env.NODE_ENV,
      uptime: process.uptime ? Math.floor(process.uptime()) : undefined
    };
    
    const statusCode = firebaseHealth.healthy ? 200 : 503;
    return applyCorsHeaders(
      NextResponse.json(detailedHealth, { status: statusCode }),
      request
    );
  } catch (error: any) {
    return applyCorsHeaders(
      NextResponse.json({
        ...basicHealth,
        status: "error",
        error: error.message || "Health check failed"
      }, { status: 500 }),
      request
    );
  }
}

// Support CORS preflight for extension access
export async function OPTIONS(request: NextRequest) {
  return preflightResponse(request);
}