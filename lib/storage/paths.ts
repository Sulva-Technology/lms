import type { AuthRole } from '@/types/auth';

/**
 * Canonical storage buckets, created by migration 008. Migration 006 created a
 * competing `vui_*` set which migration 020 retires.
 */
export const STORAGE_BUCKETS = {
  PROFILE_IMAGES: 'profile-images',
  UNIVERSITY_BRANDING: 'university-branding',
  COURSE_RESOURCES: 'course-resources',
  ASSIGNMENT_SUBMISSIONS: 'assignment-submissions',
  LECTURE_THUMBNAILS: 'lecture-thumbnails',
  TRANSCRIPTS: 'transcripts',
  EXPORTS: 'exports',
  LESSON_VIDEO: 'lesson-video',
} as const;

export type StorageBucket = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

/** Path segment naming the kind of object, used as the second path segment. */
export const STORAGE_SCOPES = [
  'submissions',
  'materials',
  'avatars',
  'branding',
  'thumbnails',
  'transcripts',
  'exports',
  'video',
] as const;

export type StorageScope = (typeof STORAGE_SCOPES)[number];

/**
 * Which roles may create objects in which bucket. Read access is enforced by
 * storage RLS; this is the write-side check the Server Action applies before
 * minting a signed upload URL.
 */
const WRITE_MATRIX: Record<string, AuthRole[]> = {
  [STORAGE_BUCKETS.PROFILE_IMAGES]: ['student', 'lecturer', 'department_admin', 'admin', 'super_admin'],
  [STORAGE_BUCKETS.UNIVERSITY_BRANDING]: ['department_admin', 'admin', 'super_admin'],
  [STORAGE_BUCKETS.COURSE_RESOURCES]: ['lecturer', 'department_admin', 'admin', 'super_admin'],
  [STORAGE_BUCKETS.ASSIGNMENT_SUBMISSIONS]: ['student'],
  [STORAGE_BUCKETS.LECTURE_THUMBNAILS]: ['lecturer', 'department_admin', 'admin', 'super_admin'],
  [STORAGE_BUCKETS.TRANSCRIPTS]: ['lecturer', 'department_admin', 'admin', 'super_admin'],
  [STORAGE_BUCKETS.EXPORTS]: ['lecturer', 'department_admin', 'admin', 'super_admin'],
  [STORAGE_BUCKETS.LESSON_VIDEO]: ['lecturer', 'department_admin', 'admin', 'super_admin'],
};

export function canWriteBucket(role: AuthRole, bucket: string): boolean {
  const allowed = WRITE_MATRIX[bucket];
  return Boolean(allowed && allowed.includes(role));
}

const sanitizeFileName = (fileName: string): string => {
  const base = fileName.split(/[\\/]/).pop() || 'file';
  const cleaned = base
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[.-]+/, '');
  return cleaned.slice(0, 120) || 'file';
};

/**
 * Every object key is "{universityId}/{scope}/{ownerId}/{uuid}-{fileName}".
 * Storage RLS reads the first segment as the tenant and the third as the owner,
 * so this shape is load-bearing — do not change it without updating
 * supabase/migrations/020_storage_tenant_policies.sql.
 */
export function buildStoragePath(input: {
  universityId: string;
  scope: StorageScope | string;
  ownerId: string;
  fileName: string;
}): string {
  const unique = globalThis.crypto.randomUUID();
  return `${input.universityId}/${input.scope}/${input.ownerId}/${unique}-${sanitizeFileName(input.fileName)}`;
}

export function assertPathBelongsToUniversity(path: string, universityId: string): void {
  if (!path.startsWith(`${universityId}/`)) {
    throw new Error('Storage path is outside your university.');
  }
}

/** The owner segment of a storage key, or null when the key is malformed. */
export function ownerIdFromPath(path: string): string | null {
  const segments = path.split('/');
  return segments.length >= 4 ? segments[2] : null;
}
