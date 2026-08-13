import { SupabaseClient } from '@supabase/supabase-js';
import { LiveClassProvider } from '../live-class/provider';
import { LiveClassPayload } from '@/types/live-class';

export class LiveClassService {
  constructor(private supabase: SupabaseClient<any>, private provider: LiveClassProvider) {}

  async createLiveClass(universityId: string, lecturerId: string, payload: LiveClassPayload) {
    if (!payload.courseSectionId) {
      throw new Error('Course section is required to schedule a live class');
    }

    const session = await this.provider.createSession({
      topic: payload.topic,
      startTime: payload.startTime,
      durationMinutes: payload.durationMinutes,
      isRecordingEnabled: payload.isRecordingEnabled,
      isWaitingRoomEnabled: payload.isWaitingRoomEnabled
    });

    const start = new Date(payload.startTime);
    const end = new Date(start.getTime() + payload.durationMinutes * 60000);

    const { data: dbSession, error } = await this.supabase.from('live_classes').insert({
      university_id: universityId,
      course_id: payload.courseId,
      course_section_id: payload.courseSectionId,
      lecturer_id: lecturerId,
      title: payload.topic,
      topic: payload.topic,
      description: payload.description,
      start_time: payload.startTime,
      end_time: end.toISOString(),
      duration: payload.durationMinutes,
      provider: 'daily',
      meeting_id: session.sessionId,
      is_recording_enabled: payload.isRecordingEnabled,
      is_waiting_room_enabled: payload.isWaitingRoomEnabled,
      join_before_host: payload.joinBeforeHost,
      tracking_rule: payload.trackingRule,
      provider_session_id: session.sessionId,
      provider_room_name: session.sessionId,
      provider_room_url: session.joinUrl,
      provider_metadata: session.providerMetadata || {},
      join_url: session.joinUrl,
      host_url: session.hostUrl,
      status: 'scheduled'
    }).select().single();

    if (error) throw error;
    
    await this.supabase.from('audit_logs').insert({
      university_id: universityId,
      user_id: lecturerId,
      action: 'LIVE_CLASS_CREATED',
      entity_type: 'live_classes',
      entity_id: dbSession.id
    });
    
    return dbSession;
  }

  async cancelLiveClass(universityId: string, userId: string, classId: string) {
    const { data: cl, error: fetchErr } = await this.supabase.from('live_classes')
      .select('provider_session_id, meeting_id, lecturer_id')
      .eq('id', classId).single();
      
    if (fetchErr) throw fetchErr;
    if (cl.lecturer_id !== userId) throw new Error('Unauthorized'); // Basic check

    await this.provider.cancelSession(cl.provider_session_id || cl.meeting_id);
    
    const { error: updErr } = await this.supabase.from('live_classes')
      .update({ status: 'cancelled' })
      .eq('id', classId);
      
    if (updErr) throw updErr;

    await this.supabase.from('audit_logs').insert({
      university_id: universityId,
      user_id: userId,
      action: 'LIVE_CLASS_CANCELLED',
      entity_type: 'live_classes',
      entity_id: classId
    });

    return true;
  }

  async recordParticipantJoin(classId: string, participantId: string, role: 'host' | 'guest') {
     const { data: cl } = await this.supabase
       .from('live_classes')
       .select('provider_session_id, meeting_id, university_id, lecturer_id, course_section_id')
       .eq('id', classId)
       .single();
     if (!cl) throw new Error('Class not found');

     if (role === 'host' && cl.lecturer_id !== participantId) {
       throw new Error('Only the assigned lecturer can host this class');
     }

     if (role === 'guest') {
       const { data: enrollment } = await this.supabase
         .from('course_enrollments')
         .select('id')
         .eq('course_section_id', cl.course_section_id)
         .eq('student_id', participantId)
         .eq('status', 'active')
         .maybeSingle();

       if (!enrollment) throw new Error('Only enrolled students can join this class');
     }
     
     const token = await this.provider.generateJoinToken(cl.provider_session_id || cl.meeting_id, participantId, role);
     
     // Log join
     await this.supabase.from('live_class_participants').upsert({
         university_id: cl.university_id,
         live_class_id: classId,
         user_id: participantId,
         role,
         student_id: role === 'guest' ? participantId : null,
         joined_at: new Date().toISOString(),
         join_token: token,
         provider_participant_id: participantId,
         provider_metadata: { provider: 'daily' }
     }, { onConflict: 'live_class_id,user_id' });
     
     return token;
  }
}
