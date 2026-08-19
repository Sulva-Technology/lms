import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth/session';
import { markAttendanceSchema } from '@/lib/validation/attendance';
import { AttendanceService } from '@/lib/services/attendance.service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = markAttendanceSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const supabase = await createClient();
    const session = await getSession();
    
    if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!session.universityId || session.role !== 'lecturer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const service = new AttendanceService(supabase as any);
    const result = await service.markAttendance(session.universityId, session.user.id, parsed.data);

    return NextResponse.json({ data: result }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
