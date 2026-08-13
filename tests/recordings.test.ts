import { describe, it, expect } from 'vitest';
import { createSupabaseStub } from './helpers/supabase-stub';
import { RecordingService } from '@/lib/services/recording.service';

function stub(options: { assigned: boolean; universityId?: string }) {
  return createSupabaseStub({
    live_class_recordings: [
      {
        id: 'rec1',
        university_id: options.universityId || 'uni1',
        is_published: false,
        created_by: null,
        live_classes: { course_section_id: 'sec1' },
      },
    ],
    course_lecturers: options.assigned ? [{ id: 'cl1', course_section_id: 'sec1', lecturer_id: 'lec1' }] : [],
    audit_logs: [],
  });
}

describe('RecordingService.togglePublish', () => {
  it('publishes a recording for the lecturer teaching the section', async () => {
    const { client, updated } = stub({ assigned: true });
    const service = new RecordingService(client);

    await service.togglePublish('lec1', 'uni1', 'rec1', true);

    expect(updated.live_class_recordings[0].is_published).toBe(true);
  });

  it('does not require created_by to match, since webhooks create recordings', async () => {
    const { client, updated } = stub({ assigned: true });
    const service = new RecordingService(client);

    await service.togglePublish('lec1', 'uni1', 'rec1', true);

    expect(updated.live_class_recordings[0].created_by).toBeNull();
  });

  it('rejects a lecturer who does not teach the section', async () => {
    const { client } = stub({ assigned: false });
    const service = new RecordingService(client);

    await expect(service.togglePublish('lec1', 'uni1', 'rec1', true)).rejects.toThrow(
      'Unauthorized: Lecturer not assigned to this course section',
    );
  });

  it('rejects a recording belonging to another university', async () => {
    const { client } = stub({ assigned: true, universityId: 'other-uni' });
    const service = new RecordingService(client);

    await expect(service.togglePublish('lec1', 'uni1', 'rec1', true)).rejects.toThrow('Unauthorized');
  });

  it('rejects an unknown recording', async () => {
    const { client } = stub({ assigned: true });
    const service = new RecordingService(client);

    await expect(service.togglePublish('lec1', 'uni1', 'missing', true)).rejects.toThrow('Recording not found');
  });
});
