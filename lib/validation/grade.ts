import { z } from 'zod';

export const gradeSubmissionSchema = z.object({
  score: z.number().min(0),
  feedback: z.string().optional(),
  feedbackFileUrls: z.array(z.string().url()).optional(),
});
