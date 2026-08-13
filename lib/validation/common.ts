import { z } from 'zod';

export const uuidSchema = z.string().uuid();
export const emailSchema = z.string().email();
export const passwordSchema = z.string().min(8).regex(/[A-Z]/, 'Must contain at least one uppercase letter').regex(/[0-9]/, 'Must contain at least one number');

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export const searchSchema = z.object({
  query: z.string().optional(),
});
