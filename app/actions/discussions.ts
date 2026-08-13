'use server';

import { createClient } from '@/lib/supabase/server';
import { requireRole, requireUser } from '@/lib/auth/guards';
import { createDiscussionSchema, replyDiscussionSchema } from '@/lib/validation/discussion';
import { DiscussionService } from '@/lib/services/discussion.service';
import { actionError, actionSuccess } from '@/lib/api/response';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

/**
 * A user may post in a section they are actively enrolled in, or that they are
 * assigned to teach. Admins are trusted across their own university, which the
 * university_id on every write already scopes.
 */
async function assertSectionMembership(supabase: any, session: any, courseSectionId: string) {
  const role = session.profile.role;
  if (role === 'department_admin' || role === 'admin' || role === 'super_admin') return;

  const table = role === 'lecturer' ? 'course_lecturers' : 'course_enrollments';
  const column = role === 'lecturer' ? 'lecturer_id' : 'student_id';

  let query = supabase.from(table).select('id').eq('course_section_id', courseSectionId).eq(column, session.user.id);
  if (role !== 'lecturer') query = query.eq('status', 'active');

  const { data } = await query.maybeSingle();
  if (!data) throw new Error('You do not have access to this course section.');
}

async function sectionIdForDiscussion(supabase: any, discussionId: string): Promise<string> {
  const { data } = await supabase
    .from('discussions')
    .select('course_section_id')
    .eq('id', discussionId)
    .maybeSingle();

  if (!data) throw new Error('Discussion not found.');
  return data.course_section_id;
}

export async function createDiscussionAction(payload: unknown) {
  try {
    const supabase = await createClient();
    const session = await requireUser();

    const parsed = createDiscussionSchema.parse(payload);
    await assertSectionMembership(supabase, session, parsed.courseSectionId);

    const service = new DiscussionService(supabase as any);
    const result = await service.createDiscussion(
      session.profile.university_id!,
      session.user.id,
      parsed.courseSectionId,
      parsed.title,
      parsed.body,
    );

    revalidatePath('/student/discussions');
    revalidatePath('/lecturer/questions');
    return actionSuccess(result);
  } catch (error) {
    return actionError(error);
  }
}

export async function replyDiscussionAction(payload: unknown) {
  try {
    const supabase = await createClient();
    const session = await requireUser();

    const parsed = replyDiscussionSchema.parse(payload);
    const courseSectionId = await sectionIdForDiscussion(supabase, parsed.discussionId);
    await assertSectionMembership(supabase, session, courseSectionId);

    const service = new DiscussionService(supabase as any);
    const result = await service.replyToDiscussion(
      session.profile.university_id!,
      session.user.id,
      parsed.discussionId,
      parsed.body,
    );

    revalidatePath(`/student/discussions/${parsed.discussionId}`);
    revalidatePath('/lecturer/questions');
    return actionSuccess(result);
  } catch (error) {
    return actionError(error);
  }
}

const markAnsweredSchema = z.object({ discussionId: z.string().uuid() });

/** Only the lecturer teaching the section may close a question as answered. */
export async function markDiscussionAnsweredAction(payload: unknown) {
  try {
    const supabase = await createClient();
    const session = await requireRole('lecturer');

    const parsed = markAnsweredSchema.parse(payload);
    const courseSectionId = await sectionIdForDiscussion(supabase, parsed.discussionId);
    await assertSectionMembership(supabase, session, courseSectionId);

    const service = new DiscussionService(supabase as any);
    await service.markAsAnswered(session.profile.university_id!, parsed.discussionId, session.user.id);

    revalidatePath('/lecturer/questions');
    revalidatePath(`/student/discussions/${parsed.discussionId}`);
    return actionSuccess({ id: parsed.discussionId });
  } catch (error) {
    return actionError(error);
  }
}
