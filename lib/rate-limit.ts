// A simple in-memory rate limiter for serverless environments.
// For true production at scale, consider a Vercel KV or Upstash Redis implementation.

type RateLimitStore = Map<string, { count: number; expiresAt: number }>;

const store: RateLimitStore = new Map();

export async function rateLimit(
  identifier: string,
  limit = 10,
  windowMs = 60000 // 1 minute
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const now = Date.now();
  const record = store.get(identifier);

  // Clean up expired records occasionally
  if (Math.random() < 0.1) {
    for (const [key, val] of store.entries()) {
      if (val.expiresAt < now) store.delete(key);
    }
  }

  if (!record || record.expiresAt < now) {
    store.set(identifier, { count: 1, expiresAt: now + windowMs });
    return { success: true, limit, remaining: limit - 1, reset: now + windowMs };
  }

  if (record.count >= limit) {
    return { success: false, limit, remaining: 0, reset: record.expiresAt };
  }

  record.count += 1;
  return { success: true, limit, remaining: limit - record.count, reset: record.expiresAt };
}
