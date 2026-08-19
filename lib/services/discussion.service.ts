import { SupabaseClient } from '@supabase/supabase-js';

export class DiscussionService {
  constructor(private supabase: SupabaseClient<any>) {}

  async createDiscussion(universityId: string, authorId: string, courseSectionId: string, title: string, content: string) {
    const { data, error } = await this.supabase.from('discussions').insert({
      university_id: universityId,
      author_id: authorId,
      course_section_id: courseSectionId,
      title,
      content,
    }).select().single();

    if (error) throw new Error(error.message);
    return data;
  }

  async replyToDiscussion(universityId: string, authorId: string, discussionId: string, content: string, parentId?: string) {
    // Check if author is lecturer for endorsement
    // Endorsement follows the role held at this organisation, not one held
    // somewhere else.
    const { data: membership } = await this.supabase
      .from('memberships')
      .select('role')
      .eq('user_id', authorId)
      .eq('university_id', universityId)
      .is('deleted_at', null)
      .maybeSingle();
    const isLecturer = membership?.role === 'lecturer';

    const { data, error } = await this.supabase.from('discussion_replies').insert({
      university_id: universityId,
      discussion_id: discussionId,
      author_id: authorId,
      parent_id: parentId || null,
      content,
      is_endorsed: isLecturer // auto endorse if lecturer
    }).select().single();

    if (error) throw new Error(error.message);
    return data;
  }

  async markAsAnswered(universityId: string, discussionId: string, answeredBy?: string) {
    const { error } = await this.supabase.from('discussions')
      .update({
        is_answered: true,
        answered_by: answeredBy || null,
        answered_at: new Date().toISOString(),
      })
      .eq('id', discussionId)
      .eq('university_id', universityId);

    if (error) throw new Error(error.message);
  }

  async moderateDiscussion(universityId: string, adminId: string, discussionId: string) {
    const now = new Date().toISOString();
    const { error } = await this.supabase.from('discussions')
      .update({ is_moderated: true, moderated_by: adminId, moderated_at: now })
      .eq('id', discussionId)
      .eq('university_id', universityId);

    if (error) throw new Error(error.message);
  }
}
