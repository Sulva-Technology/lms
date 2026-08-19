'use server';

import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/guards';
import { AuditService } from '@/lib/audit/audit.service';
import { actionError, actionSuccess } from '@/lib/api/response';
import { bootstrapAcademicStructure } from '@/lib/services/tenant-bootstrap';
import { revalidatePath } from 'next/cache';

/**
 * Creates the default faculty, department, session and term a tenant needs
 * before it can publish a course. Safe to run more than once.
 */
export async function bootstrapAcademicStructureAction() {
  try {
    const supabase = await createClient();
    const session = await requireRole('department_admin');
    const universityId = session.universityId!;

    const result = await bootstrapAcademicStructure(supabase as any, universityId);

    if (result.created) {
      await new AuditService(supabase as any).logAction({
        universityId,
        userId: session.user!.id,
        action: 'ADMIN_STRUCTURE_BOOTSTRAPPED',
        entityType: 'departments',
        entityId: result.departmentId ?? undefined,
      });
    }

    revalidatePath('/admin');
    revalidatePath('/admin/faculties');
    revalidatePath('/admin/departments');
    revalidatePath('/admin/courses');

    return actionSuccess(result);
  } catch (error) {
    return actionError(error);
  }
}
