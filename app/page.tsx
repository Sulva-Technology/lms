import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { MarketingLanding } from '@/components/landing/MarketingLanding';
import { SchoolLanding } from '@/components/landing/SchoolLanding';
import { getTenantContext } from '@/lib/tenant/context';
import { getTenantProfile } from '@/lib/tenant/profile';
import { env } from '@/lib/env';

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenantContext();
  if (!tenant) return {};

  const profile = await getTenantProfile(tenant.universityId);
  if (!profile) return {};

  return {
    title: `${profile.name} | Learning Portal`,
    description: `Courses, live classes and results for ${profile.name}, powered by VUI LMS.`,
  };
}

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

  return <SchoolLanding profile={profile} host={host} />;
}
