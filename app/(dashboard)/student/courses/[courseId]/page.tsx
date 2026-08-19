import { GenericList } from "@/components/academic/GenericList";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { BookOpen, CheckCircle2, PlayCircle } from "lucide-react";
import Link from "next/link";

export default async function CourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const session = await requireRole("student");
  const supabase = await createClient();

  const { data: enrollment } = await supabase
    .from("course_enrollments")
    .select("id,course_sections(id,name,courses(id,code,title,description,thumbnail_url))")
    .eq("student_id", session.user.id)
    .eq("status", "active")
    .eq("course_sections.course_id", courseId)
    .maybeSingle();

  const courseSection = Array.isArray(enrollment?.course_sections) ? enrollment?.course_sections[0] : enrollment?.course_sections;
  const course = Array.isArray(courseSection?.courses) ? courseSection?.courses[0] : courseSection?.courses;

  const { data: modules, error } = await supabase
    .from("course_modules")
    .select("id,title,description,order_index,lessons(id,title,resource_type,duration_seconds,order_index,is_published,lesson_progress(is_completed,last_accessed))")
    .eq("course_id", courseId)
    .order("order_index", { ascending: true });
  if (error) throw error;

  return (
    <GenericList title={course?.title || "Course"} description={course?.description || course?.code || "Course content"} icon={BookOpen}>
      {!enrollment ? (
        <EmptyState title="Course unavailable" description="You need an active enrollment to view this course." />
      ) : (
        <div className="grid gap-5">
          {(modules || []).length === 0 ? (
            <EmptyState title="No modules" description="Published course modules will appear here." />
          ) : (modules || []).map((module: any) => (
            <section key={module.id} className="bg-surface backdrop-blur-2xl border border-line rounded-[24px] p-6">
              <h2 className="font-outfit text-xl font-semibold text-ink">{module.title}</h2>
              {module.description && <p className="mt-1 text-sm text-ink-muted">{module.description}</p>}
              <div className="mt-5 grid gap-2">
                {(module.lessons || []).filter((lesson: any) => lesson.is_published).sort((a: any, b: any) => a.order_index - b.order_index).map((lesson: any) => {
                  const progress = lesson.lesson_progress?.[0];
                  return (
                    <Link key={lesson.id} href={`/student/courses/${courseId}/lessons/${lesson.id}`} className="flex items-center justify-between rounded-2xl border border-line bg-status-soft p-4 hover:bg-ink/[0.06]">
                      <span className="flex items-center gap-3 text-sm font-medium text-ink"><PlayCircle size={18} className="text-primary" /> {lesson.title}</span>
                      {progress?.is_completed ? <CheckCircle2 size={18} className="text-emerald-300" /> : <span className="text-xs text-ink-subtle">{lesson.resource_type || "Lesson"}</span>}
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </GenericList>
  );
}
