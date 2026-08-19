import { AnnouncementComposer } from "@/components/lecturer/AnnouncementComposer";
import { LecturerCourseCard } from "@/components/lecturer/LecturerCourseCard";
import { PendingGradingCard } from "@/components/lecturer/PendingGradingCard";
import { UpcomingClassCard } from "@/components/lecturer/UpcomingClassCard";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/guards";
import { toDisplayName } from "@/lib/auth/roles";
import { CoreReadService } from "@/lib/services/core-read.service";
import { createClient } from "@/lib/supabase/server";
import { BookOpen, CheckCircle, HelpCircle, TrendingUp, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

type LecturerStatCard = {
  label: string;
  value: string | number;
  Icon: LucideIcon;
  colorClass: string;
};

async function resolveDashboardValue<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch {
    return fallback;
  }
}

export default async function LecturerOverviewPage() {
  const session = await requireRole("lecturer");
  const service = new CoreReadService((await createClient()) as any);
  const courses = await resolveDashboardValue(service.getLecturerCourses(session.user.id), []);
  const sectionIds = courses.map((course) => course.id);
  const [liveSessions, pendingGrading] = await Promise.all([
    resolveDashboardValue(service.getLiveClasses(session.profile.university_id!, sectionIds), []),
    resolveDashboardValue(service.getPendingGrading(sectionIds), []),
  ]);
  const upcomingClasses = liveSessions
    .filter((session) => session.status !== "completed")
    .slice(0, 4)
    .map((session) => ({
      id: session.id,
      title: session.topic,
      course: session.courseCode,
      time: session.startTime,
      duration: session.duration,
      studentCount: courses.find((course) => course.code === session.courseCode)?.enrolledStudents || 0,
    }));
  const data = {
    courses,
    upcomingClasses,
    pendingGrading,
    stats: {
      totalStudents: courses.reduce((sum, course) => sum + course.enrolledStudents, 0),
      averageAttendance: 0,
      assignmentsToGrade: pendingGrading.reduce((sum, item) => sum + item.submissionsCount, 0),
      unansweredQuestions: 0,
    },
  };

  const name = toDisplayName(session.profile.first_name, session.profile.last_name, "Lecturer");
  const statCards: LecturerStatCard[] = [
    { label: "Students", value: data.stats.totalStudents, Icon: Users, colorClass: "text-primary bg-primary-soft" },
    { label: "Attendance", value: `${data.stats.averageAttendance}%`, Icon: TrendingUp, colorClass: "text-emerald-400 bg-emerald-500/10" },
    { label: "To Grade", value: data.stats.assignmentsToGrade, Icon: CheckCircle, colorClass: "text-orange-400 bg-orange-500/10" },
    { label: "Questions", value: data.stats.unansweredQuestions, Icon: HelpCircle, colorClass: "text-primary bg-primary-soft" },
  ];

  return (
      <div className="max-w-7xl mx-auto space-y-8 pb-20">
        <section className="relative rounded-[32px] overflow-hidden bg-surface backdrop-blur-2xl border border-line shadow-2xl">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-soft blur-[120px] rounded-full translate-x-1/3 -translate-y-1/3" />
          <div className="relative z-10 p-8 md:p-12">
            <div className="max-w-2xl mb-8">
              <h1 className="font-outfit text-4xl md:text-5xl font-bold text-ink tracking-tight mb-4 text-balance">
                Welcome back, {name}
              </h1>
              <p className="text-lg text-ink-muted">
                You have {data.upcomingClasses.length} upcoming classes and {data.stats.assignmentsToGrade} submissions waiting for review.
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map(({ label, value, Icon, colorClass }) => (
                <div key={label} className="panel p-5 rounded-2xl flex items-center gap-4 bg-surface border border-line">
                  <div className={`p-3 rounded-xl ${colorClass}`}><Icon size={20} /></div>
                  <div>
                    <p className="text-xs text-ink-muted font-medium uppercase tracking-wider mb-0.5">{label}</p>
                    <h4 className="font-outfit text-2xl font-bold text-ink">{value}</h4>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-8">
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-outfit text-xl font-semibold text-ink">Your Courses</h2>
                <Link href="/lecturer/courses" className="text-sm font-medium text-primary hover:text-primary">View All</Link>
              </div>
              {data.courses.length === 0 ? (
                <EmptyState icon={<BookOpen size={28} />} title="No assigned courses" description="Courses assigned by admins will appear here." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.courses.slice(0, 6).map((course, i) => (
                    <LecturerCourseCard key={course.id} course={course} delay={i * 0.05} />
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="font-outfit text-xl font-semibold text-ink mb-4">Upcoming Classes</h2>
              <div className="space-y-4">
                {data.upcomingClasses.length > 0 ? data.upcomingClasses.map((cls, i) => (
                  <UpcomingClassCard key={cls.id} cls={cls} delay={i * 0.05} />
                )) : (
                  <EmptyState title="No scheduled classes" description="Use the live classes page to schedule a session." />
                )}
              </div>
            </section>
          </div>

          <div className="space-y-8">
            <AnnouncementComposer courses={data.courses.map((course) => ({ id: course.id, code: course.code, title: course.title }))} />

            <div className="bg-surface backdrop-blur-2xl p-6 rounded-2xl border border-line">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-outfit font-semibold text-lg text-ink">Needs Grading</h3>
                <span className="px-2 py-0.5 rounded-full bg-surface text-xs text-ink-muted font-medium">{data.pendingGrading.length} items</span>
              </div>
              <div className="space-y-3">
                {data.pendingGrading.length > 0 ? data.pendingGrading.map((grading) => (
                  <PendingGradingCard key={grading.id} grading={grading} />
                )) : (
                  <p className="text-sm text-ink-muted text-center py-4">Nothing waiting for review.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
