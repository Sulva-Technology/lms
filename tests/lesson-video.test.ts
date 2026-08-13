import { describe, it, expect } from 'vitest';
import { createSupabaseStub } from './helpers/supabase-stub';
import { VideoAssetService } from '@/lib/services/video.service';

function stub(options: { assigned: boolean; existingVideo?: boolean }) {
  return createSupabaseStub({
    lessons: [{ id: 'lesson1', course_modules: { course_id: 'course1' }, video_asset_id: null }],
    course_sections: [{ id: 'sec1', course_id: 'course1' }],
    course_lecturers: options.assigned ? [{ id: 'cl1', course_section_id: 'sec1', lecturer_id: 'lec1' }] : [],
    video_assets: options.existingVideo
      ? [{ id: 'old', lesson_id: 'lesson1', storage_path: 'uni1/video/lec1/old.mp4' }]
      : [],
  });
}

const attachInput = {
  universityId: 'uni1',
  uploaderId: 'lec1',
  lessonId: 'lesson1',
  courseId: 'course1',
  storagePath: 'uni1/video/lec1/new.mp4',
  fileName: 'new.mp4',
  fileSize: 2048,
  contentType: 'video/mp4',
};

describe('VideoAssetService.lecturerOwnsLesson', () => {
  it('is true when the lecturer teaches a section of the owning course', async () => {
    const { client } = stub({ assigned: true });
    const service = new VideoAssetService(client);
    expect(await service.lecturerOwnsLesson('lesson1', 'lec1')).toBe(true);
  });

  it('is false when the lecturer teaches nothing on that course', async () => {
    const { client } = stub({ assigned: false });
    const service = new VideoAssetService(client);
    expect(await service.lecturerOwnsLesson('lesson1', 'lec1')).toBe(false);
  });

  it('is false for a lesson that does not exist', async () => {
    const { client } = stub({ assigned: true });
    const service = new VideoAssetService(client);
    expect(await service.lecturerOwnsLesson('missing', 'lec1')).toBe(false);
  });
});

describe('VideoAssetService.attachLessonVideo', () => {
  it('records the storage path and links the lesson', async () => {
    const { client, inserted, updated } = stub({ assigned: true });
    const service = new VideoAssetService(client);

    const asset = await service.attachLessonVideo(attachInput);

    expect(inserted.video_assets[0]).toMatchObject({
      provider: 'supabase',
      storage_path: 'uni1/video/lec1/new.mp4',
      status: 'ready',
      visibility: 'private',
    });
    expect(updated.lessons[0].video_asset_id).toBe(asset.id);
  });

  it('replaces an existing video instead of stacking assets', async () => {
    const stubbed = stub({ assigned: true, existingVideo: true });
    const service = new VideoAssetService(stubbed.client);

    await service.attachLessonVideo(attachInput);

    expect(stubbed.deleted.video_assets).toHaveLength(1);
    expect(stubbed.tables.video_assets).toHaveLength(1);
    expect(stubbed.tables.video_assets[0].storage_path).toBe('uni1/video/lec1/new.mp4');
  });
});

describe('VideoAssetService.removeLessonVideo', () => {
  it('clears both the asset row and the lesson link', async () => {
    const stubbed = stub({ assigned: true, existingVideo: true });
    const service = new VideoAssetService(stubbed.client);

    await service.removeLessonVideo('lesson1');

    expect(stubbed.tables.video_assets).toHaveLength(0);
    expect(stubbed.updated.lessons[0].video_asset_id).toBeNull();
  });
});
