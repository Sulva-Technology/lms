import { headers } from 'next/headers';
import { MarketingLanding } from '@/components/landing/MarketingLanding';
import { SchoolLanding } from '@/components/landing/SchoolLanding';
import { getTenantContext } from '@/lib/tenant/context';
import { getTenantProfile } from '@/lib/tenant/profile';
import { jsonLdScript, tenantJsonLd } from '@/lib/tenant/seo';
import { tenantOrigin } from '@/lib/tenant/url';
import { env } from '@/lib/env';

// Title, description and share card come from the root layout, which already
// resolves them from the school's row for every page under it.

/**
 * The root domain shows the platform. A school host shows the school: the
 * visitor typed that school's address, so the page should be about it.
 */
export default async function LandingPage() {
  const tenant = await getTenantContext();
  if (!tenant) return <MarketingLanding />;

  const profile = await getTenantProfile(tenant.universityId);
  if (!profile) return <MarketingLanding />;

  const requestHost = (await headers()).get('host');
  const host = requestHost?.split(':')[0] ?? `${tenant.subdomain}.${env.NEXT_PUBLIC_ROOT_DOMAIN}`;

  // The canonical address is rebuilt from the resolved subdomain rather than
  // the Host header, so structured data cannot be pointed at another origin.
  const origin = tenantOrigin(profile.subdomain, env.NEXT_PUBLIC_ROOT_DOMAIN);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(tenantJsonLd(profile, origin)) }}
      />
      <SchoolLanding profile={profile} host={host} />
    </>
  );
}
