import { createAdminClient } from '@/lib/supabase/admin';
import { getTenantVocabulary } from '@/lib/ui/tenant-vocabulary';
import type { Vocabulary } from '@/lib/ui/labels';

export interface TenantStats {
  faculties: number;
  departments: number;
  programs: number;
  courses: number;
}

export interface TenantProfile {
  id: string;
  name: string;
  subdomain: string;
  logoUrl: string | null;
  domain: string | null;
  establishedYear: number | null;
  vocabulary: Vocabulary;
  stats: TenantStats;
}

const TTL_MS = 60_000;

// The landing page is public and uncacheable at the route level (it reads the
// tenant header), so a short in-process cache keeps a burst of anonymous
// visitors from re-running five counts per view.
const cache = new Map<string, { value: TenantProfile | null; expiresAt: number }>();

export function clearTenantProfileCache(): void {
  cache.clear();
}

/**
 * The public face of a school: the identity fields plus headline counts.
 *
 * Deliberately narrow — this is rendered to anonymous visitors, so it carries
 * no people, no enrolment figures, and nothing from an unpublished course.
 * Counts are best-effort: a failed count reads as zero rather than failing the
 * page, but a missing school row returns null so the caller can fall back.
 */
export async function getTenantProfile(universityId: string): Promise<TenantProfile | null> {
  const cached = cache.get(universityId);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const admin = createAdminClient();

  const { data, error } = await admin
    .from('universities')
    .select('id,name,subdomain,logo_url,domain,created_at')
    .eq('id', universityId)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error('Tenant profile lookup failed:', error);
    return null;
  }

  const row = data as {
    id: string;
    name: string;
    subdomain: string;
    logo_url: string | null;
    domain: string | null;
    created_at: string | null;
  };

  const count = async (
    table: string,
    filters: Record<string, string> = {},
  ): Promise<number> => {
    try {
      let query = admin
        .from(table)
        .select('id', { count: 'exact', head: true })
        .eq('university_id', universityId);
      for (const [column, value] of Object.entries(filters)) {
        query = query.eq(column, value);
      }
      const { count: total, error: countError } = await query;
      if (countError) {
        console.error(`Tenant profile count failed for ${table}:`, countError);
        return 0;
      }
      return total ?? 0;
    } catch (thrown) {
      console.error(`Tenant profile count threw for ${table}:`, thrown);
      return 0;
    }
  };

  const [faculties, departments, programs, courses, vocabulary] = await Promise.all([
    count('faculties'),
    count('departments'),
    count('programs'),
    count('courses', { status: 'published' }),
    getTenantVocabulary(admin, universityId),
  ]);

  const established = row.created_at ? new Date(row.created_at) : null;

  const profile: TenantProfile = {
    id: row.id,
    name: row.name,
    subdomain: row.subdomain,
    logoUrl: row.logo_url,
    domain: row.domain,
    establishedYear:
      established && !Number.isNaN(established.getTime()) ? established.getUTCFullYear() : null,
    vocabulary,
    stats: { faculties, departments, programs, courses },
  };

  cache.set(universityId, { value: profile, expiresAt: Date.now() + TTL_MS });
  return profile;
}
