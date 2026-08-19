'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth/guards';
import { inviteUserSchema, userRoleUpdateSchema } from '@/lib/validation/admin';
import { AuditService } from '@/lib/audit/audit.service';
import { actionError, actionSuccess } from '@/lib/api/response';
import { revalidatePath } from 'next/cache';
import { sendUserInvite } from '@/lib/auth/invites';
import { AuthRole } from '@/types/auth';
import { getEmailLinkOrigin } from '@/lib/tenant/origin';
import { getTenantContext } from '@/lib/tenant/context';

const universityAdminInvitableRoles: AuthRole[] = ['student', 'lecturer', 'department_admin', 'admin'];

export async function updateUserRoleAction(userId: string, payload: unknown) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const session = await requireRole('department_admin');
    
    // Admins can only manage their own university users. (Assuming here, SuperAdmin might do more)
    
    const parsed = userRoleUpdateSchema.parse(payload);
    
    const universityId = session.universityId;
    if (!universityId) throw new Error('Forbidden');

    // A role is held at an organisation, so this can only reach the membership
    // for this one. The person's standing elsewhere is not ours to change.
    const { data: membership, error: membershipErr } = await adminClient
      .from('memberships')
      .select('user_id')
      .eq('user_id', userId)
      .eq('university_id', universityId)
      .is('deleted_at', null)
      .maybeSingle();
    if (!membership || membershipErr) throw new Error('User not found');

    const { error: updateErr } = await adminClient.from('memberships')
      .update({ role: parsed.role, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('university_id', universityId);

    if (updateErr) throw new Error(updateErr.message);

    const auditService = new AuditService(supabase as any);
    await auditService.logAction({
      universityId,
      userId: session.user.id,
      action: 'ADMIN_USER_ROLE_CHANGED',
      entityType: 'memberships',
      entityId: userId,
      metadata: { new_role: parsed.role }
    });
    
    revalidatePath(`/admin/users`);
    return actionSuccess({ success: true });
  } catch (error) {
    return actionError(error);
  }
}

export async function inviteUserAction(payload: unknown) {
  try {
    const session = await requireRole('department_admin');
    const parsed = inviteUserSchema.parse(payload);

    const currentRole = session.role;
    const targetUniversityId = currentRole === 'super_admin'
      ? parsed.universityId ?? null
      : session.universityId;

    if (currentRole !== 'super_admin' && !universityAdminInvitableRoles.includes(parsed.role)) {
      throw new Error('University admins cannot invite users with that role.');
    }

    if (parsed.role === 'super_admin' && currentRole !== 'super_admin') {
      throw new Error('Only super admins can invite platform administrators.');
    }

    if (parsed.role !== 'super_admin' && !targetUniversityId) {
      throw new Error('A university is required for this invite.');
    }

    const tenant = await getTenantContext();

    const invite = await sendUserInvite({
      email: parsed.email,
      role: parsed.role,
      universityId: targetUniversityId,
      firstName: parsed.firstName || undefined,
      lastName: parsed.lastName || undefined,
      // Named in the email when the address already has an account, so the
      // person can tell which organisation just added them.
      organisationName: tenant?.name || 'your new organisation',
      // Without this the invitation lands on the platform root, where the
      // person it was sent to has no account and no school.
      baseUrl: await getEmailLinkOrigin(),
    });

    revalidatePath('/admin/users');
    revalidatePath('/admin/students');
    revalidatePath('/admin/lecturers');

    return actionSuccess({
      id: invite.userId,
      email: parsed.email,
      role: parsed.role,
    });
  } catch (error) {
    return actionError(error);
  }
}
