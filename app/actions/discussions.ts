'use server';

import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/guards';
import { createDiscussionSchema, replyDiscussionSchema } from '@/lib/validation/discussion';
import { DiscussionService } from '@/lib/services/discussion.service';
import { actionError, actionSuccess } from '@/lib/api/response';
import { revalidatePath } from 'next/cache';

export async function createDiscussionAction(payload: unknown) {
  try {
    const supabase = await createClient();
    const session = await requireUser();
    
    // Zod validation
    const parsed = createDiscussionSchema.parse(payload);
    
    const service = new DiscussionService(supabase as any);
    const result = await service.createDiscussion(
      session.profile.university_id!, 
      session.user.id, 
      parsed.courseSectionId, 
      parsed.title, 
      parsed.body
    );
    
    revalidatePath(`/courses/sections/${parsed.courseSectionId}/discussions`);
    return actionSuccess(result);
  } catch (error) {
    return actionError(error);
  }
}

export async function replyDiscussionAction(payload: unknown) {
  try {
    const supabase = await createClient();
    const session = await requireUser();
    
    const parsed = replyDiscussionSchema.parse(payload);
    
    const service = new DiscussionService(supabase as any);
    const result = await service.replyToDiscussion(
      session.profile.university_id!, 
      session.user.id, 
      parsed.discussionId, 
      parsed.body
    );
    
    revalidatePath(`/discussions/${parsed.discussionId}`);
    return actionSuccess(result);
  } catch (error) {
    return actionError(error);
  }
}
