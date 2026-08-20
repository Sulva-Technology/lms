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
