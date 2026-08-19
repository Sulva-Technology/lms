import { describe, expect, it } from 'vitest';
import { onboardingSchema } from '@/lib/validation/auth';

const validPassword = 'Correct1Horse';

describe('onboarding validation', () => {
  it('ignores client-submitted role and university fields', () => {
    const parsed = onboardingSchema.parse({
      firstName: 'Ada',
      lastName: 'Lovelace',
      studentId: 'SULVA/2026/0001',
      password: validPassword,
      confirmPassword: validPassword,
      role: 'super_admin',
      universityId: '00000000-0000-0000-0000-000000000001',
    });

    expect(parsed).toEqual({
      firstName: 'Ada',
      lastName: 'Lovelace',
      studentId: 'SULVA/2026/0001',
      password: validPassword,
      confirmPassword: validPassword,
    });
  });

  it('accepts an omitted password, for an account that already has one', () => {
    const result = onboardingSchema.safeParse({
      firstName: 'Ada',
      lastName: 'Lovelace',
    });

    expect(result.success).toBe(true);
  });

  it('rejects a password that does not meet the shared strength rules', () => {
    const result = onboardingSchema.safeParse({
      firstName: 'Ada',
      lastName: 'Lovelace',
      password: 'password',
      confirmPassword: 'password',
    });

    expect(result.success).toBe(false);
  });

  it('rejects a mismatched confirmation', () => {
    const result = onboardingSchema.safeParse({
      firstName: 'Ada',
      lastName: 'Lovelace',
      password: validPassword,
      confirmPassword: `${validPassword}x`,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['confirmPassword']);
    }
  });
});
