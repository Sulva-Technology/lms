import { SupabaseClient } from '@supabase/supabase-js';

export class RecordingService {
  constructor(private supabase: SupabaseClient<any>) {}

  async processWebhookRecording(params: {
    providerSessionId: string;
    providerRecordingId: string;
    recordingUrl: string;
    durationSeconds: number;
    s3Key?: string;
    providerMetadata?: Record<string, unknown>;
  }) {
    const { data: liveClass } = await this.supabase.from('live_classes')
      .select('id, university_id, course_id, lecturer_id')
      .eq('provider_session_id', params.providerSessionId)
      .single();

    if (!liveClass) {
        console.warn('Received recording webhook for unknown session', params.providerSessionId);
        return;
    }

    const { data: existing } = await this.supabase.from('live_class_recordings')
      .select('id')
      .eq('provider_recording_id', params.providerRecordingId)
      .single();

    if (existing) return existing;

    const { data: rec, error } = await this.supabase.from('live_class_recordings').insert({
      university_id: liveClass.university_id,
      live_class_id: liveClass.id,
      course_id: liveClass.course_id,
      created_by: liveClass.lecturer_id,
      provider_recording_id: params.providerRecordingId,
      recording_url: params.recordingUrl,
      playback_url: params.recordingUrl,
      s3_key: params.s3Key || null,
      duration: Math.floor(params.durationSeconds / 60),
      status: 'ready',
      is_published: false,
      provider_metadata: params.providerMetadata || {},
    }).select().single();

    if (error) throw error;
    
    await this.supabase.from('video_assets').insert({
        university_id: liveClass.university_id,
        course_id: liveClass.course_id,
        live_class_id: liveClass.id,
        recording_id: rec.id,
        provider: 'daily',
        asset_id: params.providerRecordingId,
        playback_url: params.recordingUrl,
        duration: params.durationSeconds,
        visibility: 'private',
        status: 'ready'
    });

    return rec;
  }
  
  async togglePublish(userId: string, universityId: string, recordingId: string, isPublished: boolean) {
    // Recordings are created by the provider webhook, not by a person, so
    // `created_by` is usually null. Authorize on teaching the section instead.
    const { data: recording } = await this.supabase.from('live_class_recordings')
      .select('id, university_id, live_classes(course_section_id)')
      .eq('id', recordingId)
      .maybeSingle();

    if (!recording) throw new Error('Recording not found');
    if (recording.university_id !== universityId) throw new Error('Unauthorized');

    const liveClass = Array.isArray((recording as any).live_classes)
      ? (recording as any).live_classes[0]
      : (recording as any).live_classes;

    const { data: assignment } = await this.supabase.from('course_lecturers')
      .select('id')
      .eq('course_section_id', liveClass?.course_section_id)
      .eq('lecturer_id', userId)
      .maybeSingle();

    if (!assignment) throw new Error('Unauthorized: Lecturer not assigned to this course section');

    const { error } = await this.supabase.from('live_class_recordings')
      .update({ is_published: isPublished })
      .eq('id', recordingId);

    if (error) throw error;

    await this.supabase.from('audit_logs').insert({
      university_id: universityId,
      user_id: userId,
      action: isPublished ? 'RECORDING_PUBLISHED' : 'RECORDING_UNPUBLISHED',
      entity_type: 'live_class_recordings',
      entity_id: recordingId
    });

    return true;
  }
}
