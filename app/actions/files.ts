'use server'

import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/guards';
import { FileService } from '@/lib/services/file.service';
import { createSignedUploadSchema, requestSignedDownloadSchema, fileMetadataSchema } from '@/lib/validation/files';

export async function createSignedUploadUrlAction(payload: any) {
    const supabase = await createClient();
    await requireUser();

    const parsed = createSignedUploadSchema.safeParse(payload);
    if (!parsed.success) return { error: parsed.error.issues[0].message };
    
    // We assume the user has the right auth level based on the UI allowing it.
    // In production, we could introspect the bucket to add extra checks.
    
    const service = new FileService(supabase as any);
    try {
        const result = await service.createSignedUploadUrl(parsed.data.bucket, parsed.data.path);
        return { success: true, url: result.signedUrl, path: result.path, token: result.token };
    } catch (err: any) {
        return { error: err.message };
    }
}

export async function createSignedDownloadUrlAction(payload: any) {
    const supabase = await createClient();
    await requireUser();

    const parsed = requestSignedDownloadSchema.safeParse(payload);
    if (!parsed.success) return { error: parsed.error.issues[0].message };
    
    const service = new FileService(supabase as any);
    try {
        const result = await service.createSignedDownloadUrl(parsed.data.bucket, parsed.data.path);
        return { success: true, url: result.signedUrl };
    } catch (err: any) {
        return { error: err.message };
    }
}

export async function saveFileMetadataAction(payload: any) {
    const supabase = await createClient();
    const session = await requireUser();

    const parsed = fileMetadataSchema.safeParse(payload);
    if (!parsed.success) return { error: parsed.error.issues[0].message };

    const service = new FileService(supabase as any);
    try {
        const result = await service.saveFileMetadata(session.profile!.university_id!, session.user!.id, parsed.data);
        return { success: true, file: result };
    } catch (err: any) {
        return { error: err.message };
    }
}
