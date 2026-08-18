'use server'

import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/guards';
import { markAttendanceSchema } from '@/lib/validation/attendance';
import { AttendanceService } from '@/lib/services/attendance.service';
import { revalidatePath } from 'next/cache';

export async function markAttendanceAction(payload: any) {
  const supabase = await createClient();
  const session = await requireRole('lecturer');

  const parsed = markAttendanceSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  
  const service = new AttendanceService(supabase as any);
  try {
      const result = await service.markAttendance(session.profile!.university_id!, session.user!.id, parsed.data);
      revalidatePath(`/courses/sections/${parsed.data.courseSectionId}`);
      return { success: true, ...result };
  } catch (err: any) {
      return { error: err.message };
  }
}

export async function calculateLiveClassAttendanceAction(liveClassId: string) {
  const supabase = await createClient();
  const session = await requireRole('lecturer');

  const service = new AttendanceService(supabase as any);
  try {
      const result = await service.calculateFromLiveClass(session.profile!.university_id!, session.user!.id, liveClassId);
      revalidatePath(`/live-classes`);
      return { success: true, ...result };
  } catch (err: any) {
      return { error: err.message };
  }
}

export async function getAttendanceHistoryAction(sessionId: string) {
  const supabase = await createClient();
  const session = await requireRole('lecturer');

  const service = new AttendanceService(supabase as any);
  try {
      const changes = await service.getSessionHistory(sessionId, session.user!.id);
      return { success: true, changes };
  } catch (err: any) {
      return { error: err.message };
  }
}
