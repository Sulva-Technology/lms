'use server'

import { createClient } from '@/lib/supabase/server';
import { requireRole, requireUser } from '@/lib/auth/guards';
import { VideoAssetService } from '@/lib/services/video.service';
import { createVideoAssetSchema } from '@/lib/validation/video';
import { attachLessonVideoSchema } from '@/lib/validation/video';
import { assertPathBelongsToUniversity } from '@/lib/storage/paths';
import { revalidatePath } from 'next/cache';

export async function createVideoAssetAction(payload: any) {
    const supabase = await createClient();
    const session = await requireUser();

    const parsed = createVideoAssetSchema.safeParse(payload);
    if (!parsed.success) return { error: parsed.error.issues[0].message };

    const service = new VideoAssetService(supabase as any);
    try {
        const result = await service.createAsset(session.profile.university_id!, session.user.id, parsed.data as any);
        return { success: true, asset: result };
    } catch (error: any) {
        return { error: error.message };
    }
}

/**
 * Attaches an already-uploaded storage object to a lesson as its video.
 * The bytes reached Supabase Storage through a signed upload URL before this
 * runs, so all that remains is authorization and record keeping.
 */
export async function attachLessonVideoAction(payload: any) {
    const supabase = await createClient();
    const session = await requireRole('lecturer');

    const parsed = attachLessonVideoSchema.safeParse(payload);
    if (!parsed.success) return { error: parsed.error.issues[0].message };

    const universityId = session.profile.university_id;
    if (!universityId) return { error: 'Your profile is not attached to a university.' };

    try {
        assertPathBelongsToUniversity(parsed.data.storagePath, universityId);
    } catch (error: any) {
        return { error: error.message };
    }

    const service = new VideoAssetService(supabase as any);
    try {
        const owns = await service.lecturerOwnsLesson(parsed.data.lessonId, session.user.id);
        if (!owns) return { error: 'You are not assigned to the course that owns this lesson.' };

        const asset = await service.attachLessonVideo({
            universityId,
            uploaderId: session.user.id,
            lessonId: parsed.data.lessonId,
            courseId: parsed.data.courseId,
            storagePath: parsed.data.storagePath,
            fileName: parsed.data.fileName,
            fileSize: parsed.data.fileSize,
            contentType: parsed.data.contentType,
            durationSeconds: parsed.data.durationSeconds,
        });

        revalidatePath(`/lecturer/courses/${parsed.data.courseId}`);
        return { success: true, asset };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function removeLessonVideoAction(lessonId: string) {
    const supabase = await createClient();
    const session = await requireRole('lecturer');

    const service = new VideoAssetService(supabase as any);
    try {
        const owns = await service.lecturerOwnsLesson(lessonId, session.user.id);
        if (!owns) return { error: 'You are not assigned to the course that owns this lesson.' };

        await service.removeLessonVideo(lessonId);
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}
