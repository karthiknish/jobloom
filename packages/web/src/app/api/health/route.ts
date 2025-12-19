import { NextResponse } from "next/server";
import { z } from "zod";
import { withApi, OPTIONS } from "@/lib/api/withApi";
import { checkFirebaseHealth, getInitializationStatus } from "@/firebase/admin";

// Re-export OPTIONS for CORS preflight
export { OPTIONS };

// Zod schema for query parameters
const healthQuerySchema = z.object({
  detailed: z.enum(["true", "false"]).transform(v => v === "true").optional().default(false),
});

export const GET = withApi({
  auth: 'none',
  querySchema: healthQuerySchema,
}, async ({ query }) => {
  const basicHealth = {
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "hireall-api",
    version: "1.0.0"
  };
  
  // For simple health checks, return quickly
  if (!query.detailed) {
    return basicHealth;
  }
  
  // For detailed health checks, include Firebase status
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
  
  // For degraded status, return NextResponse with 503
  if (!firebaseHealth.healthy) {
    return NextResponse.json({
      success: true,
      data: detailedHealth,
      meta: { timestamp: Date.now() }
    }, { status: 503 });
  }
  
  return detailedHealth;
});