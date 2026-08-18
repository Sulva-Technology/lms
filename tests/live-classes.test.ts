import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { LiveClassService } from '@/lib/services/live-class.service';
import { createSupabaseStub } from './helpers/supabase-stub';

describe('Live Classes validation', () => {
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

  it('grants lecturers the write policies live_classes needs', () => {
    const migration = fs.readFileSync(
      path.join(process.cwd(), 'supabase', 'migrations', '031_live_class_write_policies.sql'),
      'utf8',
    );

    expect(migration).toContain('"Lecturers schedule live classes" ON live_classes');
    expect(migration).toContain('"Lecturers update own live classes" ON live_classes');
    expect(migration).toContain('"Lecturers delete own live classes" ON live_classes');
  });

  it('joins private rooms with a minted meeting token rather than the bare room URL', () => {
    const room = fs.readFileSync(path.join(process.cwd(), 'components', 'live', 'LiveClassRoom.tsx'), 'utf8');

    expect(room).toContain('/api/live-classes/');
    expect(room).toContain('url.searchParams.set("t"');

    for (const page of [
      path.join('app', '(dashboard)', 'student', 'live-classes', '[sessionId]', 'page.tsx'),
      path.join('app', '(dashboard)', 'lecturer', 'live-classes', '[sessionId]', 'page.tsx'),
    ]) {
      const source = fs.readFileSync(path.join(process.cwd(), page), 'utf8');
      expect(source).toContain('LiveClassRoom');
      expect(source).not.toContain('<iframe');
    }
  });
});

describe('LiveClassService.recordParticipantPresence', () => {
  const provider = {
    createSession: async () => ({ sessionId: 'room1', hostUrl: 'https://host', joinUrl: 'https://join' }),
    updateSession: async () => undefined,
    cancelSession: async () => undefined,
    generateJoinToken: async () => 'token',
  };

  function presenceStub(participant: Record<string, any>) {
    return createSupabaseStub({
      live_classes: [{ id: 'lc1', provider_session_id: 'room1', meeting_id: 'room1' }],
      live_class_participants: [{ id: 'p1', live_class_id: 'lc1', user_id: 'stu1', ...participant }],
    });
  }

  it('stamps the provider join time when a participant enters', async () => {
    const { client, updated } = presenceStub({ joined_at: '2026-09-01T10:00:00.000Z', total_seconds: 0 });

    await new LiveClassService(client, provider).recordParticipantPresence({
      roomName: 'room1',
      participantId: 'stu1',
      event: 'joined',
      occurredAt: '2026-09-01T10:01:00.000Z',
    });

    expect(updated.live_class_participants[0].provider_joined_at).toBe('2026-09-01T10:01:00.000Z');
  });

  it('accumulates time across rejoins rather than overwriting it', async () => {
    const { client, updated } = presenceStub({
      joined_at: '2026-09-01T10:00:00.000Z',
      provider_joined_at: '2026-09-01T10:00:00.000Z',
      total_seconds: 600,
    });

    const result = await new LiveClassService(client, provider).recordParticipantPresence({
      roomName: 'room1',
      participantId: 'stu1',
      event: 'left',
      occurredAt: '2026-09-01T10:20:00.000Z',
      durationSeconds: 1200,
    });

    expect(result.totalSeconds).toBe(1800);
    expect(updated.live_class_participants[0].left_at).toBe('2026-09-01T10:20:00.000Z');
  });

  it('falls back to elapsed time when the event carries no duration', async () => {
    const { client } = presenceStub({
      joined_at: '2026-09-01T10:00:00.000Z',
      provider_joined_at: '2026-09-01T10:00:00.000Z',
      total_seconds: 0,
    });

    const result = await new LiveClassService(client, provider).recordParticipantPresence({
      roomName: 'room1',
      participantId: 'stu1',
      event: 'left',
      occurredAt: '2026-09-01T10:30:00.000Z',
    });

    expect(result.totalSeconds).toBe(1800);
  });

  it('rejects an event for a participant the app never issued a token to', async () => {
    const { client } = presenceStub({ user_id: 'stu1', total_seconds: 0 });

    await expect(
      new LiveClassService(client, provider).recordParticipantPresence({
        roomName: 'room1',
        participantId: 'someone-else',
        event: 'left',
      }),
    ).rejects.toThrow('No participant row matches this event');
  });

  it('handles participant events in the provider webhook', () => {
    const route = fs.readFileSync(
      path.join(process.cwd(), 'app', 'api', 'webhooks', 'live-class-provider', 'route.ts'),
      'utf8',
    );

    expect(route).toContain("'participant.joined'");
    expect(route).toContain("'participant.left'");
    expect(route).toContain('recordParticipantPresence');
    // Presence events must stay behind the same signature check as recordings.
    expect(route.indexOf('verifyDailyWebhookSignature')).toBeLessThan(route.indexOf('participant.joined'));
  });
});
