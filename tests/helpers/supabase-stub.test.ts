import { describe, it, expect } from 'vitest';
import { createSupabaseStub } from './supabase-stub';

describe('createSupabaseStub', () => {
  it('filters rows with chained eq and returns single', async () => {
    const { client } = createSupabaseStub({
      course_enrollments: [
        { id: 'e1', student_id: 's1', course_section_id: 'sec1', status: 'active' },
        { id: 'e2', student_id: 's2', course_section_id: 'sec1', status: 'active' },
      ],
    });

    const { data } = await client
      .from('course_enrollments')
      .select('id')
      .eq('student_id', 's1')
      .eq('course_section_id', 'sec1')
      .eq('status', 'active')
      .single();

    expect(data).toMatchObject({ id: 'e1', student_id: 's1' });
  });

  it('returns null data from maybeSingle when nothing matches', async () => {
    const { client } = createSupabaseStub({ profiles: [] });
    const { data } = await client.from('profiles').select('id').eq('id', 'missing').maybeSingle();
    expect(data).toBeNull();
  });

  it('returns an error envelope from single when nothing matches', async () => {
    const { client } = createSupabaseStub({ profiles: [] });
    const { data, error } = await client.from('profiles').select('id').eq('id', 'missing').single();
    expect(data).toBeNull();
    expect(error).toBeTruthy();
  });

  it('records inserts and returns the inserted row', async () => {
    const { client, inserted } = createSupabaseStub({ notifications: [] });
    const { data } = await client
      .from('notifications')
      .insert({ user_id: 'u1', title: 'Hi' })
      .select()
      .single();

    expect(data.user_id).toBe('u1');
    expect(data.id).toBeTruthy();
    expect(inserted.notifications).toHaveLength(1);
  });

  it('records updates against matched rows', async () => {
    const { client, updated } = createSupabaseStub({
      assignment_submissions: [{ id: 'sub1', score: null }],
    });

    const { data } = await client
      .from('assignment_submissions')
      .update({ score: 90 })
      .eq('id', 'sub1')
      .select()
      .single();

    expect(data.score).toBe(90);
    expect(updated.assignment_submissions[0]).toMatchObject({ score: 90 });
  });

  it('orders rows ascending', async () => {
    const { client } = createSupabaseStub({
      course_modules: [
        { id: 'b', order_index: 2 },
        { id: 'a', order_index: 1 },
      ],
    });

    const { data } = await client.from('course_modules').select('*').order('order_index', { ascending: true });
    expect(data.map((row: any) => row.id)).toEqual(['a', 'b']);
  });

  it('filters by membership without mutating the table', async () => {
    const stub = createSupabaseStub({
      assignments: [
        { id: 'a1', course_section_id: 'sec1' },
        { id: 'a2', course_section_id: 'sec2' },
        { id: 'a3', course_section_id: 'sec3' },
      ],
    });

    const { data } = await stub.client.from('assignments').select('*').in('course_section_id', ['sec1', 'sec3']);
    expect(data.map((row: any) => row.id)).toEqual(['a1', 'a3']);
    expect(stub.tables.assignments).toHaveLength(3);
  });

  it('deletes matched rows', async () => {
    const stub = createSupabaseStub({ files: [{ id: 'f1' }, { id: 'f2' }] });
    await stub.client.from('files').delete().eq('id', 'f1');

    expect(stub.tables.files.map((row: any) => row.id)).toEqual(['f2']);
    expect(stub.deleted.files).toHaveLength(1);
  });
});
