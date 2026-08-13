import { z } from 'zod';

export const createGradeItemSchema = z.object({
  courseSectionId: z.string().uuid(),
  name: z.string().min(2),
  maxScore: z.number().positive(),
  weight: z.number().min(0).max(100),
});
