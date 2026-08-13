import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth/session';
import { ReportService } from '@/lib/services/report.service';

export async function GET(req: Request, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    const { courseId } = await params;
    const supabase = await createClient();
    const session = await getSession();
    
    if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const profile = session.profile;
    if (!profile?.university_id || (profile.role !== 'lecturer' && profile.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const service = new ReportService(supabase as any);
    const result = await service.getCourseProgress(profile.university_id, courseId);

    return NextResponse.json({ data: result }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
