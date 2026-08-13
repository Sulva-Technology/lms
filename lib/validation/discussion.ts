import { z } from 'zod';
import { uuidSchema } from './common';

export const createDiscussionSchema = z.object({
  courseSectionId: uuidSchema,
  title: z.string().min(2).max(150),
  body: z.string().min(5),
});

export const replyDiscussionSchema = z.object({
  discussionId: uuidSchema,
  body: z.string().min(2),
});
