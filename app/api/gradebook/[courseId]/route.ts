import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth/session';
import { GradebookService } from '@/lib/services/gradebook.service';

export async function GET(req: Request, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    const { courseId } = await params;
    const supabase = await createClient();
    const session = await getSession();
    
    if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const profile = session.profile;
    
    const service = new GradebookService(supabase as any);
    
    if (profile?.role === 'student') {
        const result = await service.getStudentGradeSummary(session.user.id, courseId);
        return NextResponse.json({ data: result }, { status: 200 });
    } else if (profile?.role === 'lecturer' || profile?.role === 'admin') {
        const result = await service.getCourseGrades(courseId, session.user.id);
        return NextResponse.json({ data: result }, { status: 200 });
    }

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
