import { z } from "zod";
import { withApi, OPTIONS } from "@/lib/api/withApi";
import { checkFirebaseHealth, getInitializationStatus } from "@/firebase/admin";
import { ServiceUnavailableError } from "@/lib/api/errorResponse";

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
  
  // For degraded status, throw ServiceUnavailableError
  if (!firebaseHealth.healthy) {
    throw new ServiceUnavailableError(
      "Firebase is unreachable or unhealthy",
      "firebase",
      60 // Retry after 60 seconds
    );
  }
  
  return detailedHealth;
});