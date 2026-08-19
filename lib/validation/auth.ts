import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

/** The one password rule set, so every screen that sets one agrees. */
export const strongPassword = z.string().min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Must contain at least one number');

export const resetPasswordSchema = z.object({
  password: strongPassword,
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// An invited account is created without a password, so onboarding is the one
// place it gets set. Without this the invite ends at a login screen the person
// has no credentials for. It stays optional here because someone who already
// set a password — through the recovery link, say — still has to finish their
// profile, and re-sending the same password is an error to Supabase.
export const onboardingSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  studentId: z.string().optional(),
  avatarUrl: z.string().url('Profile image must be a valid URL').optional().or(z.literal('')),
  password: strongPassword.optional().or(z.literal('')),
  confirmPassword: z.string().optional(),
}).refine((data) => !data.password || data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
