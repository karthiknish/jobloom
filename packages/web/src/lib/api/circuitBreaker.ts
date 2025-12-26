/**
 * Circuit Breaker for External Services
 * 
 * Protects against cascading failures by tracking service health
 * and temporarily blocking requests to failing services.
 * 
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Service is failing, requests are blocked
 * - HALF_OPEN: Testing if service has recovered
 */

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

interface CircuitBreakerConfig {
  /** Number of failures before opening circuit */
  failureThreshold: number;
  /** Time in ms to wait before testing recovery */
  resetTimeout: number;
  /** Number of successful calls in HALF_OPEN to close circuit */
  successThreshold: number;
}

interface CircuitStats {
  failures: number;
  successes: number;
  lastFailure: number | null;
  lastSuccess: number | null;
  state: CircuitState;
  openedAt: number | null;
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeout: 30000, // 30 seconds
  successThreshold: 2,
};

// In-memory circuit state (per service)
const circuits: Map<string, CircuitStats> = new Map();
const configs: Map<string, CircuitBreakerConfig> = new Map();

/**
 * Get or initialize circuit for a service
 */
function getCircuit(serviceName: string): CircuitStats {
  if (!circuits.has(serviceName)) {
    circuits.set(serviceName, {
      failures: 0,
      successes: 0,
      lastFailure: null,
      lastSuccess: null,
      state: CircuitState.CLOSED,
      openedAt: null,
    });
  }
  return circuits.get(serviceName)!;
}

/**
 * Get config for a service
 */
function getConfig(serviceName: string): CircuitBreakerConfig {
  return configs.get(serviceName) || DEFAULT_CONFIG;
}

/**
 * Configure circuit breaker for a specific service
 */
export function configureCircuit(
  serviceName: string,
  config: Partial<CircuitBreakerConfig>
): void {
  configs.set(serviceName, { ...DEFAULT_CONFIG, ...config });
}

/**
 * Check if circuit allows request
 */
export function isCircuitOpen(serviceName: string): boolean {
  const circuit = getCircuit(serviceName);
  const config = getConfig(serviceName);

  if (circuit.state === CircuitState.CLOSED) {
    return false;
  }

  if (circuit.state === CircuitState.OPEN) {
    // Check if reset timeout has passed
    if (circuit.openedAt && Date.now() - circuit.openedAt >= config.resetTimeout) {
      circuit.state = CircuitState.HALF_OPEN;
      circuit.successes = 0;
      return false;
    }
    return true;
  }

  // HALF_OPEN - allow one request through
  return false;
}

/**
 * Record a successful call
 */
export function recordSuccess(serviceName: string): void {
  const circuit = getCircuit(serviceName);
  const config = getConfig(serviceName);

  circuit.lastSuccess = Date.now();
  circuit.successes++;

  if (circuit.state === CircuitState.HALF_OPEN) {
    if (circuit.successes >= config.successThreshold) {
      // Close the circuit
      circuit.state = CircuitState.CLOSED;
      circuit.failures = 0;
      circuit.openedAt = null;
      console.log(`[CircuitBreaker] ${serviceName}: Circuit CLOSED (recovered)`);
    }
  } else if (circuit.state === CircuitState.CLOSED) {
    // Reset failure count on success in closed state
    circuit.failures = 0;
  }
}

/**
 * Record a failed call
 */
export function recordFailure(serviceName: string): void {
  const circuit = getCircuit(serviceName);
  const config = getConfig(serviceName);

  circuit.lastFailure = Date.now();
  circuit.failures++;

  if (circuit.state === CircuitState.HALF_OPEN) {
    // Immediately open circuit on failure in HALF_OPEN
    circuit.state = CircuitState.OPEN;
    circuit.openedAt = Date.now();
    console.log(`[CircuitBreaker] ${serviceName}: Circuit OPEN (recovery failed)`);
  } else if (circuit.state === CircuitState.CLOSED) {
    if (circuit.failures >= config.failureThreshold) {
      circuit.state = CircuitState.OPEN;
      circuit.openedAt = Date.now();
      console.log(`[CircuitBreaker] ${serviceName}: Circuit OPEN (threshold reached)`);
    }
  }
}

/**
 * Get circuit status for health checks
 */
export function getCircuitStatus(serviceName: string): {
  state: CircuitState;
  failures: number;
  lastFailure: number | null;
} {
  const circuit = getCircuit(serviceName);
  return {
    state: circuit.state,
    failures: circuit.failures,
    lastFailure: circuit.lastFailure,
  };
}

/**
 * Get all circuit statuses
 */
export function getAllCircuitStatuses(): Record<string, {
  state: CircuitState;
  failures: number;
  lastFailure: number | null;
}> {
  const statuses: Record<string, any> = {};
  circuits.forEach((circuit, name) => {
    statuses[name] = {
      state: circuit.state,
      failures: circuit.failures,
      lastFailure: circuit.lastFailure,
    };
  });
  return statuses;
}

/**
 * Wrapper to execute a function with circuit breaker protection
 */
export async function withCircuitBreaker<T>(
  serviceName: string,
  fn: () => Promise<T>,
  fallback?: () => Promise<T>
): Promise<T> {
  // Check if circuit is open
  if (isCircuitOpen(serviceName)) {
    console.log(`[CircuitBreaker] ${serviceName}: Request blocked (circuit OPEN)`);
    
    if (fallback) {
      return fallback();
    }
    
    throw new Error(`Service ${serviceName} is temporarily unavailable`);
  }

  try {
    const result = await fn();
    recordSuccess(serviceName);
    return result;
  } catch (error) {
    recordFailure(serviceName);
    throw error;
  }
}

/**
 * Reset circuit for testing or manual recovery
 */
export function resetCircuit(serviceName: string): void {
  circuits.delete(serviceName);
  console.log(`[CircuitBreaker] ${serviceName}: Circuit reset`);
}

// Pre-configure circuits for known services
configureCircuit('gemini', { failureThreshold: 3, resetTimeout: 60000 });
configureCircuit('stripe', { failureThreshold: 5, resetTimeout: 30000 });
configureCircuit('firebase', { failureThreshold: 5, resetTimeout: 30000 });
configureCircuit('pexels', { failureThreshold: 5, resetTimeout: 60000 });
