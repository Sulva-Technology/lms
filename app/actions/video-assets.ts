'use server'

import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/guards';
import { VideoAssetService } from '@/lib/services/video.service';
import { createVideoAssetSchema } from '@/lib/validation/video';

export async function createVideoAssetAction(payload: any) {
    const supabase = await createClient();
    const session = await requireUser();

    const parsed = createVideoAssetSchema.safeParse(payload);
    if (!parsed.success) return { error: parsed.error.issues[0].message };
    
    const service = new VideoAssetService(supabase as any);
    try {
        const result = await service.createAsset(session.profile!.university_id!, session.user!.id, parsed.data as any);
        return { success: true, asset: result };
    } catch (error: any) {
        return { error: error.message };
    }
}
