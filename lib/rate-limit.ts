// Distributed rate limiting.
//
// In production we use Upstash Redis so the window is shared across every
// serverless instance. Without Upstash credentials (local dev, tests, CI) we
// fall back to an in-process map, which is correct for a single Node process
// but enforces nothing across a serverless fleet.

import { Redis } from '@upstash/redis';

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export interface RateLimitBackend {
  consume(identifier: string, limit: number, windowMs: number): Promise<RateLimitResult>;
}

type MemoryRecord = { count: number; expiresAt: number };
const memoryStore = new Map<string, MemoryRecord>();

const memoryBackend: RateLimitBackend = {
  async consume(identifier, limit, windowMs) {
    const now = Date.now();
    const record = memoryStore.get(identifier);

    // Opportunistically evict expired entries so a long-lived process does not
    // grow the map without bound.
    if (memoryStore.size > 512) {
      for (const [key, value] of memoryStore.entries()) {
        if (value.expiresAt < now) memoryStore.delete(key);
      }
    }

    if (!record || record.expiresAt < now) {
      memoryStore.set(identifier, { count: 1, expiresAt: now + windowMs });
      return { success: true, limit, remaining: limit - 1, reset: now + windowMs };
    }

    if (record.count >= limit) {
      return { success: false, limit, remaining: 0, reset: record.expiresAt };
    }

    record.count += 1;
    return { success: true, limit, remaining: limit - record.count, reset: record.expiresAt };
  },
};

let upstashBackend: RateLimitBackend | null | undefined;
let injectedBackend: RateLimitBackend | null = null;

/** Test-only seam. Pass null to restore normal resolution. */
export function __setRateLimitBackendForTests(backend: RateLimitBackend | null): void {
  injectedBackend = backend;
  memoryStore.clear();
}

function resolveUpstashBackend(): RateLimitBackend | null {
  if (upstashBackend !== undefined) return upstashBackend;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    upstashBackend = null;
    return null;
  }

  const redis = new Redis({ url, token });

  upstashBackend = {
    async consume(identifier, limit, windowMs) {
      // Fixed-window counter. The key embeds the window index so it expires
      // naturally and needs no cleanup pass.
      const windowIndex = Math.floor(Date.now() / windowMs);
      const key = `ratelimit:${identifier}:${windowIndex}`;
      const reset = (windowIndex + 1) * windowMs;

      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, Math.ceil(windowMs / 1000));
      }

      if (count > limit) return { success: false, limit, remaining: 0, reset };
      return { success: true, limit, remaining: limit - count, reset };
    },
  };

  return upstashBackend;
}

export async function rateLimit(
  identifier: string,
  limit = 10,
  windowMs = 60_000,
): Promise<RateLimitResult> {
  const backend = injectedBackend ?? resolveUpstashBackend() ?? memoryBackend;

  try {
    return await backend.consume(identifier, limit, windowMs);
  } catch (error) {
    // A Redis outage must not take down login or submissions. Degrade to the
    // in-process limiter rather than failing every request closed.
    console.error('[rate-limit] backend failed, falling back to in-memory', error);
    return memoryBackend.consume(identifier, limit, windowMs);
  }
}
