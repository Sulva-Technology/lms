import { z } from 'zod';

export const createLiveClassSchema = z.object({
  courseId: z.string().uuid(),
  courseSectionId: z.string().uuid(),
  topic: z.string().min(2),
  description: z.string().optional(),
  startTime: z.string().datetime(),
  durationMinutes: z.number().int().min(15).max(300),
  isRecordingEnabled: z.boolean().default(false),
  isWaitingRoomEnabled: z.boolean().default(false),
  joinBeforeHost: z.boolean().default(false),
  trackingRule: z.enum(['duration', 'join']).default('duration'),
  attendanceThresholdPercent: z.number().int().min(1).max(100).default(75),
});

export const updateLiveClassSchema = createLiveClassSchema.partial();
