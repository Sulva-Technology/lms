import { SupabaseClient } from '@supabase/supabase-js';
import { CreateVideoAssetPayload } from '@/types/video';

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
}
