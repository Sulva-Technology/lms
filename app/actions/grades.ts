'use server'

import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/guards';
import { GradeService } from '@/lib/services/grade.service';
import { NotificationService } from '@/lib/services/notification.service';
import { gradeSubmissionSchema } from '@/lib/validation/grade';
import { renderGradePostedEmail } from '@/lib/email/templates';
import { env } from '@/lib/env';
import { revalidatePath } from 'next/cache';

export async function gradeSubmissionAction(submissionId: string, payload: any) {
    const supabase = await createClient();
    const session = await requireRole('lecturer');

    const parsed = gradeSubmissionSchema.safeParse(payload);
    if (!parsed.success) return { error: parsed.error.issues[0].message };

    const service = new GradeService(supabase as any);
    let result: any;

    try {
        result = await service.gradeSubmission(
            session.profile.university_id!,
            session.user.id,
            submissionId,
            parsed.data.score,
            parsed.data.feedback,
            parsed.data.feedbackFileUrls,
        );
    } catch (err: any) {
        return { error: err.message };
    }

    // Telling the student is a courtesy; a failure here must not read back as a
    // failed grading.
    try {
        if (result?.student_id) {
            const assignmentUrl = `/student/assignments/${result.assignment_id}`;
            const notifications = new NotificationService(supabase as any);

            await notifications.createNotification({
                universityId: session.profile.university_id!,
                userId: result.student_id,
                title: 'Your assignment has been graded',
                message: `You scored ${parsed.data.score} out of ${result.total_points ?? parsed.data.score}.`,
                type: 'grade',
                linkUrl: assignmentUrl,
                email: ({ name }) =>
                    renderGradePostedEmail({
                        studentName: name,
                        assignmentTitle: result.assignment_title || 'your assignment',
                        score: parsed.data.score,
                        totalPoints: result.total_points ?? parsed.data.score,
                        url: `${env.NEXT_PUBLIC_APP_URL}${assignmentUrl}`,
                    }),
            });
        }
    } catch (error) {
        console.error('[grades] student notification failed', error);
    }

    if (result?.assignment_id) {
        revalidatePath(`/lecturer/assignments/${result.assignment_id}/submissions`);
        revalidatePath(`/student/assignments/${result.assignment_id}`);
    }
    revalidatePath('/lecturer/gradebook');

    return { success: true, submission: result };
}
