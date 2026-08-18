import { SupabaseClient } from '@supabase/supabase-js';
import { isVocabulary, Vocabulary } from './labels';

/**
 * Reads the tenant's chosen vocabulary. Falls back to academic wording for a
 * tenant that has never chosen, and for any read failure: wording is never
 * worth failing a page render over.
 */
export async function getTenantVocabulary(
  client: SupabaseClient<any>,
  universityId: string | null | undefined,
): Promise<Vocabulary> {
  if (!universityId) return 'academic';

  try {
    const { data } = await client
      .from('university_settings')
      .select('settings')
      .eq('university_id', universityId)
      .maybeSingle();

    const candidate = (data?.settings as Record<string, unknown> | null)?.vocabulary;
    return isVocabulary(candidate) ? candidate : 'academic';
  } catch {
    return 'academic';
  }
}
