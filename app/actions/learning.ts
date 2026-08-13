'use server'

import { createClient } from '@/lib/supabase/server';
import { LearningService } from '@/lib/services/learning.service';
import { requireUser, requireRole } from '@/lib/auth/guards';
import { createLessonSchema, createModuleSchema, lessonMaterialSchema, updateProgressSchema, studentNoteSchema } from '@/lib/validation/learning';
import { revalidatePath } from 'next/cache';

export async function getStudentCoursesAction(semesterId?: string) {
    const supabase = await createClient();
    const session = await requireUser();
    const service = new LearningService(supabase as any);
    return service.getEnrolledCourses(session.user!.id, semesterId);
}

export async function getCourseContentAction(courseId: string) {
    const supabase = await createClient();
    const session = await requireUser();
    const service = new LearningService(supabase as any);
    
    // Student filters unpublished lessons. Lecturers/Admins view all.
    const isStudent = session.profile?.role === 'student';
    return service.getCourseContent(courseId, isStudent);
}

export async function updateLessonProgressAction(payload: { lessonId: string, isCompleted: boolean }) {
    const supabase = await createClient();
    const session = await requireUser();
    
    const parsed = updateProgressSchema.safeParse(payload);
    if (!parsed.success) return { error: parsed.error.issues[0].message };
    
    const service = new LearningService(supabase as any);
    try {
        await service.saveProgress(session.profile!.university_id!, session.user!.id, parsed.data.lessonId, parsed.data.isCompleted);
        revalidatePath(`/courses`);
        return { success: true };
    } catch (err: any) {
        return { error: err.message };
    }
}

export async function upsertModuleAction(payload: unknown) {
    const supabase = await createClient();
    const session = await requireRole('lecturer');
    const parsed = createModuleSchema.safeParse(payload);
    if (!parsed.success) return { error: parsed.error.issues[0].message };

    try {
        const service = new LearningService(supabase as any);
        const result = await service.upsertModule(session.profile!.university_id!, session.user.id, parsed.data);
        revalidatePath('/lecturer/courses');
        return { success: true, data: result };
    } catch (err: any) {
        return { error: err.message };
    }
}

export async function archiveModuleAction(payload: { id: string }) {
    const supabase = await createClient();
    const session = await requireRole('lecturer');
    try {
        const result = await new LearningService(supabase as any).archiveModule(payload.id, session.user.id);
        revalidatePath('/lecturer/courses');
        return { success: true, data: result };
    } catch (err: any) {
        return { error: err.message };
    }
}

export async function upsertLessonAction(payload: unknown) {
    const supabase = await createClient();
    const session = await requireRole('lecturer');
    const parsed = createLessonSchema.safeParse(payload);
    if (!parsed.success) return { error: parsed.error.issues[0].message };

    try {
        const result = await new LearningService(supabase as any).upsertLesson(session.profile!.university_id!, session.user.id, parsed.data);
        revalidatePath('/lecturer/courses');
        return { success: true, data: result };
    } catch (err: any) {
        return { error: err.message };
    }
}

export async function archiveLessonAction(payload: { id: string }) {
    const supabase = await createClient();
    const session = await requireRole('lecturer');
    try {
        const result = await new LearningService(supabase as any).archiveLesson(payload.id, session.user.id);
        revalidatePath('/lecturer/courses');
        return { success: true, data: result };
    } catch (err: any) {
        return { error: err.message };
    }
}

export async function attachLessonMaterialAction(payload: unknown) {
    const supabase = await createClient();
    const session = await requireRole('lecturer');
    const parsed = lessonMaterialSchema.safeParse(payload);
    if (!parsed.success) return { error: parsed.error.issues[0].message };

    try {
        const result = await new LearningService(supabase as any).upsertLessonMaterial(session.profile!.university_id!, session.user.id, parsed.data);
        revalidatePath('/lecturer/courses');
        return { success: true, data: result };
    } catch (err: any) {
        return { error: err.message };
    }
}

export async function detachLessonMaterialAction(payload: { id: string }) {
    const supabase = await createClient();
    const session = await requireRole('lecturer');
    try {
        const result = await new LearningService(supabase as any).archiveLessonMaterial(payload.id, session.user.id);
        revalidatePath('/lecturer/courses');
        return { success: true, data: result };
    } catch (err: any) {
        return { error: err.message };
    }
}

export async function saveStudentNoteAction(payload: any) {
    const supabase = await createClient();
    const session = await requireUser();
    
    const parsed = studentNoteSchema.safeParse(payload);
    if (!parsed.success) return { error: parsed.error.issues[0].message };

    try {
        await supabase.from('student_notes').insert({
            university_id: session.profile!.university_id!,
            student_id: session.user!.id,
            lesson_id: parsed.data.lessonId,
            content: parsed.data.content,
            video_timestamp: parsed.data.videoTimestamp || null
        });
        return { success: true };
    } catch (err: any) {
        return { error: err.message };
    }
}
