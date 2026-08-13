import { z } from 'zod';
import { STORAGE_SCOPES } from '@/lib/storage/paths';

/**
 * The client never chooses a storage path. It names the bucket and the scope,
 * and the Server Action builds a tenant-prefixed, owner-scoped path itself.
 */
export const createSignedUploadSchema = z.object({
  bucket: z.string().min(1),
  scope: z.enum(STORAGE_SCOPES),
  fileName: z.string().min(1).max(255),
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
