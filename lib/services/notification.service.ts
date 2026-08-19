import { SupabaseClient } from '@supabase/supabase-js';
import { NotificationEmailBuilder, NotificationPayload } from '@/types/notification';
import { isEmailConfigured, sendEmail } from '@/lib/email/send';

export class NotificationService {
  constructor(private supabase: SupabaseClient<any>) {}

  /**
   * Emails the given recipients unless they opted out in their profile
   * preferences. Fire-and-forget: never blocks or fails the notification write.
   */
  private async emailRecipients(userIds: string[], build: NotificationEmailBuilder): Promise<void> {
    if (userIds.length === 0 || !isEmailConfigured()) return;

    const { data: recipients } = await this.supabase
      .from('profiles')
      .select('id,email,first_name,last_name,preferences')
      .in('id', userIds);

    for (const recipient of recipients || []) {
      if (!recipient.email) continue;
      if (recipient.preferences?.emailNotifications === false) continue;

      const name = [recipient.first_name, recipient.last_name].filter(Boolean).join(' ') || 'there';
      const body = build({ email: recipient.email, name });
      if (!body) continue;

      await sendEmail({ to: recipient.email, ...body });
    }
  }

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

    if (payload.email) {
      await this.emailRecipients([payload.userId], payload.email);
    }

    return data;
  }

  async sendToCourseStudents(universityId: string, courseSectionId: string, title: string, message: string, type: string, linkUrl?: string, email?: NotificationEmailBuilder) {
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

    if (email) {
      await this.emailRecipients(students.map((student) => student.student_id), email);
    }
  }

  async sendToUniversityUsers(universityId: string, title: string, message: string, type: string, linkUrl?: string) {
    const { data: users } = await this.supabase
      .from('memberships')
      .select('user_id')
      .eq('university_id', universityId)
      .is('deleted_at', null);
    if (!users || users.length === 0) return;

    const payloads = users.map(u => ({
      university_id: universityId,
      user_id: u.user_id,
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
