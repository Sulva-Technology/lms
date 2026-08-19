import { readFile } from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";

const docs: Record<string, string> = {
  "admin-dashboard-design": "ADMIN_DASHBOARD_DESIGN.md",
  "app-shell-design": "APP_SHELL_DESIGN.md",
  "auth-onboarding-design": "AUTH_ONBOARDING_DESIGN.md",
  "component-library": "COMPONENT_LIBRARY.md",
  "course-learning-design": "COURSE_LEARNING_DESIGN.md",
  "course-registration-design": "COURSE_REGISTRATION_DESIGN.md",
  "design-system": "DESIGN_SYSTEM.md",
  "framer-motion-guide": "FRAMER_MOTION_GUIDE.md",
  "glassmorphism-system": "GLASSMORPHISM_SYSTEM.md",
  "landing-page-design": "LANDING_PAGE_DESIGN.md",
  "lecturer-dashboard-design": "LECTURER_DASHBOARD_DESIGN.md",
  "live-class-design": "LIVE_CLASS_DESIGN.md",
  "motion-system": "MOTION_SYSTEM.md",
  "student-dashboard-design": "STUDENT_DASHBOARD_DESIGN.md",
  "tailwind-design-tokens": "TAILWIND_DESIGN_TOKENS.md",
  "video-player-design": "VIDEO_PLAYER_DESIGN.md",
  "vui-lms-master-design-system": "VUI_LMS_MASTER_DESIGN_SYSTEM.md",
  "security-section": "VUI_LMS_MASTER_DESIGN_SYSTEM.md",
};

export function generateStaticParams() {
  return Object.keys(docs).map((slug) => ({ slug }));
}

export default async function DocsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const file = docs[slug];

  if (!file) notFound();

  const content = await readFile(path.join(process.cwd(), file), "utf8");
  const title = file.replace(".md", "").replaceAll("_", " ");

  return (
    <main className="min-h-screen bg-surface px-6 py-10 text-ink">
      <div className="mx-auto max-w-5xl">
        <Link href="/design-system" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary">
          <ArrowLeft size={16} />
          Back to design system
        </Link>

        <section className="mt-8 overflow-hidden rounded-[28px] border border-line bg-surface shadow-2xl shadow-black/30 backdrop-blur-2xl">
          <header className="border-b border-line bg-status-soft px-6 py-5">
            <div className="flex items-center gap-3">
              <span className="rounded-2xl border border-primary/25 bg-primary-soft p-3 text-primary">
                <FileText size={22} />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-subtle">VUI LMS Documentation</p>
                <h1 className="font-outfit text-2xl font-semibold text-ink">{title}</h1>
              </div>
            </div>
          </header>

          <article className="max-h-[75vh] overflow-auto p-6">
            <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-7 text-ink-muted">{content}</pre>
          </article>
        </section>
      </div>
    </main>
  );
}
