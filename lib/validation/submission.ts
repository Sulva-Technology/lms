import { z } from 'zod';

export const submitAssignmentSchema = z.object({
  content: z.string().optional(),
  fileUrls: z.array(z.string().url()).optional(),
});
