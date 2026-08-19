import { SupabaseClient } from '@supabase/supabase-js';

export type TenantMode = 'academic' | 'training';

export const isTrainingTenant = (mode: TenantMode): boolean => mode === 'training';

/**
 * A tenant that has not declared a mode is a school, because that is what every
 * tenant was before this column existed. Read failures degrade the same way:
 * layout and wording are never worth failing a render over.
 */
export async function getTenantMode(
  client: SupabaseClient<any>,
  universityId: string | null | undefined,
): Promise<TenantMode> {
  if (!universityId) return 'academic';

  try {
    const { data } = await client
      .from('universities')
      .select('mode')
      .eq('id', universityId)
      .maybeSingle();

    return data?.mode === 'training' ? 'training' : 'academic';
  } catch {
    return 'academic';
  }
}
