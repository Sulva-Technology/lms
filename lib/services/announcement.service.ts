import { SupabaseClient } from '@supabase/supabase-js';

export class AnnouncementService {
  constructor(private supabase: SupabaseClient<any>) {}

  async createAnnouncement(payload: {
    universityId: string;
    authorId: string;
    title: string;
    content: string;
    targetScope: 'university' | 'faculty' | 'department' | 'course_section';
    targetId?: string;
    isPublished: boolean;
  }) {
    const { data, error } = await this.supabase.from('announcements').insert({
      university_id: payload.universityId,
      author_id: payload.authorId,
      title: payload.title,
      content: payload.content,
      target_scope: payload.targetScope,
      target_id: payload.targetId,
      course_section_id: payload.targetScope === 'course_section' ? payload.targetId : null,
      is_published: payload.isPublished
    }).select().single();

    if (error) throw new Error(error.message);
    return data;
  }

  async togglePublish(universityId: string, authorId: string, announcementId: string, isPublished: boolean) {
    // Only author or admin should be able to toggle. Rely on RLS mostly, but we can check here.
    const { error } = await this.supabase.from('announcements')
      .update({ is_published: isPublished })
      .eq('id', announcementId)
      .eq('university_id', universityId);
      // Depending on rules, we might want to enforce authorId but admins can toggle too.

    if (error) throw new Error(error.message);
  }

  async updateAnnouncement(payload: {
    universityId: string;
    authorId: string;
    announcementId: string;
    title?: string;
    content?: string;
    targetScope?: 'university' | 'faculty' | 'department' | 'course_section';
    targetId?: string;
    isPublished?: boolean;
  }) {
    const { data, error } = await this.supabase.from('announcements')
      .update({
        ...(payload.title && { title: payload.title }),
        ...(payload.content && { content: payload.content }),
        ...(payload.targetScope && { target_scope: payload.targetScope }),
        ...(payload.targetScope && { course_section_id: payload.targetScope === 'course_section' ? payload.targetId || null : null }),
        ...(payload.targetId !== undefined && { target_id: payload.targetId || null }),
        ...(payload.isPublished !== undefined && { is_published: payload.isPublished }),
      })
      .eq('id', payload.announcementId)
      .eq('university_id', payload.universityId)
      .eq('author_id', payload.authorId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async archiveAnnouncement(universityId: string, authorId: string, announcementId: string) {
    const { data, error } = await this.supabase.from('announcements')
      .update({ deleted_at: new Date().toISOString(), is_published: false })
      .eq('id', announcementId)
      .eq('university_id', universityId)
      .eq('author_id', authorId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
}
