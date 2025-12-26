import { z } from "zod";
import { withApi, OPTIONS } from "@/lib/api/withApi";
import { checkFirebaseHealth, getInitializationStatus } from "@/firebase/admin";
import { ServiceUnavailableError } from "@/lib/api/errorResponse";
import { getAllCircuitStatuses, CircuitState } from "@/lib/api/circuitBreaker";

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
  
  // For detailed health checks, include Firebase status and circuit breakers
  const firebaseHealth = await checkFirebaseHealth();
  const initStatus = getInitializationStatus();
  const circuitStatuses = getAllCircuitStatuses();
  
  // Count open circuits
  const openCircuits = Object.entries(circuitStatuses)
    .filter(([_, status]) => status.state === CircuitState.OPEN)
    .map(([name]) => name);
  
  // Determine overall status
  let overallStatus = "ok";
  if (!firebaseHealth.healthy) {
    overallStatus = "degraded";
  } else if (openCircuits.length > 0) {
    overallStatus = "partial";
  }
  
  const detailedHealth = {
    ...basicHealth,
    status: overallStatus,
    firebase: {
      healthy: firebaseHealth.healthy,
      latencyMs: firebaseHealth.latencyMs,
      initialized: initStatus.initialized,
      projectId: initStatus.projectId,
      error: firebaseHealth.error
    },
    circuits: {
      statuses: circuitStatuses,
      openCircuits,
      allHealthy: openCircuits.length === 0
    },
    environment: process.env.NODE_ENV,
    uptime: process.uptime ? Math.floor(process.uptime()) : undefined
  };
  
  // For degraded status (Firebase down), throw ServiceUnavailableError
  if (!firebaseHealth.healthy) {
    throw new ServiceUnavailableError(
      "Firebase is unreachable or unhealthy",
      "firebase",
      60 // Retry after 60 seconds
    );
  }
  
  return detailedHealth;
});