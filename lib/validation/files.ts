import { z } from 'zod';

export const createSignedUploadSchema = z.object({
  bucket: z.string().min(1),
  path: z.string().min(1),
  contentType: z.string().min(1).optional(),
});

export const requestSignedDownloadSchema = z.object({
  bucket: z.string().min(1),
  path: z.string().min(1),
});

export const fileMetadataSchema = z.object({
  fileName: z.string().min(1),
  fileSize: z.number().int().nonnegative(),
  fileType: z.string().min(1),
  storagePath: z.string().min(1),
  isPublic: z.boolean().default(false),
});
