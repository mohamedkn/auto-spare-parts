/**
 * In-memory rate limiter for ultra-fast performance.
 * Best used for simple protection against brute-force attacks on single instances.
 * If deploying on Serverless (e.g., Vercel) where memory is ephemeral, 
 * this provides basic per-container rate limiting without external DB latency.
 */

interface RateLimitTracker {
  count: number;
  resetAt: number;
}

const rateLimiter = new Map<string, RateLimitTracker>();
const MAX_TRACKED_KEYS = 10_000;

/**
 * Basic Rate Limiter
 * @param ip - The IP address of the client (or identifier)
 * @param limit - Max requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns boolean - True if the request is allowed, false if blocked
 */
export function checkRateLimit(ip: string, limit: number = 5, windowMs: number = 60000): boolean {
  const now = Date.now();
  const tracker = rateLimiter.get(ip);

  if (!tracker) {
    if (rateLimiter.size >= MAX_TRACKED_KEYS) {
      const oldestKey = rateLimiter.keys().next().value;
      if (oldestKey) rateLimiter.delete(oldestKey);
    }
    rateLimiter.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  // If window expired, reset
  if (now >= tracker.resetAt) {
    tracker.count = 1;
    tracker.resetAt = now + windowMs;
    return true;
  }

  // If within window, check count
  if (tracker.count >= limit) {
    return false; // Rate limited
  }

  tracker.count++;
  return true;
}

// Cleanup interval to prevent memory leaks in long-running processes
if (typeof setInterval !== 'undefined') {
  const intervalId = setInterval(() => {
    const now = Date.now();
    for (const [ip, tracker] of rateLimiter.entries()) {
      if (now > tracker.resetAt) {
        rateLimiter.delete(ip);
      }
    }
  }, 60000); // Run every 60s

  if (intervalId && typeof intervalId === 'object' && 'unref' in intervalId) {
    intervalId.unref(); // don't block exit
  }
}
