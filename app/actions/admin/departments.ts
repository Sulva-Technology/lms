'use server';

import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/guards';
import { departmentSchema } from '@/lib/validation/admin';
import { DepartmentService } from '@/lib/services/admin/department.service';
import { AuditService } from '@/lib/audit/audit.service';
import { actionError, actionSuccess } from '@/lib/api/response';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const departmentMutationSchema = departmentSchema.extend({ id: z.string().uuid().optional() });
const departmentIdSchema = z.object({ id: z.string().uuid() });

export async function createDepartmentAction(payload: unknown) {
  try {
    const supabase = await createClient();
    const session = await requireRole('department_admin');
    const data = departmentMutationSchema.parse(payload);
    const result = await new DepartmentService(supabase as any).createDepartment(session.universityId!, data);

    await new AuditService(supabase as any).logAction({
      universityId: session.universityId!,
      userId: session.user!.id,
      action: 'ADMIN_DEPARTMENT_CREATED',
      entityType: 'departments',
      entityId: result.id,
    });

    revalidatePath('/admin/departments');
    return actionSuccess(result);
  } catch (error) {
    return actionError(error);
  }
}

export async function updateDepartmentAction(payload: unknown) {
  try {
    const supabase = await createClient();
    const session = await requireRole('department_admin');
    const data = departmentMutationSchema.required({ id: true }).parse(payload);
    const result = await new DepartmentService(supabase as any).updateDepartment(session.universityId!, data.id, data);

    await new AuditService(supabase as any).logAction({
      universityId: session.universityId!,
      userId: session.user!.id,
      action: 'ADMIN_DEPARTMENT_UPDATED',
      entityType: 'departments',
      entityId: result.id,
    });

    revalidatePath('/admin/departments');
    return actionSuccess(result);
  } catch (error) {
    return actionError(error);
  }
}

export async function archiveDepartmentAction(payload: unknown) {
  try {
    const supabase = await createClient();
    const session = await requireRole('department_admin');
    const { id } = departmentIdSchema.parse(payload);
    const result = await new DepartmentService(supabase as any).archiveDepartment(session.universityId!, id);

    await new AuditService(supabase as any).logAction({
      universityId: session.universityId!,
      userId: session.user!.id,
      action: 'ADMIN_DEPARTMENT_ARCHIVED',
      entityType: 'departments',
      entityId: result.id,
    });

    revalidatePath('/admin/departments');
    return actionSuccess(result);
  } catch (error) {
    return actionError(error);
  }
}

export async function restoreDepartmentAction(payload: unknown) {
  try {
    const supabase = await createClient();
    const session = await requireRole('department_admin');
    const { id } = departmentIdSchema.parse(payload);
    const result = await new DepartmentService(supabase as any).restoreDepartment(session.universityId!, id);

    await new AuditService(supabase as any).logAction({
      universityId: session.universityId!,
      userId: session.user!.id,
      action: 'ADMIN_DEPARTMENT_UPDATED',
      entityType: 'departments',
      entityId: result.id,
      metadata: { restored: true },
    });

    revalidatePath('/admin/departments');
    return actionSuccess(result);
  } catch (error) {
    return actionError(error);
  }
}
