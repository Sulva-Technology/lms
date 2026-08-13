import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth/session';
import { submitAssignmentSchema } from '@/lib/validation/submission';
import { SubmissionService } from '@/lib/services/submission.service';

export async function POST(req: Request, { params }: { params: Promise<{ assignmentId: string }> }) {
  try {
    const { assignmentId } = await params;
    const body = await req.json();
    const parsed = submitAssignmentSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const supabase = await createClient();
    const session = await getSession();
    
    if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const profile = session.profile;
    if (!profile?.university_id || profile.role !== 'student') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const service = new SubmissionService(supabase as any);
    const result = await service.submitAssignment(profile.university_id, session.user.id, assignmentId, parsed.data.content, parsed.data.files);

    return NextResponse.json({ data: result }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
