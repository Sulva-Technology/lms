import { describe, expect, it } from 'vitest';
import { onboardingSchema } from '@/lib/validation/auth';

describe('onboarding validation', () => {
  it('ignores client-submitted role and university fields', () => {
    const parsed = onboardingSchema.parse({
      firstName: 'Ada',
      lastName: 'Lovelace',
      studentId: 'VUI/2026/0001',
      role: 'super_admin',
      universityId: '00000000-0000-0000-0000-000000000001',
    });

    expect(parsed).toEqual({
      firstName: 'Ada',
      lastName: 'Lovelace',
      studentId: 'VUI/2026/0001',
    });
  });
});
