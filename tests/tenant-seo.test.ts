import type { Metadata } from 'next';
import { describe, expect, it } from 'vitest';
import type { TenantProfile } from '@/lib/tenant/profile';
import {
  jsonLdScript,
  platformMetadata,
  tenantDescription,
  tenantJsonLd,
  tenantMetadata,
} from '@/lib/tenant/seo';

const profile = (overrides: Partial<TenantProfile> = {}): TenantProfile => ({
  id: 'uni-1',
  name: 'Sulvatech University',
  subdomain: 'sulvatech',
  logoUrl: 'https://cdn.example.com/logo.png',
  domain: 'sulvatech.edu',
  establishedYear: 2024,
  vocabulary: 'academic',
  stats: { faculties: 2, departments: 1, programs: 3, courses: 1 },
  ...overrides,
});

const ORIGIN = 'https://sulvatech.sulva.app';

// Next's Twitter metadata type is a union keyed on the card, so reading it back
// in a test needs a narrow rather than a property access.
const twitterCard = (meta: Metadata) => (meta.twitter as { card?: string } | null)?.card;

describe('tenantMetadata', () => {
  it('names the school in the title, the template and the share card', () => {
    const meta = tenantMetadata(profile(), ORIGIN);

    expect(meta.title).toEqual({
      default: 'Sulvatech University | Learning Portal',
      template: '%s | Sulvatech University',
    });
    expect(meta.applicationName).toBe('Sulvatech University');
    expect(meta.openGraph?.siteName).toBe('Sulvatech University');
  });

  it('points canonical and metadataBase at the school host', () => {
    const meta = tenantMetadata(profile(), ORIGIN);

    expect(meta.alternates?.canonical).toBe(ORIGIN);
    expect(meta.metadataBase?.origin).toBe(ORIGIN);
  });

  it("uses the school's own mark for the icon and the preview image", () => {
    const meta = tenantMetadata(profile(), ORIGIN);

    expect(meta.icons).toEqual({
      icon: 'https://cdn.example.com/logo.png',
      apple: 'https://cdn.example.com/logo.png',
    });
    expect(meta.openGraph?.images).toEqual([
      { url: 'https://cdn.example.com/logo.png', alt: 'Sulvatech University logo' },
    ]);
    expect(twitterCard(meta)).toBe('summary_large_image');
  });

  it('falls back to a plain summary card when the school has no logo', () => {
    const meta = tenantMetadata(profile({ logoUrl: null }), ORIGIN);

    expect(meta.icons).toBeUndefined();
    expect(meta.openGraph?.images).toBeUndefined();
    expect(twitterCard(meta)).toBe('summary');
  });

  it('survives an origin that will not parse', () => {
    expect(tenantMetadata(profile(), 'not a url').metadataBase).toBeUndefined();
  });
});

describe('tenantDescription', () => {
  it("speaks the tenant's vocabulary", () => {
    expect(tenantDescription(profile())).toContain('Courses, live classes, course registration');
    expect(tenantDescription(profile({ vocabulary: 'organization' }))).toContain(
      'Programmes, live sessions, programme enrolment',
    );
  });

  it('cites the year the school has been on the portal, when known', () => {
    expect(tenantDescription(profile())).toContain('since 2024');
    expect(tenantDescription(profile({ establishedYear: null }))).not.toContain('since');
  });

  it('stays inside what a search result will show', () => {
    const long = tenantDescription(profile({ name: 'A'.repeat(200) }));
    expect(long.length).toBeLessThanOrEqual(160);
  });
});

describe('tenantJsonLd', () => {
  it('types an academic tenant as a university and a training tenant as an organisation', () => {
    expect(tenantJsonLd(profile(), ORIGIN)['@type']).toBe('CollegeOrUniversity');
    expect(tenantJsonLd(profile({ vocabulary: 'organization' }), ORIGIN)['@type']).toBe(
      'Organization',
    );
  });

  it("carries the school's identity, not the platform's", () => {
    const data = tenantJsonLd(profile(), ORIGIN);

    expect(data.name).toBe('Sulvatech University');
    expect(data.url).toBe(ORIGIN);
    expect(data.logo).toBe('https://cdn.example.com/logo.png');
    expect(data.foundingDate).toBe('2024');
  });

  it('makes a bare website column absolute and omits it when unset', () => {
    expect(tenantJsonLd(profile(), ORIGIN).sameAs).toEqual(['https://sulvatech.edu']);
    expect(tenantJsonLd(profile({ domain: 'https://x.edu' }), ORIGIN).sameAs).toEqual([
      'https://x.edu',
    ]);
    expect(tenantJsonLd(profile({ domain: null }), ORIGIN).sameAs).toBeUndefined();
  });
});

describe('jsonLdScript', () => {
  it('cannot close the script tag it is embedded in', () => {
    const html = jsonLdScript(tenantJsonLd(profile({ name: '</script><img>' }), ORIGIN));

    expect(html).not.toContain('</script>');
    expect(html).toContain('\\u003c/script');
    expect(JSON.parse(html).name).toBe('</script><img>');
  });
});

describe('platformMetadata', () => {
  it('keeps the root domain branded as the product', () => {
    const meta = platformMetadata('https://sulva.app');

    expect(meta.title).toEqual({
      default: 'Sulva LMS | Premium Learning',
      template: '%s | Sulva LMS',
    });
    expect(meta.alternates?.canonical).toBe('https://sulva.app');
  });
});
