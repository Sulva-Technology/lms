import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth/session';
import { gradeSubmissionSchema } from '@/lib/validation/grade';
import { GradeService } from '@/lib/services/grade.service';

export async function POST(req: Request, { params }: { params: Promise<{ submissionId: string }> }) {
  try {
    const { submissionId } = await params;
    const body = await req.json();
    const parsed = gradeSubmissionSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const supabase = await createClient();
    const session = await getSession();
    
    if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!session.universityId || session.role !== 'lecturer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const service = new GradeService(supabase as any);
    const result = await service.gradeSubmission(
      session.universityId, 
      session.user.id, 
      submissionId, 
      parsed.data.score, 
      parsed.data.feedback, 
      parsed.data.feedbackFileUrls
    );

    return NextResponse.json({ data: result }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
