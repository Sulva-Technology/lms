import { z } from 'zod';
import { uuidSchema } from './common';

export const createAnnouncementSchema = z.object({
  title: z.string().min(2).max(100),
  content: z.string().min(5),
  targetScope: z.enum(['university', 'faculty', 'department', 'course_section']),
  targetId: uuidSchema.optional(), // e.g. department_id if scope is department
  isPublished: z.boolean().default(false),
});
