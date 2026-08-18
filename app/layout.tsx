import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import { MotionProvider } from '@/components/layout/MotionProvider';
import { buildBrandStyle } from '@/lib/branding';
import { getTenantContext } from '@/lib/tenant/context';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata: Metadata = {
  title: 'VUI LMS | Premium Learning',
  description: 'Premium university-focused learning management system.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Middleware already read and cached the school's row, so the colours arrive
  // on the request headers and cost no extra query. Rendering them into the
  // document means the school's brand is present in the first paint instead of
  // arriving after a client-side theme pass.
  const tenant = await getTenantContext();
  const brandStyle = buildBrandStyle(tenant?.primaryColor, tenant?.secondaryColor);

  return (
    <html lang="en" data-theme="light" className={`${inter.variable} ${outfit.variable}`}>
      <head>
        <style id="school-brand" dangerouslySetInnerHTML={{ __html: brandStyle }} />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
