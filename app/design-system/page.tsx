import { AppShell } from '@/components/layout/AppShell';
import { CourseCard } from '@/components/course-card';
import { ScheduleCard } from '@/components/schedule-card';
import { Sparkles } from 'lucide-react';
import type { AppShellUser } from '@/components/layout/AppShell';
import Link from 'next/link';

const designSystemUser: AppShellUser = {
  id: 'design-system-preview',
  name: 'VUI Designer',
  email: 'design@vui.edu',
  role: 'admin',
  avatarUrl: null,
  university: {
    id: 'vui-preview',
    name: 'VUI University',
    logoUrl: null,
  },
};

export default function DesignSystemPage() {
  return (
    <AppShell user={designSystemUser}>
      <div className="max-w-4xl mx-auto space-y-16 pb-20">
        
        <div>
          <h1 className="font-outfit text-4xl font-semibold mb-4 text-ink">VUI LMS Design System</h1>
          <p className="text-ink-muted text-lg">A premium, glassmorphism-inspired component library and design language for modern learning management systems.</p>
          <div className="flex flex-wrap gap-4 mt-6">
            <Link href="/docs/design-system" className="border border-line bg-surface px-4 py-2 rounded-full text-sm font-medium text-ink hover:text-ink flex items-center gap-2 border border-line"><Sparkles size={16} className="text-primary" /> DESIGN_SYSTEM.md</Link>
            <Link href="/docs/motion-system" className="border border-line bg-surface px-4 py-2 rounded-full text-sm font-medium text-ink hover:text-ink flex items-center gap-2 border border-line"><Sparkles size={16} className="text-purple-400" /> MOTION_SYSTEM.md</Link>
            <Link href="/docs/glassmorphism-system" className="border border-line bg-surface px-4 py-2 rounded-full text-sm font-medium text-ink hover:text-ink flex items-center gap-2 border border-line"><Sparkles size={16} className="text-emerald-400" /> GLASSMORPHISM_SYSTEM.md</Link>
            <Link href="/docs/student-dashboard-design" className="border border-line bg-surface px-4 py-2 rounded-full text-sm font-medium text-ink hover:text-ink flex items-center gap-2 border border-line"><Sparkles size={16} className="text-orange-400" /> STUDENT_DASHBOARD_DESIGN.md</Link>
            <Link href="/docs/course-learning-design" className="border border-line bg-surface px-4 py-2 rounded-full text-sm font-medium text-ink hover:text-ink flex items-center gap-2 border border-line"><Sparkles size={16} className="text-rose-400" /> COURSE_LEARNING_DESIGN.md</Link>
            <Link href="/docs/video-player-design" className="border border-line bg-surface px-4 py-2 rounded-full text-sm font-medium text-ink hover:text-ink flex items-center gap-2 border border-line"><Sparkles size={16} className="text-cyan-400" /> VIDEO_PLAYER_DESIGN.md</Link>
            <Link href="/docs/live-class-design" className="border border-line bg-surface px-4 py-2 rounded-full text-sm font-medium text-ink hover:text-ink flex items-center gap-2 border border-line"><Sparkles size={16} className="text-yellow-400" /> LIVE_CLASS_DESIGN.md</Link>
            <Link href="/docs/lecturer-dashboard-design" className="border border-line bg-surface px-4 py-2 rounded-full text-sm font-medium text-ink hover:text-ink flex items-center gap-2 border border-line"><Sparkles size={16} className="text-primary" /> LECTURER_DASHBOARD_DESIGN.md</Link>
            <Link href="/docs/admin-dashboard-design" className="border border-line bg-surface px-4 py-2 rounded-full text-sm font-medium text-ink hover:text-ink flex items-center gap-2 border border-line"><Sparkles size={16} className="text-teal-400" /> ADMIN_DASHBOARD_DESIGN.md</Link>
            <Link href="/docs/course-registration-design" className="border border-line bg-surface px-4 py-2 rounded-full text-sm font-medium text-ink hover:text-ink flex items-center gap-2 border border-line"><Sparkles size={16} className="text-primary" /> COURSE_REGISTRATION_DESIGN.md</Link>
            <Link href="/docs/auth-onboarding-design" className="border border-line bg-surface px-4 py-2 rounded-full text-sm font-medium text-ink hover:text-ink flex items-center gap-2 border border-line"><Sparkles size={16} className="text-pink-400" /> AUTH_ONBOARDING_DESIGN.md</Link>
            <Link href="/docs/component-library" className="border border-line bg-surface px-4 py-2 rounded-full text-sm font-medium text-ink hover:text-ink flex items-center gap-2 border border-line"><Sparkles size={16} className="text-primary" /> COMPONENT_LIBRARY.md</Link>
            <Link href="/docs/landing-page-design" className="border border-line bg-surface px-4 py-2 rounded-full text-sm font-medium text-ink hover:text-ink flex items-center gap-2 border border-line"><Sparkles size={16} className="text-ink" /> LANDING_PAGE_DESIGN.md</Link>
            <Link href="/docs/framer-motion-guide" className="border border-line bg-surface px-4 py-2 rounded-full text-sm font-medium text-ink hover:text-ink flex items-center gap-2 border border-line"><Sparkles size={16} className="text-fuchsia-400" /> FRAMER_MOTION_GUIDE.md</Link>
            <Link href="/docs/tailwind-design-tokens" className="border border-line bg-surface px-4 py-2 rounded-full text-sm font-medium text-ink hover:text-ink flex items-center gap-2 border border-line"><Sparkles size={16} className="text-cyan-200" /> TAILWIND_DESIGN_TOKENS.md</Link>
            <Link href="/docs/app-shell-design" className="border border-line bg-surface px-4 py-2 rounded-full text-sm font-medium text-ink hover:text-ink flex items-center gap-2 border border-line"><Sparkles size={16} className="text-purple-300" /> APP_SHELL_DESIGN.md</Link>
            <Link href="/docs/vui-lms-master-design-system" className="border border-line bg-surface px-4 py-2 rounded-full text-sm font-medium text-ink hover:text-ink flex items-center gap-2 border border-line"><Sparkles size={16} className="text-yellow-200" /> VUI_LMS_MASTER_DESIGN_SYSTEM.md</Link>
          </div>
        </div>

        {/* Colors */}
        <section className="space-y-6">
          <h2 className="font-outfit text-2xl font-semibold border-b border-line pb-2">Colors & Gradients</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="h-20 rounded-xl bg-surface border border-line shadow-inner"></div>
              <p className="text-sm font-medium">Base Canvas</p>
              <p className="text-xs text-ink-subtle">slate-950</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-xl bg-status-soft border border-line backdrop-blur-md"></div>
              <p className="text-sm font-medium">Glass Surface</p>
              <p className="text-xs text-ink-subtle">bg-status-soft</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-xl bg-primary shadow-[0_0_15px_rgba(37,99,235,0.4)]"></div>
              <p className="text-sm font-medium">Student Accent</p>
              <p className="text-xs text-ink-subtle">blue-600</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-xl bg-primary shadow-[0_0_15px_rgba(139,92,246,0.4)]"></div>
              <p className="text-sm font-medium">Lecturer Accent</p>
              <p className="text-xs text-ink-subtle">violet-500</p>
            </div>
          </div>
        </section>

        {/* Typography */}
        <section className="space-y-6">
          <h2 className="font-outfit text-2xl font-semibold border-b border-line pb-2">Typography (Outfit & Inter)</h2>
          <div className="panel p-8 space-y-6 rounded-[24px]">
            <div>
              <h1 className="font-outfit text-4xl lg:text-5xl font-semibold tracking-tight text-ink">Display Heading</h1>
              <p className="text-xs text-ink-subtle mt-1">Outfit, SemiBold, 4xl-5xl</p>
            </div>
            <div>
              <h2 className="font-outfit text-2xl font-semibold text-ink">Section Header</h2>
              <p className="text-xs text-ink-subtle mt-1">Outfit, SemiBold, 2xl</p>
            </div>
            <div>
              <p className="font-sans text-base text-ink-muted">Body Large. The quick brown fox jumps over the lazy dog. This is Inter, highly legible for long-form reading and course materials.</p>
              <p className="text-xs text-ink-subtle mt-1">Inter, Regular, Base</p>
            </div>
            <div>
              <p className="font-sans text-sm text-ink-muted">Body Small / Meta Text. Used for timestamps, hints, and secondary information.</p>
              <p className="text-xs text-ink-subtle mt-1">Inter, Regular, sm</p>
            </div>
          </div>
        </section>

        {/* Buttons & Interactive */}
        <section className="space-y-6">
          <h2 className="font-outfit text-2xl font-semibold border-b border-line pb-2">Interactive Elements</h2>
          <div className="flex flex-wrap gap-6 items-center">
            <button className="bg-primary hover:bg-primary-hover text-primary-contrast font-medium px-6 py-2.5 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all active:scale-95">
              Primary Action
            </button>
            <button className="border border-line bg-surface text-ink font-medium px-6 py-2.5 rounded-full transition-all active:scale-95">
              Secondary Glass
            </button>
            <button className="text-ink-muted hover:text-ink hover:bg-ink/[0.06] font-medium px-6 py-2.5 rounded-full transition-colors active:scale-95">
              Ghost Button
            </button>
            <input 
              type="text" 
              placeholder="Input Field..." 
              className="bg-surface border border-line rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-sans w-64"
            />
          </div>
        </section>

        {/* Cards Showcase */}
        <section className="space-y-6">
          <h2 className="font-outfit text-2xl font-semibold border-b border-line pb-2">Course & Scheduling Cards</h2>
          <p className="text-ink-muted text-sm mb-4">Cards utilize glassmorphism, spring physics on hover, and vibrant subtle highlights.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <CourseCard 
              title="Advanced Machine Learning & Neural Networks"
              instructor="Dr. Andrew Chen"
              progress={68}
              imageSeed="tech"
              totalChapters={24}
              completedChapters={16}
              timeRemaining="4h 12m left"
            />
            
            <div className="space-y-4">
              <ScheduleCard 
                title="Machine Learning Lab section 4"
                time="10:00 AM"
                duration="1.5h"
                type="live"
                color="blue"
              />
              <ScheduleCard 
                title="Data Structures & Algorithms"
                time="01:30 PM"
                duration="2h"
                type="in-person"
                location="Room A204"
                color="purple"
              />
            </div>
          </div>
        </section>

      </div>
    </AppShell>
  );
}
