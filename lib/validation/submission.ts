import { z } from 'zod';

export const uploadedFileSchema = z.object({
  path: z.string().min(1),
  fileName: z.string().min(1),
  fileSize: z.number().int().nonnegative(),
  fileType: z.string().min(1),
});

export const submitAssignmentSchema = z.object({
  content: z.string().optional(),
  files: z.array(uploadedFileSchema).max(10).optional(),
});

export type UploadedFileInput = z.infer<typeof uploadedFileSchema>;
