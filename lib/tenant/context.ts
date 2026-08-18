import { headers } from 'next/headers';

export interface TenantContext {
  universityId: string;
  subdomain: string;
}

/**
 * Reads the tenant the middleware resolved for this request. Returns null on
 * root-domain requests, which are not scoped to any school.
 */
export async function getTenantContext(): Promise<TenantContext | null> {
  const headerList = await headers();
  const universityId = headerList.get('x-university-id');
  const subdomain = headerList.get('x-university-subdomain');
  if (!universityId || !subdomain) return null;
  return { universityId, subdomain };
}
