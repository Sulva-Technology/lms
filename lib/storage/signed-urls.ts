import { SupabaseClient } from '@supabase/supabase-js';
import { STORAGE_BUCKETS } from './buckets';

// A generic utility function that logic-level services can reuse
export async function generateUploadUrl(supabase: SupabaseClient<any>, bucket: string, path: string) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(path);
  if (error) throw error;
  return data;
}

export async function generateDownloadUrl(supabase: SupabaseClient<any>, bucket: string, path: string, expiresIn = 3600) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data;
}
