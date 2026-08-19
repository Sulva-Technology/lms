import { SupabaseClient } from '@supabase/supabase-js';
import { getTenantMode } from '@/lib/tenant/mode';
import { isVocabulary, Vocabulary } from './labels';

/**
 * The words a tenant reads.
 *
 * An explicit setting always wins. Otherwise the wording follows what the
 * tenant actually is: an organisation running internal training reads trainer
 * and cohort without anyone having to choose it, and a school reads lecturer
 * and semester. Vocabulary is a consequence of the tenant, not a decoration
 * bolted onto one.
 *
 * Every failure path falls back to academic: wording is never worth failing a
 * page render over.
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
    if (isVocabulary(candidate)) return candidate;

    return (await getTenantMode(client, universityId)) === 'training' ? 'organization' : 'academic';
  } catch {
    return 'academic';
  }
}
