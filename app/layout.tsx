import type {Metadata} from 'next';
import { Inter, Outfit } from 'next/font/google';
import { MotionProvider } from '@/components/layout/MotionProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata: Metadata = {
  title: 'VUI LMS | Premium Learning',
  description: 'Premium university-focused learning management system.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} dark`}>
      <body className="font-sans antialiased text-slate-50 selection:bg-blue-500/30" suppressHydrationWarning>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
