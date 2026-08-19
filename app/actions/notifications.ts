'use server';

import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/guards';
import { NotificationService } from '@/lib/services/notification.service';
import { actionError, actionSuccess } from '@/lib/api/response';
import { revalidatePath } from 'next/cache';

export async function markNotificationAsRead(notificationId: string) {
  try {
    const supabase = await createClient();
    const session = await requireUser();
    
    const service = new NotificationService(supabase as any);
    await service.markAsRead(notificationId, session.user.id);
    
    revalidatePath('/notifications');
    return actionSuccess({ success: true });
  } catch (error) {
    return actionError(error);
  }
}

export async function markAllNotificationsAsRead() {
  try {
    const supabase = await createClient();
    const session = await requireUser();
    
    const service = new NotificationService(supabase as any);
    await service.markAllAsRead(session.universityId!, session.user.id);
    
    revalidatePath('/notifications');
    return actionSuccess({ success: true });
  } catch (error) {
    return actionError(error);
  }
}
