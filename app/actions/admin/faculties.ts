'use server';

import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/guards';
import { facultySchema } from '@/lib/validation/admin';
import { FacultyService } from '@/lib/services/admin/faculty.service';
import { AuditService } from '@/lib/audit/audit.service';
import { actionError, actionSuccess } from '@/lib/api/response';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const facultyMutationSchema = facultySchema.extend({ id: z.string().uuid().optional() });
const facultyIdSchema = z.object({ id: z.string().uuid() });

export async function createFacultyAction(payload: unknown) {
  try {
    const supabase = await createClient();
    const session = await requireRole('department_admin');
    const data = facultyMutationSchema.parse(payload);
    
    const service = new FacultyService(supabase as any);
    const result = await service.createFaculty(session.universityId!, data);
    
    const audit = new AuditService(supabase as any);
    await audit.logAction({
      universityId: session.universityId!,
      userId: session.user!.id,
      action: 'ADMIN_FACULTY_CREATED',
      entityType: 'faculties',
      entityId: result.id
    });

    revalidatePath('/admin/faculties');
    return actionSuccess(result);
  } catch (error) {
    return actionError(error);
  }
}

export async function updateFacultyAction(payload: unknown) {
  try {
    const supabase = await createClient();
    const session = await requireRole('department_admin');
    const data = facultyMutationSchema.required({ id: true }).parse(payload);

    const service = new FacultyService(supabase as any);
    const result = await service.updateFaculty(session.universityId!, data.id, data);

    await new AuditService(supabase as any).logAction({
      universityId: session.universityId!,
      userId: session.user!.id,
      action: 'ADMIN_FACULTY_UPDATED',
      entityType: 'faculties',
      entityId: result.id,
    });

    revalidatePath('/admin/faculties');
    return actionSuccess(result);
  } catch (error) {
    return actionError(error);
  }
}

export async function archiveFacultyAction(payload: unknown) {
  try {
    const supabase = await createClient();
    const session = await requireRole('department_admin');
    const { id } = facultyIdSchema.parse(payload);
    const result = await new FacultyService(supabase as any).archiveFaculty(session.universityId!, id);

    await new AuditService(supabase as any).logAction({
      universityId: session.universityId!,
      userId: session.user!.id,
      action: 'ADMIN_FACULTY_ARCHIVED',
      entityType: 'faculties',
      entityId: result.id,
    });

    revalidatePath('/admin/faculties');
    return actionSuccess(result);
  } catch (error) {
    return actionError(error);
  }
}

export async function restoreFacultyAction(payload: unknown) {
  try {
    const supabase = await createClient();
    const session = await requireRole('department_admin');
    const { id } = facultyIdSchema.parse(payload);
    const result = await new FacultyService(supabase as any).restoreFaculty(session.universityId!, id);

    await new AuditService(supabase as any).logAction({
      universityId: session.universityId!,
      userId: session.user!.id,
      action: 'ADMIN_FACULTY_UPDATED',
      entityType: 'faculties',
      entityId: result.id,
      metadata: { restored: true },
    });

    revalidatePath('/admin/faculties');
    return actionSuccess(result);
  } catch (error) {
    return actionError(error);
  }
}
