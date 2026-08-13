import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth/session';
import { requestSignedDownloadSchema } from '@/lib/validation/files';
import { FileService } from '@/lib/services/file.service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = requestSignedDownloadSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const supabase = await createClient();
    const session = await getSession();
    
    if (!session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In a prod app, verify if they have access to the file here, or depend on RLS for the storage bucket natively 
    // Signed urls bypass native RLS *on download* unless they're scoped, but we issue the signed URL via backend which is authed.
    
    const service = new FileService(supabase as any);
    const result = await service.createSignedDownloadUrl(parsed.data.bucket, parsed.data.path);

    return NextResponse.json({ data: result }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
