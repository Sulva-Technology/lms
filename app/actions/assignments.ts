'use server'

import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/guards';
import { AssignmentService } from '@/lib/services/assignment.service';
import { createAssignmentSchema, updateAssignmentSchema } from '@/lib/validation/assignment';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const submitAssignmentSchema = z.object({
    assignmentId: z.string().uuid(),
    content: z.string().optional(),
    fileUrls: z.array(z.string().url()).optional(),
});

export async function createAssignmentAction(payload: any) {
    const supabase = await createClient();
    const session = await requireRole('lecturer');

    const parsed = createAssignmentSchema.safeParse(payload);
    if (!parsed.success) return { error: parsed.error.issues[0].message };
    
    const service = new AssignmentService(supabase as any);
    try {
        const result = await service.createAssignment(session.profile!.university_id!, session.user!.id, parsed.data as any);
        revalidatePath(`/courses/${parsed.data.courseSectionId}`);
        return { success: true, assignment: result };
    } catch (err: any) {
        return { error: err.message };
    }
}

export async function toggleAssignmentPublishAction(assignmentId: string, isPublished: boolean) {
    const supabase = await createClient();
    const session = await requireRole('lecturer');

    const service = new AssignmentService(supabase as any);
    try {
        await service.togglePublish(session.profile!.university_id!, session.user!.id, assignmentId, isPublished);
        revalidatePath(`/assignments`);
        return { success: true };
    } catch (err: any) {
        return { error: err.message };
    }
}

export async function updateAssignmentAction(payload: any) {
    const supabase = await createClient();
    const session = await requireRole('lecturer');
    const parsed = updateAssignmentSchema.extend({ id: z.string().uuid() }).safeParse(payload);
    if (!parsed.success) return { error: parsed.error.issues[0].message };

    const service = new AssignmentService(supabase as any);
    try {
        const { id, ...data } = parsed.data;
        const result = await service.updateAssignment(session.profile!.university_id!, session.user.id, id, data as any);
        revalidatePath('/lecturer/assignments');
        return { success: true, assignment: result };
    } catch (err: any) {
        return { error: err.message };
    }
}

export async function archiveAssignmentAction(payload: { id: string }) {
    const supabase = await createClient();
    const session = await requireRole('lecturer');

    try {
        const result = await new AssignmentService(supabase as any).archiveAssignment(session.profile!.university_id!, session.user.id, payload.id);
        revalidatePath('/lecturer/assignments');
        return { success: true, assignment: result };
    } catch (err: any) {
        return { error: err.message };
    }
}

export async function submitAssignmentAction(payload: any) {
    const supabase = await createClient();
    const session = await requireRole('student');
    const parsed = submitAssignmentSchema.safeParse(payload);
    if (!parsed.success) return { error: parsed.error.issues[0].message };

    const { data: assignment, error: assignmentError } = await supabase
        .from('assignments')
        .select('id, university_id, course_section_id, due_date, allow_late_submissions')
        .eq('id', parsed.data.assignmentId)
        .single();
    if (assignmentError) return { error: assignmentError.message };

    const { data: enrollment } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('course_section_id', assignment.course_section_id)
        .eq('student_id', session.user.id)
        .eq('status', 'active')
        .maybeSingle();
    if (!enrollment) return { error: 'You are not enrolled in this course section.' };

    const isLate = new Date(assignment.due_date).getTime() < Date.now();
    if (isLate && !assignment.allow_late_submissions) return { error: 'Late submissions are closed for this assignment.' };

    const { error } = await supabase.from('assignment_submissions').upsert({
        university_id: assignment.university_id,
        assignment_id: assignment.id,
        student_id: session.user.id,
        content: parsed.data.content || null,
        file_urls: parsed.data.fileUrls || [],
        status: 'submitted',
        submitted_at: new Date().toISOString(),
    }, { onConflict: 'assignment_id,student_id' });

    if (error) return { error: error.message };
    revalidatePath('/student/assignments');
    return { success: true };
}
