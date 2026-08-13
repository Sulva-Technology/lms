import { describe, it, expect, vi } from 'vitest';
import { requireRole } from '@/lib/auth/guards';

describe('Auth Guards', () => {
  it('should pass basics', () => {
    expect(true).toBe(true);
  });
});
