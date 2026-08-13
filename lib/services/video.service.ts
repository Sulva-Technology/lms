import { SupabaseClient } from '@supabase/supabase-js';
import { CreateVideoAssetPayload } from '@/types/video';

export interface AttachLessonVideoInput {
  universityId: string;
  uploaderId: string;
  lessonId: string;
  courseId: string;
  storagePath: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  durationSeconds?: number;
}

export class VideoAssetService {
  constructor(private supabase: SupabaseClient<any>) {}

  async createAsset(universityId: string, uploaderId: string, payload: CreateVideoAssetPayload) {
    const { data, error } = await this.supabase.from('video_assets').insert({
      university_id: universityId,
      created_by: uploaderId,
      lesson_id: payload.lessonId,
      course_id: payload.courseId,
      provider: payload.provider,
      asset_id: payload.assetId,
      playback_id: payload.playbackId,
      playback_url: payload.playbackUrl,
      duration: payload.duration,
      visibility: payload.visibility || 'private',
      status: 'processing'
    }).select().single();

    if (error) throw error;
    return data;
  }

  async updateStatus(assetId: string, status: string, playbackId?: string, playbackUrl?: string) {
    const updates: any = { status };
    if (playbackId) updates.playback_id = playbackId;
    if (playbackUrl) updates.playback_url = playbackUrl;

    const { data, error } = await this.supabase.from('video_assets').update(updates).eq('asset_id', assetId).select().single();
    if (error) throw error;
    return data;
  }

  /**
   * Whether the lecturer is assigned to a section of the course that owns the
   * lesson. Lesson -> module -> course -> section -> course_lecturers.
   */
  async lecturerOwnsLesson(lessonId: string, lecturerId: string): Promise<boolean> {
    const { data: lesson } = await this.supabase
      .from('lessons')
      .select('id, course_modules(course_id)')
      .eq('id', lessonId)
      .maybeSingle();

    if (!lesson) return false;

    const lessonModule = Array.isArray((lesson as any).course_modules)
      ? (lesson as any).course_modules[0]
      : (lesson as any).course_modules;
    const courseId = lessonModule?.course_id;
    if (!courseId) return false;

    const { data: sections } = await this.supabase
      .from('course_sections')
      .select('id')
      .eq('course_id', courseId);

    const sectionIds = (sections || []).map((section: any) => section.id);
    if (sectionIds.length === 0) return false;

    const { data: assignment } = await this.supabase
      .from('course_lecturers')
      .select('id')
      .eq('lecturer_id', lecturerId)
      .in('course_section_id', sectionIds)
      .maybeSingle();

    return Boolean(assignment);
  }

  /**
   * Points a lesson at a video object in the private lesson-video bucket.
   * Replacing an existing video removes the previous asset row first, so a
   * lesson never accumulates orphaned assets.
   */
  async attachLessonVideo(input: AttachLessonVideoInput) {
    await this.supabase.from('video_assets').delete().eq('lesson_id', input.lessonId);

    const { data, error } = await this.supabase.from('video_assets').insert({
      university_id: input.universityId,
      created_by: input.uploaderId,
      lesson_id: input.lessonId,
      course_id: input.courseId,
      provider: 'supabase',
      asset_id: input.storagePath,
      storage_path: input.storagePath,
      file_name: input.fileName,
      file_size: input.fileSize,
      content_type: input.contentType,
      duration: input.durationSeconds ?? null,
      visibility: 'private',
      status: 'ready',
    }).select().single();

    if (error) throw error;

    const { error: lessonError } = await this.supabase
      .from('lessons')
      .update({ video_asset_id: data.id, video_duration: input.durationSeconds ?? null })
      .eq('id', input.lessonId);

    if (lessonError) throw lessonError;

    return data;
  }

  async removeLessonVideo(lessonId: string) {
    await this.supabase.from('video_assets').delete().eq('lesson_id', lessonId);

    const { error } = await this.supabase
      .from('lessons')
      .update({ video_asset_id: null, video_duration: null })
      .eq('id', lessonId);

    if (error) throw error;
  }
}
