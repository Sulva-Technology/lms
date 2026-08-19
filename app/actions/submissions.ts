'use server'

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth/guards';
import { SubmissionService } from '@/lib/services/submission.service';
import { NotificationService } from '@/lib/services/notification.service';
import { submitAssignmentSchema } from '@/lib/validation/submission';
import { renderSubmissionReceivedEmail } from '@/lib/email/templates';
import { env } from '@/lib/env';
import { revalidatePath } from 'next/cache';

export async function submitAssignmentAction(assignmentId: string, payload: any) {
    const supabase = await createClient();
    const session = await requireRole('student');

    const parsed = submitAssignmentSchema.safeParse(payload);
    if (!parsed.success) return { error: parsed.error.issues[0].message };

    if (!parsed.data.content?.trim() && (parsed.data.files || []).length === 0) {
        return { error: 'Add a written answer or attach at least one file.' };
    }

    const service = new SubmissionService(supabase as any);
    let submission: any;

    try {
        submission = await service.submitAssignment(
            session.universityId!,
            session.user.id,
            assignmentId,
            parsed.data.content,
            parsed.data.files,
        );
    } catch (err: any) {
        return { error: err.message };
    }

    // Notifying lecturers is a courtesy, not part of the submission contract:
    // a failure here must not tell the student their work was rejected.
    try {
        await notifyLecturers(supabase, session, assignmentId, submission);
    } catch (error) {
        console.error('[submissions] lecturer notification failed', error);
    }

    revalidatePath(`/student/assignments/${assignmentId}`);
    revalidatePath('/student/assignments');
    return { success: true, submission };
}

async function notifyLecturers(supabase: any, session: any, assignmentId: string, submission: any) {
    if (!submission?.course_section_id) return;

    const { data: lecturers } = await supabase
        .from('course_lecturers')
        .select('lecturer_id')
        .eq('course_section_id', submission.course_section_id);

    if (!lecturers || lecturers.length === 0) return;

    const { data: assignment } = await supabase
        .from('assignments')
        .select('title')
        .eq('id', assignmentId)
        .maybeSingle();

    const studentName =
        [session.profile.first_name, session.profile.last_name].filter(Boolean).join(' ') || 'A student';
    const assignmentTitle = assignment?.title || 'an assignment';
    const url = `${env.NEXT_PUBLIC_APP_URL}/lecturer/assignments/${assignmentId}/submissions`;

    // Service-role: `notifications` has no INSERT policy, because a user must
    // never be able to write rows addressed to somebody else.
    const notifications = new NotificationService(createAdminClient() as any);
    for (const lecturer of lecturers) {
        await notifications.createNotification({
            universityId: session.universityId!,
            userId: lecturer.lecturer_id,
            title: 'New submission received',
            message: `${studentName} submitted work for "${assignmentTitle}".`,
            type: 'assignment',
            linkUrl: `/lecturer/assignments/${assignmentId}/submissions`,
            email: ({ name }) =>
                renderSubmissionReceivedEmail({
                    lecturerName: name,
                    studentName,
                    assignmentTitle,
                    url,
                }),
        });
    }
}
