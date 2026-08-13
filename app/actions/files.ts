'use server'

import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/guards';
import { FileService } from '@/lib/services/file.service';
import { createSignedUploadSchema, requestSignedDownloadSchema, fileMetadataSchema } from '@/lib/validation/files';
import {
    STORAGE_BUCKETS,
    assertPathBelongsToUniversity,
    buildStoragePath,
    canWriteBucket,
    ownerIdFromPath,
} from '@/lib/storage/paths';
import { rateLimit } from '@/lib/rate-limit';
import type { AuthRole } from '@/types/auth';

const STAFF_ROLES: AuthRole[] = ['lecturer', 'department_admin', 'admin', 'super_admin'];

export async function createSignedUploadUrlAction(payload: any) {
    const supabase = await createClient();
    const session = await requireUser();

    const parsed = createSignedUploadSchema.safeParse(payload);
    if (!parsed.success) return { error: parsed.error.issues[0].message };

    const universityId = session.profile.university_id;
    if (!universityId) return { error: 'Your profile is not attached to a university.' };

    // Signed upload URLs are cheap to mint but expensive to abuse: each one is a
    // write grant into a tenant bucket.
    const limit = await rateLimit(`signed-upload:${session.user.id}`, 60, 60_000);
    if (!limit.success) return { error: 'Too many uploads. Wait a moment and try again.' };

    if (!canWriteBucket(session.profile.role, parsed.data.bucket)) {
        return { error: 'You do not have permission to upload to this location.' };
    }

    // The path is derived server-side so a client can never write outside its
    // own university/owner prefix, which is what storage RLS keys off.
    const path = buildStoragePath({
        universityId,
        scope: parsed.data.scope,
        ownerId: session.user.id,
        fileName: parsed.data.fileName,
    });

    const service = new FileService(supabase as any);
    try {
        const result = await service.createSignedUploadUrl(parsed.data.bucket, path);
        return { success: true, url: result.signedUrl, path: result.path, token: result.token };
    } catch (err: any) {
        return { error: err.message };
    }
}

export async function createSignedDownloadUrlAction(payload: any) {
    const supabase = await createClient();
    const session = await requireUser();

    const parsed = requestSignedDownloadSchema.safeParse(payload);
    if (!parsed.success) return { error: parsed.error.issues[0].message };

    const universityId = session.profile.university_id;
    if (!universityId) return { error: 'Your profile is not attached to a university.' };

    const service = new FileService(supabase as any);
    try {
        // A signed download URL bypasses storage RLS once issued, so the checks
        // that RLS would have applied have to be re-applied here at mint time.
        assertPathBelongsToUniversity(parsed.data.path, universityId);

        const owner = ownerIdFromPath(parsed.data.path);
        const isOwner = owner === session.user.id;
        const isStaff = STAFF_ROLES.includes(session.profile.role);

        if (parsed.data.bucket === STORAGE_BUCKETS.ASSIGNMENT_SUBMISSIONS && !isOwner && !isStaff) {
            return { error: 'You do not have permission to open this file.' };
        }

        if (parsed.data.bucket === STORAGE_BUCKETS.EXPORTS && !isOwner) {
            return { error: 'You do not have permission to open this file.' };
        }

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

    const universityId = session.profile.university_id;
    if (!universityId) return { error: 'Your profile is not attached to a university.' };

    const service = new FileService(supabase as any);
    try {
        assertPathBelongsToUniversity(parsed.data.storagePath, universityId);
        const result = await service.saveFileMetadata(universityId, session.user.id, parsed.data);
        return { success: true, file: result };
    } catch (err: any) {
        return { error: err.message };
    }
}
