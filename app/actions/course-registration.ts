'use server'

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { submitRegistrationSchema, adminApprovalSchema } from '@/lib/validation/course-registration';
import { CourseRegistrationService } from '@/lib/services/course-registration.service';
import { requireRole } from '@/lib/auth/guards';
import { revalidatePath } from 'next/cache';

export async function submitCourseRegistrationAction(formData: object) {
    const supabase = await createClient();
    const session = await requireRole('student');
    const studentId = session.profile!.id;
    const universityId = session.universityId;

    if (!universityId) return { error: 'No university context found.' };

    const parsed = submitRegistrationSchema.safeParse(formData);
    if (!parsed.success) return { error: parsed.error.issues[0].message };

    const service = new CourseRegistrationService(supabase as any);
    try {
        await service.submitRegistration(studentId, universityId, parsed.data.semesterId, parsed.data.courseSectionIds);
        revalidatePath('/student');
        revalidatePath('/student/registration');
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function approveRegistrationAction(formData: object) {
    const session = await requireRole('department_admin');
    const parsed = adminApprovalSchema.safeParse(formData);
    if (!parsed.success) return { error: parsed.error.issues[0].message };
    
    // We use the admin client to bypass the RLS restriction on changing course_registrations statuses
    const adminClient = createAdminClient();
    const service = new CourseRegistrationService(adminClient as any);
    
    try {
        if (parsed.data.status === 'approved') {
            await service.approveRegistration(session.user!.id, session.universityId!, parsed.data.registrationId);
        } else {
            await adminClient.from('course_registrations').update({ status: parsed.data.status }).eq('id', parsed.data.registrationId);
            await adminClient.from('audit_logs').insert({
               user_id: session.user!.id, university_id: session.universityId,
               action: 'REJECT_REGISTRATION', entity_type: 'course_registrations', entity_id: parsed.data.registrationId
            });
        }
        revalidatePath('/admin/registration');
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}
