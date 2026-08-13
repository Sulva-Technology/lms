import { z } from 'zod';

export const notificationSchema = z.object({
  title: z.string().min(2),
  message: z.string().min(2),
  type: z.enum(['system', 'course', 'assignment', 'grade', 'message']),
  linkUrl: z.string().optional(),
});
