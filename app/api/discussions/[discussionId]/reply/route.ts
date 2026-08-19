import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/guards';
import { apiError, apiResponse } from '@/lib/api/response';
import { DiscussionService } from '@/lib/services/discussion.service';
import { validateRequest } from '@/lib/api/validate';
import { z } from 'zod';

const schema = z.object({
  body: z.string().min(2),
  parentId: z.string().uuid().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ discussionId: string }> }) {
  try {
    const supabase = await createClient();
    const session = await requireUser();
    
    // Resolve params explicitly as per Next 15+ patterns
    const resolvedParams = await params;
    const discussionId = resolvedParams.discussionId;
    
    const parsed = await validateRequest(schema, req);
    
    const service = new DiscussionService(supabase as any);
    const result = await service.replyToDiscussion(
      session.universityId!,
      session.user.id,
      discussionId,
      parsed.body,
      parsed.parentId
    );

    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}
