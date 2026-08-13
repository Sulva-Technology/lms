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
    const { data: profile } = await this.supabase.from('profiles').select('role').eq('id', authorId).single();
    const isLecturer = profile?.role === 'lecturer';

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

  async markAsAnswered(universityId: string, discussionId: string) {
    const { error } = await this.supabase.from('discussions')
      .update({ is_answered: true })
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
