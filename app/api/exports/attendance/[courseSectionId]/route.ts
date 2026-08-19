import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth/session';
import { ExportService } from '@/lib/services/export.service';

export async function GET(req: Request, { params }: { params: Promise<{ courseSectionId: string }> }) {
  try {
    const { courseSectionId } = await params;
    const supabase = await createClient();
    const session = await getSession();

    if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!session.universityId || (session.role !== 'lecturer' && session.role !== 'admin')) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const service = new ExportService(supabase as any);
    const csvContent = await service.generateStudentAttendanceCSV(courseSectionId, session.user.id);

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="attendance-${courseSectionId}.csv"`,
      },
    });
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}
