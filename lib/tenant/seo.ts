import type { Metadata } from 'next';
import { labelsFor } from '@/lib/ui/labels';
import type { TenantProfile } from './profile';

export const PLATFORM_NAME = 'Sulva LMS';
export const PLATFORM_DESCRIPTION =
  'Premium university-focused learning management system.';

const MAX_DESCRIPTION = 160;

/** Search results cut a description off around 160 characters anyway. */
function trim(value: string): string {
  if (value.length <= MAX_DESCRIPTION) return value;
  const cut = value.slice(0, MAX_DESCRIPTION - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 40 ? cut.slice(0, lastSpace) : cut).replace(/[,;:\s]+$/, '')}…`;
}

const lower = (value: string) => value.toLowerCase();

/**
 * What a school host says about itself.
 *
 * Every word comes from the school's own row — its name, its mark, its
 * vocabulary — because a visitor who typed that address, and a crawler that
 * followed it, are both looking at that school and not at the platform.
 */
export function tenantDescription(profile: TenantProfile): string {
  const labels = labelsFor(profile.vocabulary);
  const opening = `${labels.coursePlural}, ${lower(labels.liveClassPlural)}, ${lower(
    labels.registration,
  )} and results for ${profile.name}`;
  const established = profile.establishedYear
    ? `, on the portal ${profile.name} has run since ${profile.establishedYear}.`
    : '.';
  return trim(`${opening}${established}`);
}

/**
 * Metadata for a school host. `origin` is rebuilt from the subdomain the
 * middleware resolved against the database rather than from the Host header,
 * so a spoofed Host cannot plant a canonical URL pointing somewhere else.
 */
export function tenantMetadata(profile: TenantProfile, origin: string): Metadata {
  const title = `${profile.name} | Learning Portal`;
  const description = tenantDescription(profile);
  const images = profile.logoUrl
    ? [{ url: profile.logoUrl, alt: `${profile.name} logo` }]
    : undefined;

  return {
    metadataBase: safeBase(origin),
    applicationName: profile.name,
    title: { default: title, template: `%s | ${profile.name}` },
    description,
    alternates: { canonical: origin },
    icons: profile.logoUrl ? { icon: profile.logoUrl, apple: profile.logoUrl } : undefined,
    openGraph: {
      type: 'website',
      siteName: profile.name,
      url: origin,
      title,
      description,
      images,
      locale: 'en',
    },
    twitter: {
      card: images ? 'summary_large_image' : 'summary',
      title,
      description,
      images: profile.logoUrl ? [profile.logoUrl] : undefined,
    },
  };
}

/** The root domain is the product's own front door, so it stays branded Sulva. */
export function platformMetadata(appUrl: string): Metadata {
  const title = `${PLATFORM_NAME} | Premium Learning`;

  return {
    metadataBase: safeBase(appUrl),
    applicationName: PLATFORM_NAME,
    title: { default: title, template: `%s | ${PLATFORM_NAME}` },
    description: PLATFORM_DESCRIPTION,
    alternates: { canonical: appUrl },
    openGraph: {
      type: 'website',
      siteName: PLATFORM_NAME,
      url: appUrl,
      title,
      description: PLATFORM_DESCRIPTION,
      locale: 'en',
    },
    twitter: { card: 'summary', title, description: PLATFORM_DESCRIPTION },
  };
}

/**
 * Structured data describing the school itself. A training organisation is not
 * a university, so the type follows the tenant's vocabulary rather than the
 * academic column names underneath it.
 */
export function tenantJsonLd(profile: TenantProfile, origin: string): Record<string, unknown> {
  const sameAs = profile.domain ? [absolute(profile.domain)] : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': profile.vocabulary === 'academic' ? 'CollegeOrUniversity' : 'Organization',
    name: profile.name,
    url: origin,
    description: tenantDescription(profile),
    ...(profile.logoUrl ? { logo: profile.logoUrl } : {}),
    ...(profile.establishedYear ? { foundingDate: String(profile.establishedYear) } : {}),
    ...(sameAs ? { sameAs } : {}),
  };
}

/**
 * Serialised for a <script> tag. A school name containing "</script>" would
 * otherwise close the tag early and turn the rest of the JSON into markup.
 */
export function jsonLdScript(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

/** A school's website column is stored bare ("example.edu") as often as not. */
function absolute(domain: string): string {
  return /^https?:\/\//i.test(domain) ? domain : `https://${domain}`;
}

/** A malformed origin must not take the whole page down over a <link> tag. */
function safeBase(origin: string): URL | undefined {
  try {
    return new URL(origin);
  } catch {
    return undefined;
  }
}
