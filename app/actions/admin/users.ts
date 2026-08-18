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

const universityAdminInvitableRoles: AuthRole[] = ['student', 'lecturer', 'department_admin', 'admin'];

export async function updateUserRoleAction(userId: string, payload: unknown) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const session = await requireRole('department_admin');
    
    // Admins can only manage their own university users. (Assuming here, SuperAdmin might do more)
    
    const parsed = userRoleUpdateSchema.parse(payload);
    
    const { data: userProfile, error: profileErr } = await adminClient.from('profiles').select('university_id').eq('id', userId).single();
    if (!userProfile || profileErr) throw new Error('User not found');
    
    if (userProfile.university_id !== session.profile.university_id) {
       throw new Error('Forbidden'); // Trying to modify a user from another university
    }
    
    const { error: updateErr } = await adminClient.from('profiles')
      .update({ role: parsed.role })
      .eq('id', userId)
      .eq('university_id', session.profile.university_id); // double check
      
    if (updateErr) throw new Error(updateErr.message);

    const auditService = new AuditService(supabase as any);
    await auditService.logAction({
      universityId: session.profile.university_id!,
      userId: session.user.id,
      action: 'ADMIN_USER_ROLE_CHANGED',
      entityType: 'profiles',
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

    const currentRole = session.profile.role;
    const targetUniversityId = currentRole === 'super_admin'
      ? parsed.universityId ?? null
      : session.profile.university_id;

    if (currentRole !== 'super_admin' && !universityAdminInvitableRoles.includes(parsed.role)) {
      throw new Error('University admins cannot invite users with that role.');
    }

    if (parsed.role === 'super_admin' && currentRole !== 'super_admin') {
      throw new Error('Only super admins can invite platform administrators.');
    }

    if (parsed.role !== 'super_admin' && !targetUniversityId) {
      throw new Error('A university is required for this invite.');
    }

    const user = await sendUserInvite({
      email: parsed.email,
      role: parsed.role,
      universityId: targetUniversityId,
      firstName: parsed.firstName || undefined,
      lastName: parsed.lastName || undefined,
      // Without this the invitation lands on the platform root, where the
      // person it was sent to has no account and no school.
      baseUrl: await getEmailLinkOrigin(),
    });

    revalidatePath('/admin/users');
    revalidatePath('/admin/students');
    revalidatePath('/admin/lecturers');

    return actionSuccess({
      id: user?.id ?? null,
      email: parsed.email,
      role: parsed.role,
    });
  } catch (error) {
    return actionError(error);
  }
}
