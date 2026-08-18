import { headers } from 'next/headers';

export interface TenantContext {
  universityId: string;
  subdomain: string;
  name: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
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

  const encodedName = headerList.get('x-university-name');
  let name: string | null = null;
  if (encodedName) {
    try {
      name = decodeURIComponent(encodedName);
    } catch {
      name = null;
    }
  }

  return {
    universityId,
    subdomain,
    name,
    primaryColor: headerList.get('x-university-primary'),
    secondaryColor: headerList.get('x-university-secondary'),
  };
}
