import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth/session';
import { submitRegistrationSchema } from '@/lib/validation/course-registration';
import { CourseRegistrationService } from '@/lib/services/course-registration.service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = submitRegistrationSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const supabase = await createClient();
    const session = await getSession();
    
    if (!session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = session.profile;
    if (!profile?.university_id) {
      return NextResponse.json({ error: 'No university assigned' }, { status: 403 });
    }

    const service = new CourseRegistrationService(supabase as any);
    const result = await service.submitRegistration(session.user.id, profile.university_id, parsed.data.semesterId, parsed.data.courseSectionIds);

    return NextResponse.json({ data: result }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
