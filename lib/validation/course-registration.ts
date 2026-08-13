import { z } from 'zod';

export const submitRegistrationSchema = z.object({
  semesterId: z.string().uuid(),
  courseSectionIds: z.array(z.string().uuid()).min(1, 'Select at least one course'),
});

export const adminApprovalSchema = z.object({
  registrationId: z.string().uuid(),
  status: z.enum(['approved', 'rejected', 'overridden']),
  notes: z.string().optional(),
});

export const addDropSchema = z.object({
  registrationId: z.string().uuid(),
  action: z.enum(['add', 'drop']),
  courseSectionId: z.string().uuid(),
});
