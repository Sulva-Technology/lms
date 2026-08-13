import { SupabaseClient } from '@supabase/supabase-js';
import { STORAGE_BUCKETS } from '../storage/buckets';
import { generateUploadUrl, generateDownloadUrl } from '../storage/signed-urls';

export class FileService {
  constructor(private supabase: SupabaseClient<any>) {}

  async createSignedUploadUrl(bucket: string, path: string) {
    return generateUploadUrl(this.supabase, bucket, path);
  }

  async createSignedDownloadUrl(bucket: string, path: string) {
    return generateDownloadUrl(this.supabase, bucket, path, 60 * 60 * 24); // 24 hours
  }

  async saveFileMetadata(universityId: string, uploaderId: string, metadata: {
    fileName: string;
    fileSize: number;
    fileType: string;
    storagePath: string;
    isPublic: boolean;
  }) {
    const { data, error } = await this.supabase.from('files').insert({
      university_id: universityId,
      uploader_id: uploaderId,
      file_name: metadata.fileName,
      file_size: metadata.fileSize,
      file_type: metadata.fileType,
      storage_path: metadata.storagePath,
      is_public: metadata.isPublic,
    }).select().single();
    
    if (error) throw error;

    await this.supabase.from('audit_logs').insert({
      university_id: universityId,
      user_id: uploaderId,
      action: 'FILE_UPLOADED',
      entity_type: 'files',
      entity_id: data.id
    });

    return data;
  }

  async deleteFile(userId: string, universityId: string, fileId: string) {
    const { data: file } = await this.supabase.from('files').select('storage_path').eq('id', fileId).single();
    if (!file) throw new Error('File not found');

    const { error: dbError } = await this.supabase.from('files').delete().eq('id', fileId);
    if (dbError) throw dbError;

    await this.supabase.from('audit_logs').insert({
      university_id: universityId,
      user_id: userId,
      action: 'FILE_DELETED',
      entity_type: 'files',
      entity_id: fileId
    });

    return true;
  }
}
