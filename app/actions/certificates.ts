'use server';

import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/guards';
import { CertificateService } from '@/lib/services/certificate.service';
import { NotificationService } from '@/lib/services/notification.service';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const issueSchema = z.object({
  courseSectionId: z.string().uuid(),
  studentId: z.string().uuid(),
});

const revokeSchema = z.object({
  certificateId: z.string().uuid(),
  reason: z.string().min(3).max(300),
});

export async function evaluateCertificatesAction(courseSectionId: string) {
  try {
    const supabase = await createClient();
    await requireRole('lecturer');
    const service = new CertificateService(supabase as any);
    return { success: true, candidates: await service.evaluate(courseSectionId) };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function issueCertificateAction(payload: unknown) {
  const parsed = issueSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    const supabase = await createClient();
    const session = await requireRole('lecturer');
    const service = new CertificateService(supabase as any);

    const certificate = await service.issue({
      universityId: session.universityId!,
      courseSectionId: parsed.data.courseSectionId,
      studentId: parsed.data.studentId,
      issuedBy: session.user!.id,
    });

    // Notifications have no INSERT policy by design, so this goes through the
    // service role like every other cross-user notification.
    try {
      await new NotificationService(createAdminClient() as any).createNotification({
        universityId: session.universityId!,
        userId: parsed.data.studentId,
        title: 'Certificate issued',
        message: `Your certificate for ${certificate.snapshot?.courseTitle || 'your course'} is ready.`,
        type: 'course',
        linkUrl: '/student/certificates',
      });
    } catch {
      // A missed notification must never undo an issued certificate.
    }

    revalidatePath('/lecturer/certificates');
    revalidatePath('/student/certificates');
    return { success: true, certificate };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function revokeCertificateAction(payload: unknown) {
  const parsed = revokeSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    const supabase = await createClient();
    const session = await requireRole('lecturer');
    const service = new CertificateService(supabase as any);
    await service.revoke(parsed.data.certificateId, session.user!.id, parsed.data.reason);

    revalidatePath('/lecturer/certificates');
    revalidatePath('/student/certificates');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
