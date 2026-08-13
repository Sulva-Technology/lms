import { z } from 'zod';

export const createModuleSchema = z.object({
  courseId: z.string().uuid(),
  id: z.string().uuid().optional(),
  title: z.string().min(2),
  description: z.string().optional(),
  orderIndex: z.coerce.number().int().min(0).default(0),
});

export const createLessonSchema = z.object({
  id: z.string().uuid().optional(),
  moduleId: z.string().uuid(),
  title: z.string().min(2),
  content: z.string().optional(),
  resourceType: z.enum(['document', 'video', 'link', 'other']).default('document'),
  orderIndex: z.coerce.number().int().min(0).default(0),
  isPublished: z.boolean().default(false),
  videoAssetId: z.string().uuid().optional().or(z.literal('')),
});

export const lessonMaterialSchema = z.object({
  id: z.string().uuid().optional(),
  lessonId: z.string().uuid(),
  title: z.string().min(2),
  materialType: z.enum(['file', 'link', 'video']),
  url: z.string().url().optional().or(z.literal('')),
  fileId: z.string().uuid().optional().or(z.literal('')),
  videoAssetId: z.string().uuid().optional().or(z.literal('')),
});

export const studentNoteSchema = z.object({
  lessonId: z.string().uuid(),
  content: z.string().min(1),
  videoTimestamp: z.number().int().optional(),
});

export const updateProgressSchema = z.object({
  lessonId: z.string().uuid(),
  isCompleted: z.boolean(),
});
