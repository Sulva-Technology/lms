'use server'

import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/guards';
import { createGradeItemSchema } from '@/lib/validation/gradebook';
import { GradebookService } from '@/lib/services/gradebook.service';
import { revalidatePath } from 'next/cache';
import { GradeService } from '@/lib/services/grade.service';
import { z } from 'zod';

const gradeSubmissionSchema = z.object({
  submissionId: z.string().uuid(),
  score: z.number().min(0),
  feedback: z.string().optional(),
});

export async function createGradeItemAction(payload: any) {
  const supabase = await createClient();
  const session = await requireRole('lecturer');

  const parsed = createGradeItemSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  
  const service = new GradebookService(supabase as any);
  try {
      const result = await service.createGradeItem(session.profile!.university_id!, session.user!.id, parsed.data as any);
      revalidatePath(`/courses/sections/${parsed.data.courseSectionId}/gradebook`);
      return { success: true, gradeItem: result };
  } catch (err: any) {
      return { error: err.message };
  }
}

export async function gradeSubmissionAction(payload: any) {
  const supabase = await createClient();
  const session = await requireRole('lecturer');
  const parsed = gradeSubmissionSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const service = new GradeService(supabase as any);
  try {
    const result = await service.gradeSubmission(
      session.profile.university_id!,
      session.user.id,
      parsed.data.submissionId,
      parsed.data.score,
      parsed.data.feedback,
    );
    revalidatePath('/lecturer/gradebook');
    return { success: true, submission: result };
  } catch (err: any) {
    return { error: err.message };
  }
}
