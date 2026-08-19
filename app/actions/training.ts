'use server';

import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/guards';
import { TrainingAssignmentService } from '@/lib/services/training-assignment.service';
import { NotificationService } from '@/lib/services/notification.service';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const assignSchema = z.object({
  courseSectionId: z.string().uuid(),
  studentId: z.string().uuid(),
  dueOn: z.string().date().optional().nullable(),
});

const assignTeamSchema = z.object({
  courseSectionId: z.string().uuid(),
  departmentId: z.string().uuid(),
  dueOn: z.string().date().optional().nullable(),
});

const cancelSchema = z.object({ assignmentId: z.string().uuid() });

/**
 * Notifications have no INSERT policy by design, so every cross-user notice
 * goes through the service role. A missed notice never undoes an assignment.
 */
async function notifyAssigned(universityId: string, studentId: string, dueOn?: string | null) {
  try {
    await new NotificationService(createAdminClient() as any).createNotification({
      universityId,
      userId: studentId,
      title: 'Training assigned',
      message: dueOn
        ? `You have training to complete by ${new Date(dueOn).toLocaleDateString()}.`
        : 'You have new training to complete.',
      type: 'course',
      linkUrl: '/student/training',
    });
  } catch {
    // Deliberately ignored.
  }
}

export async function assignTrainingAction(payload: unknown) {
  const parsed = assignSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    const supabase = await createClient();
    const session = await requireRole('lecturer');
    const universityId = session.universityId!;

    const assignment = await new TrainingAssignmentService(supabase as any).assign({
      universityId,
      courseSectionId: parsed.data.courseSectionId,
      studentId: parsed.data.studentId,
      dueOn: parsed.data.dueOn,
      assignedBy: session.user!.id,
    });

    await notifyAssigned(universityId, parsed.data.studentId, parsed.data.dueOn);

    revalidatePath('/admin/compliance');
    revalidatePath('/student/training');
    return { success: true, assignment };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function assignTeamTrainingAction(payload: unknown) {
  const parsed = assignTeamSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    const supabase = await createClient();
    const session = await requireRole('lecturer');
    const universityId = session.universityId!;

    const assignments = await new TrainingAssignmentService(supabase as any).assignTeam({
      universityId,
      courseSectionId: parsed.data.courseSectionId,
      departmentId: parsed.data.departmentId,
      dueOn: parsed.data.dueOn,
      assignedBy: session.user!.id,
    });

    for (const assignment of assignments) {
      await notifyAssigned(universityId, assignment.student_id, parsed.data.dueOn);
    }

    revalidatePath('/admin/compliance');
    revalidatePath('/student/training');
    return { success: true, assignments };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function cancelTrainingAssignmentAction(payload: unknown) {
  const parsed = cancelSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    const supabase = await createClient();
    const session = await requireRole('lecturer');
    await new TrainingAssignmentService(supabase as any).cancel(parsed.data.assignmentId, session.user!.id);

    revalidatePath('/admin/compliance');
    revalidatePath('/student/training');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
