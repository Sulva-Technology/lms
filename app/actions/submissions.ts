'use server'

import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/guards';
import { SubmissionService } from '@/lib/services/submission.service';
import { submitAssignmentSchema } from '@/lib/validation/submission';
import { revalidatePath } from 'next/cache';

export async function submitAssignmentAction(assignmentId: string, payload: any) {
    const supabase = await createClient();
    const session = await requireRole('student');

    const parsed = submitAssignmentSchema.safeParse(payload);
    if (!parsed.success) return { error: parsed.error.issues[0].message };
    
    const service = new SubmissionService(supabase as any);
    try {
        const result = await service.submitAssignment(
            session.profile!.university_id!, 
            session.user!.id, 
            assignmentId, 
            parsed.data.content, 
            parsed.data.fileUrls
        );
        revalidatePath(`/assignments/${assignmentId}`);
        return { success: true, submission: result };
    } catch (err: any) {
        return { error: err.message };
    }
}
