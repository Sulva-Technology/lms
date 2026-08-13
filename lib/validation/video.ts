import { z } from 'zod';

export const createVideoAssetSchema = z.object({
  lessonId: z.string().uuid().optional(),
  courseId: z.string().uuid().optional(),
  provider: z.string().min(1),
  assetId: z.string().min(1),
  playbackId: z.string().optional(),
  playbackUrl: z.string().url().optional(),
  duration: z.number().nonnegative().optional(),
  visibility: z.enum(['private', 'public', 'tenant']).default('private'),
});

export const updateVideoStatusSchema = z.object({
  status: z.enum(['processing', 'ready', 'failed', 'deleted']),
  playbackId: z.string().optional(),
  playbackUrl: z.string().url().optional(),
});

/** Links an object already uploaded to the private lesson-video bucket. */
export const attachLessonVideoSchema = z.object({
  lessonId: z.string().uuid(),
  courseId: z.string().uuid(),
  storagePath: z.string().min(1),
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().nonnegative(),
  contentType: z.string().min(1),
  durationSeconds: z.number().int().nonnegative().optional(),
});
