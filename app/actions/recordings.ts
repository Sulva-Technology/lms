'use server'

import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/guards';
import { RecordingService } from '@/lib/services/recording.service';

export async function toggleRecordingPublishAction(recordingId: string, isPublished: boolean) {
    const supabase = await createClient();
    const session = await requireUser();

    if (session.profile?.role !== 'lecturer' && session.profile?.role !== 'admin') {
        return { error: 'Unauthorized' };
    }
    
    const service = new RecordingService(supabase as any);
    
    try {
        await service.togglePublish(session.user!.id, session.profile.university_id!, recordingId, isPublished);
        return { success: true };
    } catch (err: any) {
        return { error: err.message };
    }
}
