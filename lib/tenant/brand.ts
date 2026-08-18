import { getTenantContext } from './context';
import { getTenantProfile } from './profile';

export interface TenantBrand {
  name: string;
  logoUrl: string | null;
}

/**
 * The school's name and mark for surfaces that sign themselves — sign-in,
 * password reset, onboarding. Returns null on the root domain, where the
 * platform's own identity is the right one to show.
 */
export async function getTenantBrand(): Promise<TenantBrand | null> {
  const tenant = await getTenantContext();
  if (!tenant) return null;

  const profile = await getTenantProfile(tenant.universityId);
  if (profile) return { name: profile.name, logoUrl: profile.logoUrl };

  // The profile lookup can fail independently of the tenant resolving; the
  // name from the request headers is still better than the platform's.
  return tenant.name ? { name: tenant.name, logoUrl: null } : null;
}
