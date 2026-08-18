import { env } from '@/lib/env';
import { getTenantContext } from './context';
import { emailLinkOrigin } from './url';

/**
 * The origin to put in an invite or password-reset link for the current
 * request, so a person invited by their school lands back on their school's
 * address instead of the platform's.
 */
export async function getEmailLinkOrigin(): Promise<string> {
  const tenant = await getTenantContext();
  return emailLinkOrigin(
    tenant?.subdomain,
    env.NEXT_PUBLIC_ROOT_DOMAIN,
    env.NEXT_PUBLIC_APP_URL,
  );
}
