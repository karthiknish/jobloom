/**
 * AI Request Queue
 * 
 * Manages concurrent AI requests to prevent Gemini API rate limit issues.
 * Features:
 * - Concurrency control (max simultaneous requests)
 * - Priority queue (premium users processed first)
 * - Request timeout handling
 * - Queue status monitoring
 */

// Priority levels for queue ordering
export type RequestPriority = 'high' | 'normal' | 'low';

// Queue item structure
interface QueuedRequest<T> {
  id: string;
  priority: RequestPriority;
  operation: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  timestamp: number;
  userId?: string;
  timeout?: ReturnType<typeof setTimeout>;
}

// Queue status for monitoring
export interface AIQueueStatus {
  queueLength: number;
  activeRequests: number;
  maxConcurrent: number;
  isAcceptingRequests: boolean;
  averageWaitTime: number;
  totalProcessed: number;
  totalFailed: number;
}

// Configuration
const MAX_CONCURRENT_REQUESTS = 10;
const REQUEST_TIMEOUT_MS = 60000; // 60 seconds
const MAX_QUEUE_SIZE = 100;
const PRIORITY_WEIGHTS: Record<RequestPriority, number> = {
  high: 3,
  normal: 2,
  low: 1,
};

/**
 * AI Request Queue Manager
 * 
 * Singleton class that manages all AI requests through a priority queue
 * with concurrency limiting to prevent API rate limit issues.
 */
class AIRequestQueue {
  private queue: QueuedRequest<any>[] = [];
  private activeRequests = 0;
  private isProcessing = false;
  private totalProcessed = 0;
  private totalFailed = 0;
  private waitTimes: number[] = [];
  private maxConcurrent: number;
  private isPaused = false;

  constructor(maxConcurrent: number = MAX_CONCURRENT_REQUESTS) {
    this.maxConcurrent = maxConcurrent;
  }

  /**
   * Enqueue an AI request
   * @param operation - The async operation to execute
   * @param priority - Request priority (high, normal, low)
   * @param userId - Optional user ID for tracking
   * @returns Promise that resolves when the operation completes
   */
  async enqueue<T>(
    operation: () => Promise<T>,
    priority: RequestPriority = 'normal',
    userId?: string
  ): Promise<T> {
    // Check if queue is accepting requests
    if (this.queue.length >= MAX_QUEUE_SIZE) {
      throw new AIQueueError(
        'AI service is currently overloaded. Please try again in a few moments.',
        'QUEUE_FULL'
      );
    }

    if (this.isPaused) {
      throw new AIQueueError(
        'AI service is temporarily unavailable. Please try again shortly.',
        'SERVICE_PAUSED'
      );
    }

    const requestId = this.generateRequestId();
    const timestamp = Date.now();

    return new Promise<T>((resolve, reject) => {
      const queuedRequest: QueuedRequest<T> = {
        id: requestId,
        priority,
        operation,
        resolve,
        reject,
        timestamp,
        userId,
      };

      // Set timeout for the request
      queuedRequest.timeout = setTimeout(() => {
        this.removeFromQueue(requestId);
        reject(new AIQueueError('Request timed out in queue', 'TIMEOUT'));
        this.totalFailed++;
      }, REQUEST_TIMEOUT_MS);

      // Insert into queue based on priority
      this.insertByPriority(queuedRequest);

      // Log queue status
      if (process.env.NODE_ENV === 'development') {
        console.log(`[AIQueue] Request ${requestId} queued. Queue length: ${this.queue.length}, Active: ${this.activeRequests}`);
      }

      // Start processing if not already
      this.processQueue();
    });
  }

  /**
   * Insert request into queue based on priority
   */
  private insertByPriority<T>(request: QueuedRequest<T>): void {
    const weight = PRIORITY_WEIGHTS[request.priority];
    
    // Find position to insert (higher priority first, then FIFO within same priority)
    let insertIndex = this.queue.length;
    for (let i = 0; i < this.queue.length; i++) {
      const existingWeight = PRIORITY_WEIGHTS[this.queue[i].priority];
      if (weight > existingWeight) {
        insertIndex = i;
        break;
      }
    }
    
    this.queue.splice(insertIndex, 0, request);
  }

  /**
   * Process queued requests
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      while (this.queue.length > 0 && this.activeRequests < this.maxConcurrent && !this.isPaused) {
        const request = this.queue.shift();
        if (!request) continue;

        // Clear the timeout since we're processing
        if (request.timeout) {
          clearTimeout(request.timeout);
        }

        // Track wait time
        const waitTime = Date.now() - request.timestamp;
        this.waitTimes.push(waitTime);
        if (this.waitTimes.length > 100) {
          this.waitTimes.shift(); // Keep only last 100 for average
        }

        this.activeRequests++;
        
        // Execute the operation
        this.executeRequest(request);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Execute a single request
   */
  private async executeRequest<T>(request: QueuedRequest<T>): Promise<void> {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[AIQueue] Executing request ${request.id}. Active: ${this.activeRequests}`);
      }

      const result = await request.operation();
      request.resolve(result);
      this.totalProcessed++;
    } catch (error) {
      request.reject(error instanceof Error ? error : new Error(String(error)));
      this.totalFailed++;
    } finally {
      this.activeRequests--;

      // Continue processing queue
      if (this.queue.length > 0) {
        // Small delay to prevent overwhelming the API
        setTimeout(() => this.processQueue(), 50);
      }
    }
  }

  /**
   * Remove a request from the queue (for timeout/cancellation)
   */
  private removeFromQueue(requestId: string): boolean {
    const index = this.queue.findIndex(r => r.id === requestId);
    if (index !== -1) {
      const [removed] = this.queue.splice(index, 1);
      if (removed.timeout) {
        clearTimeout(removed.timeout);
      }
      return true;
    }
    return false;
  }

  /**
   * Generate a unique request ID
   */
  private generateRequestId(): string {
    return `ai_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get current queue status
   */
  getStatus(): AIQueueStatus {
    const averageWaitTime = this.waitTimes.length > 0
      ? this.waitTimes.reduce((a, b) => a + b, 0) / this.waitTimes.length
      : 0;

    return {
      queueLength: this.queue.length,
      activeRequests: this.activeRequests,
      maxConcurrent: this.maxConcurrent,
      isAcceptingRequests: this.queue.length < MAX_QUEUE_SIZE && !this.isPaused,
      averageWaitTime: Math.round(averageWaitTime),
      totalProcessed: this.totalProcessed,
      totalFailed: this.totalFailed,
    };
  }

  /**
   * Pause queue processing (for circuit breaker integration)
   */
  pause(): void {
    this.isPaused = true;
    console.log('[AIQueue] Queue paused');
  }

  /**
   * Resume queue processing
   */
  resume(): void {
    this.isPaused = false;
    console.log('[AIQueue] Queue resumed');
    this.processQueue();
  }

  /**
   * Update max concurrent requests (for dynamic scaling)
   */
  setMaxConcurrent(max: number): void {
    this.maxConcurrent = Math.max(1, Math.min(max, 50));
    console.log(`[AIQueue] Max concurrent set to ${this.maxConcurrent}`);
    this.processQueue();
  }

  /**
   * Clear all pending requests (emergency)
   */
  clear(): void {
    for (const request of this.queue) {
      if (request.timeout) {
        clearTimeout(request.timeout);
      }
      request.reject(new AIQueueError('Queue cleared', 'QUEUE_CLEARED'));
    }
    this.queue = [];
    console.log('[AIQueue] Queue cleared');
  }
}

/**
 * Custom error class for queue-related errors
 */
export class AIQueueError extends Error {
  constructor(
    message: string,
    public code: 'QUEUE_FULL' | 'SERVICE_PAUSED' | 'TIMEOUT' | 'QUEUE_CLEARED' | 'RATE_LIMITED'
  ) {
    super(message);
    this.name = 'AIQueueError';
  }

  get retryAfter(): number {
    switch (this.code) {
      case 'QUEUE_FULL':
        return 30; // 30 seconds
      case 'SERVICE_PAUSED':
        return 60; // 60 seconds
      case 'TIMEOUT':
        return 5; // 5 seconds
      case 'RATE_LIMITED':
        return 60; // 60 seconds
      default:
        return 10;
    }
  }
}

// Singleton instance
export const aiQueue = new AIRequestQueue();

// Export class for testing
export { AIRequestQueue };
