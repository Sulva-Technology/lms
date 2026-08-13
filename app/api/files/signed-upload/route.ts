import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth/session';
import { createSignedUploadSchema } from '@/lib/validation/files';
import { FileService } from '@/lib/services/file.service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = createSignedUploadSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const supabase = await createClient();
    const session = await getSession();
    
    if (!session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const service = new FileService(supabase as any);
    const result = await service.createSignedUploadUrl(parsed.data.bucket, parsed.data.path);

    return NextResponse.json({ data: result }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
