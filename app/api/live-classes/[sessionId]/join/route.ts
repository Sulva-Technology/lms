import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth/session';
import { LiveClassService } from '@/lib/services/live-class.service';
import { DailyLiveClassProvider } from '@/lib/live-class/daily-provider';

export async function POST(req: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await params;
    const body = await req.json();
    const { role } = body as { role: 'host' | 'guest' };

    if (!role || (role !== 'host' && role !== 'guest')) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const supabase = await createClient();
    const session = await getSession();
    
    if (!session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const provider = new DailyLiveClassProvider();
    const service = new LiveClassService(supabase as any, provider);
    const token = await service.recordParticipantJoin(sessionId, session.user.id, role);

    return NextResponse.json({ data: { token } }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
