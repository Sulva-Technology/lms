'use server';

import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/guards';
import { courseSchema, courseSectionSchema as sectionSchema } from '@/lib/validation/admin';
import { CourseService } from '@/lib/services/admin/course.service';
import { AuditService } from '@/lib/audit/audit.service';
import { actionError, actionSuccess } from '@/lib/api/response';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const courseMutationSchema = courseSchema.extend({ id: z.string().uuid().optional() });
const courseIdSchema = z.object({ id: z.string().uuid() });
const assignLecturerSchema = z.object({
  courseSectionId: z.string().uuid(),
  lecturerId: z.string().uuid(),
  isPrimary: z.boolean().default(false),
});

export async function createCourseAction(payload: unknown) {
  try {
    const supabase = await createClient();
    const session = await requireRole('department_admin');
    const data = courseMutationSchema.parse(payload);
    const result = await new CourseService(supabase as any).createCourse(session.universityId!, data);

    await new AuditService(supabase as any).logAction({
      universityId: session.universityId!,
      userId: session.user!.id,
      action: 'ADMIN_COURSE_CREATED',
      entityType: 'courses',
      entityId: result.id,
    });

    revalidatePath('/admin/courses');
    return actionSuccess(result);
  } catch (error) {
    return actionError(error);
  }
}

export async function updateCourseAction(payload: unknown) {
  try {
    const supabase = await createClient();
    const session = await requireRole('department_admin');
    const data = courseMutationSchema.required({ id: true }).parse(payload);
    const result = await new CourseService(supabase as any).updateCourse(session.universityId!, data.id, data);

    await new AuditService(supabase as any).logAction({
      universityId: session.universityId!,
      userId: session.user!.id,
      action: 'ADMIN_COURSE_UPDATED',
      entityType: 'courses',
      entityId: result.id,
    });

    revalidatePath('/admin/courses');
    return actionSuccess(result);
  } catch (error) {
    return actionError(error);
  }
}

export async function archiveCourseAction(payload: unknown) {
  try {
    const supabase = await createClient();
    const session = await requireRole('department_admin');
    const { id } = courseIdSchema.parse(payload);
    const result = await new CourseService(supabase as any).archiveCourse(session.universityId!, id);

    await new AuditService(supabase as any).logAction({
      universityId: session.universityId!,
      userId: session.user!.id,
      action: 'ADMIN_COURSE_ARCHIVED',
      entityType: 'courses',
      entityId: result.id,
    });

    revalidatePath('/admin/courses');
    return actionSuccess(result);
  } catch (error) {
    return actionError(error);
  }
}

export async function restoreCourseAction(payload: unknown) {
  try {
    const supabase = await createClient();
    const session = await requireRole('department_admin');
    const { id } = courseIdSchema.parse(payload);
    const result = await new CourseService(supabase as any).restoreCourse(session.universityId!, id);

    await new AuditService(supabase as any).logAction({
      universityId: session.universityId!,
      userId: session.user!.id,
      action: 'ADMIN_COURSE_UPDATED',
      entityType: 'courses',
      entityId: result.id,
      metadata: { restored: true },
    });

    revalidatePath('/admin/courses');
    return actionSuccess(result);
  } catch (error) {
    return actionError(error);
  }
}

export async function upsertCourseSectionAction(payload: unknown) {
  try {
    const supabase = await createClient();
    const session = await requireRole('department_admin');
    const data = sectionSchema.parse(payload);
    const row = {
      university_id: session.universityId!,
      course_id: data.courseId,
      semester_id: data.semesterId ?? null,
      name: data.name,
      capacity: data.capacity || null,
      starts_on: data.startsOn ?? null,
      ends_on: data.endsOn ?? null,
      deleted_at: null,
    };

    const query = data.id
      ? supabase.from('course_sections').update(row).eq('id', data.id).eq('university_id', session.universityId!)
      : supabase.from('course_sections').insert(row);
    const { data: result, error } = await query.select().single();
    if (error) throw error;

    await new AuditService(supabase as any).logAction({
      universityId: session.universityId!,
      userId: session.user!.id,
      action: data.id ? 'ADMIN_COURSE_UPDATED' : 'ADMIN_COURSE_CREATED',
      entityType: 'course_sections',
      entityId: result.id,
    });

    revalidatePath('/admin/courses');
    return actionSuccess(result);
  } catch (error) {
    return actionError(error);
  }
}

export async function archiveCourseSectionAction(payload: unknown) {
  try {
    const supabase = await createClient();
    const session = await requireRole('department_admin');
    const { id } = courseIdSchema.parse(payload);
    const { data, error } = await supabase
      .from('course_sections')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('university_id', session.universityId!)
      .select()
      .single();
    if (error) throw error;

    revalidatePath('/admin/courses');
    return actionSuccess(data);
  } catch (error) {
    return actionError(error);
  }
}

export async function assignLecturerToSectionAction(payload: unknown) {
  try {
    const supabase = await createClient();
    const session = await requireRole('department_admin');
    const data = assignLecturerSchema.parse(payload);
    const { data: result, error } = await supabase
      .from('course_lecturers')
      .upsert({
        university_id: session.universityId!,
        course_section_id: data.courseSectionId,
        lecturer_id: data.lecturerId,
        is_primary: data.isPrimary,
      }, { onConflict: 'course_section_id,lecturer_id' })
      .select()
      .single();
    if (error) throw error;

    revalidatePath('/admin/courses');
    return actionSuccess(result);
  } catch (error) {
    return actionError(error);
  }
}

export async function removeLecturerFromSectionAction(payload: unknown) {
  try {
    const supabase = await createClient();
    await requireRole('department_admin');
    const data = assignLecturerSchema.pick({ courseSectionId: true, lecturerId: true }).parse(payload);
    const { error } = await supabase
      .from('course_lecturers')
      .delete()
      .eq('course_section_id', data.courseSectionId)
      .eq('lecturer_id', data.lecturerId);
    if (error) throw error;

    revalidatePath('/admin/courses');
    return actionSuccess({ id: data.courseSectionId });
  } catch (error) {
    return actionError(error);
  }
}
