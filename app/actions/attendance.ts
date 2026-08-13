'use server'

import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/guards';
import { markAttendanceSchema } from '@/lib/validation/attendance';
import { AttendanceService } from '@/lib/services/attendance.service';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const createAttendanceSessionSchema = z.object({
  courseSectionId: z.string().uuid(),
  title: z.string().min(2),
  date: z.string(),
  liveClassId: z.string().uuid().optional(),
});

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

export async function createAttendanceSessionAction(payload: any) {
  const supabase = await createClient();
  const session = await requireRole('lecturer');
  const parsed = createAttendanceSessionSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { data: assignment } = await supabase
    .from('course_lecturers')
    .select('id')
    .eq('course_section_id', parsed.data.courseSectionId)
    .eq('lecturer_id', session.user.id)
    .maybeSingle();
  if (!assignment) return { error: 'Unauthorized course section.' };

  const { data, error } = await supabase.from('attendance_sessions').insert({
    university_id: session.profile.university_id,
    course_section_id: parsed.data.courseSectionId,
    live_class_id: parsed.data.liveClassId || null,
    date: parsed.data.date,
    title: parsed.data.title,
  }).select().single();
  if (error) return { error: error.message };
  revalidatePath('/lecturer/attendance');
  return { success: true, session: data };
}
