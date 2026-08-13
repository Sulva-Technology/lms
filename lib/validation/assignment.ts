import { z } from 'zod';

export const createAssignmentSchema = z.object({
  courseSectionId: z.string().uuid(),
  title: z.string().min(2),
  description: z.string().optional(),
  dueDate: z.string().datetime(),
  totalPoints: z.number().int().min(0),
  isPublished: z.boolean().default(false),
  allowLateSubmissions: z.boolean().default(false),
  maxResubmissions: z.number().int().min(1).default(1),
});

export const updateAssignmentSchema = createAssignmentSchema.partial();
