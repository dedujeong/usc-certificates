const attempts = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 10;

/**
 * In-memory rate limit for the login endpoint. Resets on process restart,
 * which is acceptable for a low-traffic internal tool with a single
 * long-running Next.js process; avoids pulling in Redis/Upstash for this.
 */
export function checkLoginRateLimit(identifier: string): boolean {
  const now = Date.now();
  const entry = attempts.get(identifier);

  if (!entry || entry.resetAt < now) {
    attempts.set(identifier, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (entry.count >= MAX_ATTEMPTS) {
    return false;
  }

  entry.count += 1;
  return true;
}
