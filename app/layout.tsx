import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import { AuthHashBridge } from '@/components/auth/AuthHashBridge';
import { MotionProvider } from '@/components/layout/MotionProvider';
import { buildBrandStyle } from '@/lib/branding';
import { env } from '@/lib/env';
import { getTenantContext } from '@/lib/tenant/context';
import { getTenantProfile } from '@/lib/tenant/profile';
import { platformMetadata, tenantMetadata } from '@/lib/tenant/seo';
import { tenantOrigin } from '@/lib/tenant/url';
import { parseThemeChoice, THEME_COOKIE } from '@/lib/ui/theme';
import { cookies } from 'next/headers';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

/**
 * Titles, descriptions and share cards belong to whichever school the visitor
 * reached, not to the platform. Doing it in the root layout means every page
 * under it inherits the school's name through the title template, instead of
 * only the landing page carrying it.
 */
export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenantContext();
  if (!tenant) return platformMetadata(env.NEXT_PUBLIC_APP_URL);

  const profile = await getTenantProfile(tenant.universityId);
  if (!profile) return platformMetadata(env.NEXT_PUBLIC_APP_URL);

  return tenantMetadata(profile, tenantOrigin(profile.subdomain, env.NEXT_PUBLIC_ROOT_DOMAIN));
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Middleware already read and cached the school's row, so the colours arrive
  // on the request headers and cost no extra query. Rendering them into the
  // document means the school's brand is present in the first paint instead of
  // arriving after a client-side theme pass.
  const tenant = await getTenantContext();
  const brandStyle = buildBrandStyle(tenant?.primaryColor, tenant?.secondaryColor);

  // Rendering the person's own choice server-side is what stops the first
  // paint being the other theme.
  const theme = parseThemeChoice((await cookies()).get(THEME_COOKIE)?.value);

  return (
    <html lang="en" data-theme={theme} className={`${inter.variable} ${outfit.variable}`}>
      <head>
        <style id="school-brand" dangerouslySetInnerHTML={{ __html: brandStyle }} />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <AuthHashBridge />
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
