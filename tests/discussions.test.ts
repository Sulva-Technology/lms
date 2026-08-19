import { describe, it, expect } from 'vitest';
import { createSupabaseStub } from './helpers/supabase-stub';
import { DiscussionService } from '@/lib/services/discussion.service';
import { toDiscussion, toReply, courseLabel, personName } from '@/lib/discussions/shape';

function stub(authorRole: string) {
  return createSupabaseStub({
    discussions: [{ id: 'd1', university_id: 'uni1', course_section_id: 'sec1', is_answered: false }],
    discussion_replies: [],
    profiles: [{ id: 'author1' }],
    // The role that decides endorsement is the one held at this organisation.
    memberships: [
      { user_id: 'author1', university_id: 'uni1', role: authorRole, deleted_at: null },
    ],
  });
}

describe('DiscussionService.createDiscussion', () => {
  it('records the tenant, author and section', async () => {
    const { client, inserted } = stub('student');
    const service = new DiscussionService(client);

    await service.createDiscussion('uni1', 'author1', 'sec1', 'Why?', 'Because.');

    expect(inserted.discussions[0]).toMatchObject({
      university_id: 'uni1',
      author_id: 'author1',
      course_section_id: 'sec1',
      title: 'Why?',
      content: 'Because.',
    });
  });
});

describe('DiscussionService.replyToDiscussion', () => {
  it('auto-endorses a lecturer reply', async () => {
    const { client, inserted } = stub('lecturer');
    const service = new DiscussionService(client);

    await service.replyToDiscussion('uni1', 'author1', 'd1', 'Here is the answer.');

    expect(inserted.discussion_replies[0].is_endorsed).toBe(true);
  });

  it('does not endorse a student reply', async () => {
    const { client, inserted } = stub('student');
    const service = new DiscussionService(client);

    await service.replyToDiscussion('uni1', 'author1', 'd1', 'I think so too.');

    expect(inserted.discussion_replies[0].is_endorsed).toBe(false);
  });
});

describe('DiscussionService.markAsAnswered', () => {
  it('records who closed the thread', async () => {
    const { client, updated } = stub('lecturer');
    const service = new DiscussionService(client);

    await service.markAsAnswered('uni1', 'd1', 'author1');

    expect(updated.discussions[0]).toMatchObject({ is_answered: true, answered_by: 'author1' });
    expect(updated.discussions[0].answered_at).toBeTruthy();
  });

  it('does not touch a discussion from another university', async () => {
    const { client, updated } = stub('lecturer');
    const service = new DiscussionService(client);

    await service.markAsAnswered('other-uni', 'd1', 'author1');

    expect(updated.discussions).toBeUndefined();
  });
});

describe('discussion shape mappers', () => {
  it('flattens joined rows into board props', () => {
    const mapped = toDiscussion({
      id: 'd1',
      title: 'Question',
      content: 'Body',
      is_answered: true,
      created_at: '2026-08-01T00:00:00.000Z',
      profiles: { first_name: 'Ada', last_name: 'Lovelace' },
      course_sections: { name: 'Group A', courses: { code: 'CS101' } },
      discussion_replies: [{ id: 'r1' }, { id: 'r2' }],
    });

    expect(mapped).toMatchObject({
      author_name: 'Ada Lovelace',
      course_label: 'CS101',
      is_answered: true,
      reply_count: 2,
    });
  });

  it('falls back to email then a generic label for missing names', () => {
    expect(personName({ email: 'a@b.test' })).toBe('a@b.test');
    expect(personName(null)).toBe('Member');
  });

  it('falls back to the section name when the course has no code', () => {
    expect(courseLabel({ course_sections: { name: 'Group B', courses: {} } })).toBe('Group B');
  });

  it('maps a reply with its endorsement flag', () => {
    const mapped = toReply({
      id: 'r1',
      content: 'Answer',
      is_endorsed: true,
      created_at: '2026-08-02T00:00:00.000Z',
      profiles: [{ first_name: 'Grace', last_name: 'Hopper' }],
    });

    expect(mapped).toMatchObject({ author_name: 'Grace Hopper', is_endorsed: true });
  });
});
