import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/guards';
import { apiError, apiResponse } from '@/lib/api/response';
import { NotificationService } from '@/lib/services/notification.service';
import { z } from 'zod';
import { validateRequest } from '@/lib/api/validate';

const schema = z.object({
  notificationIds: z.array(z.string().uuid()).optional(), // if empty, mark all
});

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const session = await requireUser();
    
    // Using our validation helper
    const parsed = await validateRequest(schema, req);
    const service = new NotificationService(supabase as any);
    
    if (parsed.notificationIds && parsed.notificationIds.length > 0) {
      await Promise.all(parsed.notificationIds.map(id => service.markAsRead(id, session.user.id)));
    } else {
      await service.markAllAsRead(session.profile.university_id!, session.user.id);
    }

    return apiResponse({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
