import Link from "next/link";
import { Video, ArrowLeft } from "lucide-react";
import { GenericList } from "@/components/academic/GenericList";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";

export default async function CourseLiveClassesPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const session = await requireRole("student");
  const supabase = await createClient();

  const { data: enrollment } = await supabase
    .from("course_enrollments")
    .select("id, course_section_id, course_sections(courses(id,code,title))")
    .eq("student_id", session.user.id)
    .eq("status", "active")
    .eq("course_sections.course_id", courseId)
    .maybeSingle();

  const courseSection = Array.isArray(enrollment?.course_sections) ? enrollment?.course_sections[0] : enrollment?.course_sections;
  const course = Array.isArray(courseSection?.courses) ? courseSection?.courses[0] : courseSection?.courses;

  const { data: liveClasses, error } = enrollment
    ? await supabase
        .from("live_classes")
        .select("id,title,topic,description,start_time,end_time,status")
        .eq("course_section_id", enrollment.course_section_id)
        .neq("status", "cancelled")
        .order("start_time", { ascending: true })
    : { data: [], error: null };

  if (error) throw error;

  return (
    <GenericList
      title={`${course?.code || "Course"} live classes`}
      description={course?.title || "Join scheduled course sessions and recordings from your enrolled section."}
      icon={Video}
    >
      <Link href={`/student/courses/${courseId}`} className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary">
        <ArrowLeft size={16} />
        Back to course
      </Link>

      {!enrollment ? (
        <EmptyState title="Course unavailable" description="You need an active enrollment to view live classes for this course." />
      ) : (liveClasses || []).length === 0 ? (
        <EmptyState title="No live classes scheduled" description="Upcoming sessions for this course will appear here." />
      ) : (
        <div className="grid gap-4">
          {(liveClasses || []).map((liveClass: any) => (
            <Link
              key={liveClass.id}
              href={`/student/live-classes/${liveClass.id}`}
              className="rounded-[24px] border border-line bg-surface p-5 transition hover:border-primary/25 hover:bg-ink/[0.06]"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{liveClass.status || "scheduled"}</p>
                  <h2 className="mt-2 font-outfit text-xl font-semibold text-ink">{liveClass.topic || liveClass.title}</h2>
                  {liveClass.description && <p className="mt-1 text-sm text-ink-muted">{liveClass.description}</p>}
                </div>
                <span className="rounded-full border border-line bg-status-soft px-4 py-2 text-sm font-medium text-ink-muted">
                  {formatDateTime(liveClass.start_time)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </GenericList>
  );
}
