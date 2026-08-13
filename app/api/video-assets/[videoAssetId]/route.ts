import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { updateVideoStatusSchema } from '@/lib/validation/video';
import { VideoAssetService } from '@/lib/services/video.service';

// Allow webhooks to update video asset status
export async function PATCH(req: Request, { params }: { params: Promise<{ videoAssetId: string }> }) {
  try {
    const { videoAssetId } = await params;
    const body = await req.json();
    const parsed = updateVideoStatusSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    // Usually protected by a webhook secret
    const adminClient = createAdminClient();
    const service = new VideoAssetService(adminClient as any);
    const result = await service.updateStatus(videoAssetId, parsed.data.status, parsed.data.playbackId, parsed.data.playbackUrl);

    return NextResponse.json({ data: result }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
