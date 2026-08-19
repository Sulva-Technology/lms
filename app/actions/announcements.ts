'use server';

import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/guards';
import { createAnnouncementSchema } from '@/lib/validation/announcement';
import { AnnouncementService } from '@/lib/services/announcement.service';
import { AuditService } from '@/lib/audit/audit.service';
import { actionError, actionSuccess } from '@/lib/api/response';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const updateAnnouncementSchema = createAnnouncementSchema.partial().extend({
  id: z.string().uuid(),
});

export async function createAnnouncementAction(payload: unknown) {
  try {
    const supabase = await createClient();
    const session = await requireUser();
    
    const parsed = createAnnouncementSchema.parse(payload);
    
    // Authorization rule enforce:
    if (session.role === 'student' && parsed.targetScope === 'university') {
      throw new Error('Students cannot send university-wide announcements');
    }
    
    const service = new AnnouncementService(supabase as any);
    const result = await service.createAnnouncement({
      universityId: session.universityId!,
      authorId: session.user.id,
      title: parsed.title,
      content: parsed.content,
      targetScope: parsed.targetScope,
      targetId: parsed.targetId,
      isPublished: parsed.isPublished,
    });
    
    const auditService = new AuditService(supabase as any);
    await auditService.logAction({
      universityId: session.universityId!,
      userId: session.user.id,
      action: 'ANNOUNCEMENT_CREATED',
      entityType: 'announcements',
      entityId: result.id
    });
    
    revalidatePath(`/announcements`);
    return actionSuccess(result);
  } catch (error) {
    return actionError(error);
  }
}

export async function updateAnnouncementAction(payload: unknown) {
  try {
    const supabase = await createClient();
    const session = await requireUser();
    const parsed = updateAnnouncementSchema.parse(payload);
    const service = new AnnouncementService(supabase as any);
    const result = await service.updateAnnouncement({
      universityId: session.universityId!,
      authorId: session.user.id,
      announcementId: parsed.id,
      title: parsed.title,
      content: parsed.content,
      targetScope: parsed.targetScope,
      targetId: parsed.targetId,
      isPublished: parsed.isPublished,
    });

    await new AuditService(supabase as any).logAction({
      universityId: session.universityId!,
      userId: session.user.id,
      action: 'ANNOUNCEMENT_UPDATED',
      entityType: 'announcements',
      entityId: result.id,
    });

    revalidatePath('/lecturer/announcements');
    return actionSuccess(result);
  } catch (error) {
    return actionError(error);
  }
}

export async function archiveAnnouncementAction(payload: unknown) {
  try {
    const supabase = await createClient();
    const session = await requireUser();
    const { id } = z.object({ id: z.string().uuid() }).parse(payload);
    const result = await new AnnouncementService(supabase as any).archiveAnnouncement(session.universityId!, session.user.id, id);

    await new AuditService(supabase as any).logAction({
      universityId: session.universityId!,
      userId: session.user.id,
      action: 'ANNOUNCEMENT_ARCHIVED',
      entityType: 'announcements',
      entityId: result.id,
    });

    revalidatePath('/lecturer/announcements');
    return actionSuccess(result);
  } catch (error) {
    return actionError(error);
  }
}
