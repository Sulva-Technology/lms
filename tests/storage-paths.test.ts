import { describe, it, expect } from 'vitest';
import {
  STORAGE_BUCKETS,
  buildStoragePath,
  canWriteBucket,
  assertPathBelongsToUniversity,
  ownerIdFromPath,
} from '@/lib/storage/paths';

describe('buildStoragePath', () => {
  it('prefixes the university id and keeps the extension', () => {
    const path = buildStoragePath({
      universityId: 'uni-1',
      scope: 'submissions',
      ownerId: 'student-1',
      fileName: 'My Essay.pdf',
    });

    expect(path.startsWith('uni-1/submissions/student-1/')).toBe(true);
    expect(path.endsWith('.pdf')).toBe(true);
  });

  it('strips path traversal and unsafe characters from the file name', () => {
    const path = buildStoragePath({
      universityId: 'uni-1',
      scope: 'submissions',
      ownerId: 'student-1',
      fileName: '../../etc/pa ss wd?.txt',
    });

    expect(path).not.toContain('..');
    expect(path.split('/')).toHaveLength(4);
    expect(path).toMatch(/[a-z0-9._-]+\.txt$/i);
  });

  it('produces a unique path for repeated names', () => {
    const input = { universityId: 'u', scope: 'submissions', ownerId: 'o', fileName: 'a.pdf' };
    expect(buildStoragePath(input)).not.toBe(buildStoragePath(input));
  });
});

describe('canWriteBucket', () => {
  it('lets students write submissions but not course resources', () => {
    expect(canWriteBucket('student', STORAGE_BUCKETS.ASSIGNMENT_SUBMISSIONS)).toBe(true);
    expect(canWriteBucket('student', STORAGE_BUCKETS.COURSE_RESOURCES)).toBe(false);
  });

  it('lets lecturers write course resources, thumbnails and lesson video', () => {
    expect(canWriteBucket('lecturer', STORAGE_BUCKETS.COURSE_RESOURCES)).toBe(true);
    expect(canWriteBucket('lecturer', STORAGE_BUCKETS.LECTURE_THUMBNAILS)).toBe(true);
    expect(canWriteBucket('lecturer', STORAGE_BUCKETS.LESSON_VIDEO)).toBe(true);
  });

  it('does not let lecturers write university branding', () => {
    expect(canWriteBucket('lecturer', STORAGE_BUCKETS.UNIVERSITY_BRANDING)).toBe(false);
    expect(canWriteBucket('department_admin', STORAGE_BUCKETS.UNIVERSITY_BRANDING)).toBe(true);
  });

  it('lets every role write their own profile image', () => {
    expect(canWriteBucket('student', STORAGE_BUCKETS.PROFILE_IMAGES)).toBe(true);
    expect(canWriteBucket('super_admin', STORAGE_BUCKETS.PROFILE_IMAGES)).toBe(true);
  });

  it('rejects unknown buckets', () => {
    expect(canWriteBucket('super_admin', 'not-a-bucket')).toBe(false);
  });
});

describe('assertPathBelongsToUniversity', () => {
  it('accepts a matching prefix', () => {
    expect(() => assertPathBelongsToUniversity('uni-1/submissions/s/a.pdf', 'uni-1')).not.toThrow();
  });

  it('rejects a foreign prefix', () => {
    expect(() => assertPathBelongsToUniversity('uni-2/submissions/s/a.pdf', 'uni-1')).toThrow(
      'Storage path is outside your university.',
    );
  });

  it('rejects a prefix that merely starts with the same characters', () => {
    expect(() => assertPathBelongsToUniversity('uni-11/submissions/s/a.pdf', 'uni-1')).toThrow();
  });
});

describe('ownerIdFromPath', () => {
  it('reads the owner segment', () => {
    expect(ownerIdFromPath('uni-1/submissions/student-9/x-a.pdf')).toBe('student-9');
  });

  it('returns null for a malformed key', () => {
    expect(ownerIdFromPath('uni-1/a.pdf')).toBeNull();
  });
});
