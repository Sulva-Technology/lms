import { StudentCourseCard } from "@/components/student/StudentCourseCard"
import { UpcomingLiveClassCard } from "@/components/student/UpcomingLiveClassCard"
import { AssignmentDueCard } from "@/components/student/AssignmentDueCard"
import { StudentAnnouncementCard } from "@/components/student/StudentAnnouncementCard"
import { EmptyState } from "@/components/ui/empty-state"
import { createClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/auth/guards"
import { CoreReadService } from "@/lib/services/core-read.service"
import { toDisplayName } from "@/lib/auth/roles"
import { Sparkles, ArrowRight, TrendingUp, Calendar as CalendarIcon, Flame, BookOpen, AlertCircle, Video } from "lucide-react"
import Link from "next/link"

const defaultStudentStats: Awaited<ReturnType<CoreReadService["getStudentStats"]>> = {
  gpa: 0,
  creditsCompleted: 0,
  totalCredits: 120,
  assignmentsDone: 0,
  attendanceRate: 0,
  learningStreakDays: 0,
}

async function resolveDashboardValue<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise
  } catch {
    return fallback
  }
}

export default async function StudentDashboardPage() {
  const session = await requireRole("student")
  const supabase = await createClient()
  const service = new CoreReadService(supabase as any)
  const sectionIds = await resolveDashboardValue(service.getStudentSectionIds(session.user.id), [])
  const [courses, assignments, announcements, liveSessions, stats] = await Promise.all([
    resolveDashboardValue(service.getStudentCourses(session.user.id), []),
    resolveDashboardValue(service.getStudentAssignments(session.profile.university_id!, sectionIds), []),
    resolveDashboardValue(service.getAnnouncements(session.profile.university_id!, sectionIds), []),
    resolveDashboardValue(service.getLiveClasses(session.profile.university_id!, sectionIds), []),
    resolveDashboardValue(service.getStudentStats(session.user.id, sectionIds), defaultStudentStats),
  ])

  const upcomingClasses = liveSessions
    .filter((session) => session.status !== "completed")
    .slice(0, 4)
    .map((session, index) => ({
      id: session.id,
      title: session.topic,
      course: session.courseCode,
      instructor: session.lecturerName,
      startTime: session.startTime,
      duration: session.duration,
      instructorAvatar: session.lecturerAvatar,
      theme: (["blue", "purple", "emerald", "orange"] as const)[index % 4],
    }))

  const firstName = session.profile.first_name || toDisplayName(session.profile.first_name, session.profile.last_name, "Student").split(" ")[0]

  return (
    <div className="max-w-7xl mx-auto space-y-10 selection:bg-primary-soft">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="font-outfit text-4xl lg:text-5xl font-semibold tracking-tight text-ink mb-2">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">{firstName}</span>
          </h1>
          <p className="text-ink-muted text-lg max-w-xl">
            You have <span className="text-primary font-medium pb-px border-b border-primary/25">{upcomingClasses.length} upcoming live classes</span> and {assignments.length} active deadlines.
          </p>
        </div>
        <button className="panel px-5 py-2.5 rounded-full flex items-center gap-2 group whitespace-nowrap hover:bg-ink/[0.06] transition-colors border border-purple-500/20">
          <Sparkles size={16} className="text-purple-400" />
          <span className="font-medium text-sm text-ink">View AI Summary</span>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-10">
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-outfit text-2xl font-semibold flex items-center gap-2 text-ink">
                <BookOpen className="text-primary" /> Continue Learning
              </h2>
              <Link href="/student/courses" className="text-sm font-medium text-ink-muted hover:text-ink flex items-center gap-1 group transition-colors">
                All Courses <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {courses.length === 0 ? (
              <EmptyState icon={<BookOpen size={28} />} title="No enrolled courses yet" description="Approved course registrations will appear here." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {courses.slice(0, 2).map((course, idx) => (
                  <StudentCourseCard key={course.id} course={course} idx={idx} />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="font-outfit text-2xl font-semibold mb-6 text-ink flex items-center gap-2">
              <TrendingUp className="text-emerald-500" /> Academic Overview
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                ["GPA", stats.gpa, "bg-primary-soft"],
                ["Credits", `${stats.creditsCompleted}/${stats.totalCredits}`, "bg-purple-500/10"],
                ["Attendance", `${stats.attendanceRate}%`, "bg-emerald-500/10"],
                ["Streak", stats.learningStreakDays, "bg-orange-500/10"],
              ].map(([label, value, glow], index) => (
                <div key={label} className="panel p-5 rounded-[20px] relative overflow-hidden group hover:bg-ink/[0.06] transition-colors">
                  <div className={`absolute top-0 right-0 w-24 h-24 ${glow} blur-[30px] -mr-10 -mt-10`} />
                  <p className="text-ink-muted text-xs mb-2 uppercase tracking-wider font-medium">{label}</p>
                  <div className="flex items-center gap-2">
                    <h3 className="font-outfit text-3xl font-semibold text-ink">{value}</h3>
                    {index === 3 && <Flame size={20} className="text-orange-500" />}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-outfit text-2xl font-semibold mb-6 flex items-center gap-2 text-ink">
              Recent Announcements
            </h2>
            {announcements.length === 0 ? (
              <EmptyState title="No announcements" description="Course and university updates will appear here." />
            ) : (
              <div className="space-y-3">
                {announcements.map((announcement) => (
                  <StudentAnnouncementCard key={announcement.id} announcement={announcement} />
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-8">
          <section className="panel p-6 rounded-[24px] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 opacity-50" />
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-outfit text-xl font-semibold text-ink flex items-center gap-2"><CalendarIcon size={20} className="text-primary"/> Schedule</h2>
              <span className="bg-primary-soft text-primary text-xs font-bold px-3 py-1.5 rounded-full border border-primary/25">Live</span>
            </div>

            <div className="space-y-4 relative z-10 w-full">
              {upcomingClasses.length > 0 ? (
                upcomingClasses.map((liveClass, idx) => (
                  <UpcomingLiveClassCard key={liveClass.id} liveClass={liveClass} idx={idx} />
                ))
              ) : (
                <EmptyState icon={<Video size={24} />} title="No upcoming classes" className="py-8" />
              )}
            </div>
          </section>

          <section className="panel p-6 rounded-[24px]">
            <h2 className="font-outfit text-xl font-semibold mb-6 text-ink flex items-center gap-2">
              <AlertCircle size={20} className="text-orange-400" /> Pending Deadlines
            </h2>
            <div className="space-y-3">
              {assignments.length > 0 ? assignments.map((assignment, idx) => (
                <AssignmentDueCard key={assignment.id} assignment={assignment} idx={idx} />
              )) : (
                <p className="text-ink-muted text-sm text-center py-4">All caught up.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
