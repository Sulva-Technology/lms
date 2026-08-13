'use server'

import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/guards';
import { GradeService } from '@/lib/services/grade.service';
import { gradeSubmissionSchema } from '@/lib/validation/grade';
import { revalidatePath } from 'next/cache';

export async function gradeSubmissionAction(submissionId: string, payload: any) {
    const supabase = await createClient();
    const session = await requireRole('lecturer');

    const parsed = gradeSubmissionSchema.safeParse(payload);
    if (!parsed.success) return { error: parsed.error.issues[0].message };
    
    const service = new GradeService(supabase as any);
    try {
        const result = await service.gradeSubmission(
            session.profile!.university_id!, 
            session.user!.id, 
            submissionId,
            parsed.data.score,
            parsed.data.feedback,
            parsed.data.feedbackFileUrls
        );
        revalidatePath(`/submissions/${submissionId}`);
        return { success: true, submission: result };
    } catch (err: any) {
        return { error: err.message };
    }
}
