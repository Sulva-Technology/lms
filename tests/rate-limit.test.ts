import { describe, it, expect, afterEach } from 'vitest';
import { rateLimit, __setRateLimitBackendForTests } from '@/lib/rate-limit';

afterEach(() => __setRateLimitBackendForTests(null));

describe('rateLimit', () => {
  it('allows requests under the limit and decrements remaining', async () => {
    const first = await rateLimit('user:a', 3, 60_000);
    const second = await rateLimit('user:a', 3, 60_000);

    expect(first.success).toBe(true);
    expect(first.remaining).toBe(2);
    expect(second.remaining).toBe(1);
  });

  it('blocks once the limit is reached', async () => {
    await rateLimit('user:b', 2, 60_000);
    await rateLimit('user:b', 2, 60_000);
    const third = await rateLimit('user:b', 2, 60_000);

    expect(third.success).toBe(false);
    expect(third.remaining).toBe(0);
  });

  it('keeps identifiers isolated', async () => {
    await rateLimit('user:c', 1, 60_000);
    const other = await rateLimit('user:d', 1, 60_000);
    expect(other.success).toBe(true);
  });

  it('delegates to the injected backend when one is configured', async () => {
    const seen: string[] = [];
    __setRateLimitBackendForTests({
      async consume(identifier, limit, windowMs) {
        seen.push(`${identifier}:${limit}:${windowMs}`);
        return { success: false, limit, remaining: 0, reset: 123 };
      },
    });

    const result = await rateLimit('user:e', 5, 1000);
    expect(seen).toEqual(['user:e:5:1000']);
    expect(result.success).toBe(false);
    expect(result.reset).toBe(123);
  });

  it('falls back to the in-memory limiter when the backend throws', async () => {
    __setRateLimitBackendForTests({
      async consume() {
        throw new Error('redis unavailable');
      },
    });

    const result = await rateLimit('user:f', 3, 60_000);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(2);
  });
});
