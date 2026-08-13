'use server';

import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/guards';
import { programSchema } from '@/lib/validation/admin';
import { ProgramService } from '@/lib/services/admin/program.service';
import { AuditService } from '@/lib/audit/audit.service';
import { actionError, actionSuccess } from '@/lib/api/response';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const programMutationSchema = programSchema.extend({ id: z.string().uuid().optional() });
const programIdSchema = z.object({ id: z.string().uuid() });

export async function createProgramAction(payload: unknown) {
  try {
    const supabase = await createClient();
    const session = await requireRole('department_admin');
    const data = programMutationSchema.parse(payload);
    const result = await new ProgramService(supabase as any).createProgram(session.profile!.university_id!, data);

    await new AuditService(supabase as any).logAction({
      universityId: session.profile!.university_id!,
      userId: session.user!.id,
      action: 'ADMIN_PROGRAM_CREATED',
      entityType: 'programs',
      entityId: result.id,
    });

    revalidatePath('/admin/programs');
    return actionSuccess(result);
  } catch (error) {
    return actionError(error);
  }
}

export async function updateProgramAction(payload: unknown) {
  try {
    const supabase = await createClient();
    const session = await requireRole('department_admin');
    const data = programMutationSchema.required({ id: true }).parse(payload);
    const result = await new ProgramService(supabase as any).updateProgram(session.profile!.university_id!, data.id, data);

    await new AuditService(supabase as any).logAction({
      universityId: session.profile!.university_id!,
      userId: session.user!.id,
      action: 'ADMIN_PROGRAM_UPDATED',
      entityType: 'programs',
      entityId: result.id,
    });

    revalidatePath('/admin/programs');
    return actionSuccess(result);
  } catch (error) {
    return actionError(error);
  }
}

export async function archiveProgramAction(payload: unknown) {
  try {
    const supabase = await createClient();
    const session = await requireRole('department_admin');
    const { id } = programIdSchema.parse(payload);
    const result = await new ProgramService(supabase as any).archiveProgram(session.profile!.university_id!, id);

    await new AuditService(supabase as any).logAction({
      universityId: session.profile!.university_id!,
      userId: session.user!.id,
      action: 'ADMIN_PROGRAM_ARCHIVED',
      entityType: 'programs',
      entityId: result.id,
    });

    revalidatePath('/admin/programs');
    return actionSuccess(result);
  } catch (error) {
    return actionError(error);
  }
}

export async function restoreProgramAction(payload: unknown) {
  try {
    const supabase = await createClient();
    const session = await requireRole('department_admin');
    const { id } = programIdSchema.parse(payload);
    const result = await new ProgramService(supabase as any).restoreProgram(session.profile!.university_id!, id);

    await new AuditService(supabase as any).logAction({
      universityId: session.profile!.university_id!,
      userId: session.user!.id,
      action: 'ADMIN_PROGRAM_UPDATED',
      entityType: 'programs',
      entityId: result.id,
      metadata: { restored: true },
    });

    revalidatePath('/admin/programs');
    return actionSuccess(result);
  } catch (error) {
    return actionError(error);
  }
}
