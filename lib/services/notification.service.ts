import { SupabaseClient } from '@supabase/supabase-js';
import { NotificationPayload } from '@/types/notification';

export class NotificationService {
  constructor(private supabase: SupabaseClient<any>) {}

  async createNotification(payload: NotificationPayload) {
    const { data, error } = await this.supabase.from('notifications').insert({
      university_id: payload.universityId,
      user_id: payload.userId,
      title: payload.title,
      content: payload.message,
      type: payload.type,
      link_url: payload.linkUrl,
      is_read: payload.isRead || false,
    }).select().single();

    if (error) throw new Error(error.message);
    return data;
  }

  async sendToCourseStudents(universityId: string, courseSectionId: string, title: string, message: string, type: string, linkUrl?: string) {
    const { data: students } = await this.supabase.from('course_enrollments')
      .select('student_id')
      .eq('course_section_id', courseSectionId)
      .eq('status', 'active');
    
    if (!students || students.length === 0) return;

    const payloads = students.map(s => ({
      university_id: universityId,
      user_id: s.student_id,
      title,
      content: message,
      type,
      link_url: linkUrl,
    }));

    const { error } = await this.supabase.from('notifications').insert(payloads);
    if (error) throw new Error(error.message);
  }

  async sendToUniversityUsers(universityId: string, title: string, message: string, type: string, linkUrl?: string) {
    const { data: users } = await this.supabase.from('profiles').select('id').eq('university_id', universityId);
    if (!users || users.length === 0) return;

    const payloads = users.map(u => ({
      university_id: universityId,
      user_id: u.id,
      title,
      content: message,
      type,
      link_url: linkUrl,
    }));

    const { error } = await this.supabase.from('notifications').insert(payloads);
    if (error) throw new Error(error.message);
  }

  async markAsRead(notificationId: string, userId: string) {
    const { error } = await this.supabase.from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', userId);
    if (error) throw new Error(error.message);
  }

  async markAllAsRead(universityId: string, userId: string) {
    const { error } = await this.supabase.from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('university_id', universityId);
    if (error) throw new Error(error.message);
  }
}
