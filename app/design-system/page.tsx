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
          <h1 className="font-outfit text-4xl font-semibold mb-4 text-white">VUI LMS Design System</h1>
          <p className="text-slate-400 text-lg">A premium, glassmorphism-inspired component library and design language for modern learning management systems.</p>
          <div className="flex flex-wrap gap-4 mt-6">
            <Link href="/docs/design-system" className="glass-button px-4 py-2 rounded-full text-sm font-medium text-slate-200 hover:text-white flex items-center gap-2 border border-white/10"><Sparkles size={16} className="text-blue-400" /> DESIGN_SYSTEM.md</Link>
            <Link href="/docs/motion-system" className="glass-button px-4 py-2 rounded-full text-sm font-medium text-slate-200 hover:text-white flex items-center gap-2 border border-white/10"><Sparkles size={16} className="text-purple-400" /> MOTION_SYSTEM.md</Link>
            <Link href="/docs/glassmorphism-system" className="glass-button px-4 py-2 rounded-full text-sm font-medium text-slate-200 hover:text-white flex items-center gap-2 border border-white/10"><Sparkles size={16} className="text-emerald-400" /> GLASSMORPHISM_SYSTEM.md</Link>
            <Link href="/docs/student-dashboard-design" className="glass-button px-4 py-2 rounded-full text-sm font-medium text-slate-200 hover:text-white flex items-center gap-2 border border-white/10"><Sparkles size={16} className="text-orange-400" /> STUDENT_DASHBOARD_DESIGN.md</Link>
            <Link href="/docs/course-learning-design" className="glass-button px-4 py-2 rounded-full text-sm font-medium text-slate-200 hover:text-white flex items-center gap-2 border border-white/10"><Sparkles size={16} className="text-rose-400" /> COURSE_LEARNING_DESIGN.md</Link>
            <Link href="/docs/video-player-design" className="glass-button px-4 py-2 rounded-full text-sm font-medium text-slate-200 hover:text-white flex items-center gap-2 border border-white/10"><Sparkles size={16} className="text-cyan-400" /> VIDEO_PLAYER_DESIGN.md</Link>
            <Link href="/docs/live-class-design" className="glass-button px-4 py-2 rounded-full text-sm font-medium text-slate-200 hover:text-white flex items-center gap-2 border border-white/10"><Sparkles size={16} className="text-yellow-400" /> LIVE_CLASS_DESIGN.md</Link>
            <Link href="/docs/lecturer-dashboard-design" className="glass-button px-4 py-2 rounded-full text-sm font-medium text-slate-200 hover:text-white flex items-center gap-2 border border-white/10"><Sparkles size={16} className="text-violet-400" /> LECTURER_DASHBOARD_DESIGN.md</Link>
            <Link href="/docs/admin-dashboard-design" className="glass-button px-4 py-2 rounded-full text-sm font-medium text-slate-200 hover:text-white flex items-center gap-2 border border-white/10"><Sparkles size={16} className="text-teal-400" /> ADMIN_DASHBOARD_DESIGN.md</Link>
            <Link href="/docs/course-registration-design" className="glass-button px-4 py-2 rounded-full text-sm font-medium text-slate-200 hover:text-white flex items-center gap-2 border border-white/10"><Sparkles size={16} className="text-indigo-400" /> COURSE_REGISTRATION_DESIGN.md</Link>
            <Link href="/docs/auth-onboarding-design" className="glass-button px-4 py-2 rounded-full text-sm font-medium text-slate-200 hover:text-white flex items-center gap-2 border border-white/10"><Sparkles size={16} className="text-pink-400" /> AUTH_ONBOARDING_DESIGN.md</Link>
            <Link href="/docs/component-library" className="glass-button px-4 py-2 rounded-full text-sm font-medium text-slate-200 hover:text-white flex items-center gap-2 border border-white/10"><Sparkles size={16} className="text-blue-300" /> COMPONENT_LIBRARY.md</Link>
            <Link href="/docs/landing-page-design" className="glass-button px-4 py-2 rounded-full text-sm font-medium text-slate-200 hover:text-white flex items-center gap-2 border border-white/10"><Sparkles size={16} className="text-white" /> LANDING_PAGE_DESIGN.md</Link>
            <Link href="/docs/framer-motion-guide" className="glass-button px-4 py-2 rounded-full text-sm font-medium text-slate-200 hover:text-white flex items-center gap-2 border border-white/10"><Sparkles size={16} className="text-fuchsia-400" /> FRAMER_MOTION_GUIDE.md</Link>
            <Link href="/docs/tailwind-design-tokens" className="glass-button px-4 py-2 rounded-full text-sm font-medium text-slate-200 hover:text-white flex items-center gap-2 border border-white/10"><Sparkles size={16} className="text-cyan-200" /> TAILWIND_DESIGN_TOKENS.md</Link>
            <Link href="/docs/app-shell-design" className="glass-button px-4 py-2 rounded-full text-sm font-medium text-slate-200 hover:text-white flex items-center gap-2 border border-white/10"><Sparkles size={16} className="text-purple-300" /> APP_SHELL_DESIGN.md</Link>
            <Link href="/docs/vui-lms-master-design-system" className="glass-button px-4 py-2 rounded-full text-sm font-medium text-slate-200 hover:text-white flex items-center gap-2 border border-white/10"><Sparkles size={16} className="text-yellow-200" /> VUI_LMS_MASTER_DESIGN_SYSTEM.md</Link>
          </div>
        </div>

        {/* Colors */}
        <section className="space-y-6">
          <h2 className="font-outfit text-2xl font-semibold border-b border-white/10 pb-2">Colors & Gradients</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="h-20 rounded-xl bg-slate-950 border border-slate-800 shadow-inner"></div>
              <p className="text-sm font-medium">Base Canvas</p>
              <p className="text-xs text-slate-500">slate-950</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md"></div>
              <p className="text-sm font-medium">Glass Surface</p>
              <p className="text-xs text-slate-500">bg-white/5</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-xl bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]"></div>
              <p className="text-sm font-medium">Student Accent</p>
              <p className="text-xs text-slate-500">blue-600</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-xl bg-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.4)]"></div>
              <p className="text-sm font-medium">Lecturer Accent</p>
              <p className="text-xs text-slate-500">violet-500</p>
            </div>
          </div>
        </section>

        {/* Typography */}
        <section className="space-y-6">
          <h2 className="font-outfit text-2xl font-semibold border-b border-white/10 pb-2">Typography (Outfit & Inter)</h2>
          <div className="glass-panel p-8 space-y-6 rounded-[24px]">
            <div>
              <h1 className="font-outfit text-4xl lg:text-5xl font-semibold tracking-tight text-white">Display Heading</h1>
              <p className="text-xs text-slate-500 mt-1">Outfit, SemiBold, 4xl-5xl</p>
            </div>
            <div>
              <h2 className="font-outfit text-2xl font-semibold text-white">Section Header</h2>
              <p className="text-xs text-slate-500 mt-1">Outfit, SemiBold, 2xl</p>
            </div>
            <div>
              <p className="font-sans text-base text-slate-300">Body Large. The quick brown fox jumps over the lazy dog. This is Inter, highly legible for long-form reading and course materials.</p>
              <p className="text-xs text-slate-500 mt-1">Inter, Regular, Base</p>
            </div>
            <div>
              <p className="font-sans text-sm text-slate-400">Body Small / Meta Text. Used for timestamps, hints, and secondary information.</p>
              <p className="text-xs text-slate-500 mt-1">Inter, Regular, sm</p>
            </div>
          </div>
        </section>

        {/* Buttons & Interactive */}
        <section className="space-y-6">
          <h2 className="font-outfit text-2xl font-semibold border-b border-white/10 pb-2">Interactive Elements</h2>
          <div className="flex flex-wrap gap-6 items-center">
            <button className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-2.5 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all active:scale-95">
              Primary Action
            </button>
            <button className="glass-button text-white font-medium px-6 py-2.5 rounded-full transition-all active:scale-95">
              Secondary Glass
            </button>
            <button className="text-slate-300 hover:text-white hover:bg-white/5 font-medium px-6 py-2.5 rounded-full transition-colors active:scale-95">
              Ghost Button
            </button>
            <input 
              type="text" 
              placeholder="Input Field..." 
              className="bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-sans w-64"
            />
          </div>
        </section>

        {/* Cards Showcase */}
        <section className="space-y-6">
          <h2 className="font-outfit text-2xl font-semibold border-b border-white/10 pb-2">Course & Scheduling Cards</h2>
          <p className="text-slate-400 text-sm mb-4">Cards utilize glassmorphism, spring physics on hover, and vibrant subtle highlights.</p>
          
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
