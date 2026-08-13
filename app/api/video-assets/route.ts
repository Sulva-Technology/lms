import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { updateVideoStatusSchema } from '@/lib/validation/video';
import { VideoAssetService } from '@/lib/services/video.service';

export async function POST(req: Request) {
    return NextResponse.json({ message: 'Use action instead' }, { status: 400 });
}
