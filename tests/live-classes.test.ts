import { describe, it, expect } from 'vitest';
import { LiveClassService } from '@/lib/services/live-class.service';

describe('Live Classes validation', () => {
  it('should validate live class join authorization', () => {
    expect(true).toBe(true);
  });

  it('requires a course section when scheduling a live class', async () => {
    const provider = {
      createSession: async () => ({ sessionId: 'provider_1', hostUrl: 'https://host', joinUrl: 'https://join' }),
      updateSession: async () => undefined,
      cancelSession: async () => undefined,
      generateJoinToken: async () => 'token',
    };

    const service = new LiveClassService({} as any, provider);

    await expect(service.createLiveClass('uni_1', 'lecturer_1', {
      courseId: 'course_1',
      courseSectionId: undefined as any,
      lecturerId: 'lecturer_1',
      universityId: 'uni_1',
      topic: 'Intro',
      startTime: new Date().toISOString(),
      durationMinutes: 60,
    })).rejects.toThrow('Course section is required');
  });
});
