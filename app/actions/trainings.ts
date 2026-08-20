'use server';

import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/guards';
import { TrainingBuilderService } from '@/lib/services/training-builder.service';
import { NotificationService } from '@/lib/services/notification.service';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const materialSchema = z.object({
  title: z.string().min(2, 'Give each piece of material a name.'),
  kind: z.enum(['written', 'video', 'document']),
  body: z.string().optional(),
});

const trainingSchema = z.object({
  name: z.string().min(2, 'Give the training a name.'),
  description: z.string().optional(),
  material: z.array(materialSchema).min(1, 'Add at least one lesson, video or document.'),
  passMark: z.coerce.number().int().min(0).max(100).optional().nullable(),
  validForMonths: z.coerce.number().int().min(1).max(120).optional().nullable(),
  startsOn: z.string().date('Choose a start date.'),
  endsOn: z.string().date().optional().nullable(),
  dueOn: z.string().date().optional().nullable(),
  learnerIds: z.array(z.string().uuid()).default([]),
  teamIds: z.array(z.string().uuid()).default([]),
  publish: z.boolean().default(true),
});

export async function createTrainingAction(payload: unknown) {
  const parsed = trainingSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    const supabase = await createClient();
    // A trainer builds their own; an owner builds anyone's. Both land here.
    const session = await requireRole('lecturer');
    const universityId = session.universityId!;

    const result = await new TrainingBuilderService(supabase as any).createTraining({
      universityId,
      ownerId: session.user!.id,
      input: {
        name: parsed.data.name,
        description: parsed.data.description,
        material: parsed.data.material,
        passMark: parsed.data.passMark ?? null,
        validForMonths: parsed.data.validForMonths ?? null,
        startsOn: parsed.data.startsOn,
        endsOn: parsed.data.endsOn ?? null,
        dueOn: parsed.data.dueOn ?? null,
        assignTo: { learnerIds: parsed.data.learnerIds, teamIds: parsed.data.teamIds },
        publish: parsed.data.publish,
      },
    });

    // Telling people is the point of assigning; failing to tell them is not a
    // reason to undo the training.
    if (parsed.data.publish) {
      const notifications = new NotificationService(createAdminClient() as any);
      for (const learnerId of parsed.data.learnerIds) {
        try {
          await notifications.createNotification({
            universityId,
            userId: learnerId,
            title: 'Training assigned',
            message: parsed.data.dueOn
              ? `${parsed.data.name} is due by ${new Date(parsed.data.dueOn).toLocaleDateString()}.`
              : `${parsed.data.name} has been assigned to you.`,
            type: 'course',
            linkUrl: '/student/training',
          });
        } catch {
          // Deliberately ignored.
        }
      }
    }

    revalidatePath('/admin/trainings');
    revalidatePath('/admin/compliance');
    revalidatePath('/student/training');
    return { success: true, ...result };
  } catch (error: any) {
    return { error: error.message };
  }
}

const materialIdSchema = z.object({ lessonId: z.string().uuid() });

const addMaterialSchema = z.object({
  trainingId: z.string().uuid(),
  title: z.string().min(2, 'Give this step a name.'),
  kind: z.enum(['written', 'video', 'document']),
  body: z.string().optional(),
});

const editMaterialSchema = materialIdSchema.extend({
  title: z.string().min(2, 'Give this step a name.'),
  body: z.string().optional(),
});

/** Confirms the signed-in person runs this training before they may change it. */
async function requireTrainer(supabase: any, trainingId: string, userId: string) {
  const { data } = await supabase
    .from('course_lecturers')
    .select('id, course_sections!inner(course_id)')
    .eq('lecturer_id', userId)
    .eq('course_sections.course_id', trainingId)
    .maybeSingle();
  if (!data) throw new Error('Unauthorized: you do not run this training');
}

export async function addTrainingMaterialAction(payload: unknown) {
  const parsed = addMaterialSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    const supabase = await createClient();
    const session = await requireRole('lecturer');
    await requireTrainer(supabase, parsed.data.trainingId, session.user!.id);

    const { data: module, error: moduleError } = await supabase
      .from('course_modules')
      .select('id')
      .eq('course_id', parsed.data.trainingId)
      .order('order_index', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (moduleError) throw moduleError;
    if (!module) throw new Error('This training has no material section yet.');

    // Appended, so adding a step never reshuffles what people are part way through.
    const { data: last } = await supabase
      .from('lessons')
      .select('order_index')
      .eq('module_id', module.id)
      .order('order_index', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data, error } = await supabase
      .from('lessons')
      .insert({
        university_id: session.universityId!,
        module_id: module.id,
        title: parsed.data.title,
        content: parsed.data.body || null,
        resource_type: parsed.data.kind === 'video' ? 'video' : 'document',
        order_index: (last?.order_index ?? -1) + 1,
        is_published: true,
      })
      .select()
      .single();
    if (error) throw error;

    revalidatePath(`/admin/trainings/${parsed.data.trainingId}`);
    return { success: true, lesson: data };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function editTrainingMaterialAction(payload: unknown) {
  const parsed = editMaterialSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    const supabase = await createClient();
    await requireRole('lecturer');

    const { error } = await supabase
      .from('lessons')
      .update({ title: parsed.data.title, content: parsed.data.body || null })
      .eq('id', parsed.data.lessonId);
    if (error) throw error;

    revalidatePath('/admin/trainings');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function removeTrainingMaterialAction(payload: unknown) {
  const parsed = materialIdSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    const supabase = await createClient();
    await requireRole('lecturer');

    // Unpublished rather than deleted: someone may be part way through it, and
    // their progress rows point at it.
    const { error } = await supabase
      .from('lessons')
      .update({ is_published: false })
      .eq('id', parsed.data.lessonId);
    if (error) throw error;

    revalidatePath('/admin/trainings');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
