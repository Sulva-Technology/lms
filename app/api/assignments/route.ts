import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth/session';
import { createAssignmentSchema } from '@/lib/validation/assignment';
import { AssignmentService } from '@/lib/services/assignment.service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = createAssignmentSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const supabase = await createClient();
    const session = await getSession();
    
    if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const profile = session.profile;
    if (!profile?.university_id || profile.role !== 'lecturer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const service = new AssignmentService(supabase as any);
    const result = await service.createAssignment(profile.university_id, session.user.id, parsed.data as any);

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
