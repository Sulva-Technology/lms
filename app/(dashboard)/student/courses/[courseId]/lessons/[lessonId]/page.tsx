import { LessonWorkspace } from "@/components/video/LessonWorkspace";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { STORAGE_BUCKETS } from "@/lib/storage/paths";
import { ArrowLeft, PlayCircle } from "lucide-react";
import Link from "next/link";

export default async function LessonPage({ params }: { params: Promise<{ courseId: string; lessonId: string }> }) {
  const { courseId, lessonId } = await params;
  const session = await requireRole("student");
  const supabase = await createClient();

  const { data: enrollment } = await supabase
    .from("course_enrollments")
    .select("id, course_sections!inner(course_id)")
    .eq("student_id", session.user.id)
    .eq("status", "active")
    .eq("course_sections.course_id", courseId)
    .maybeSingle();

  const { data: lesson, error } = await supabase
    .from("lessons")
    .select("id,title,content,resource_type,duration_seconds,is_published,course_modules(course_id,title),lesson_progress(is_completed,last_accessed),video_assets(id,playback_id,playback_url,thumbnail_url,status,duration,storage_path,file_name)")
    .eq("id", lessonId)
    .single();

  if (error) return <ErrorState message={error.message} />;

  // Lesson video lives in a private bucket, so playback needs a short-lived
  // signed URL minted per request rather than a stored public URL.
  const videoAsset = (lesson.video_assets || [])[0] as any;
  let videoUrl: string | null = videoAsset?.playback_url || null;

  if (enrollment && videoAsset?.storage_path) {
    const { data: signed } = await supabase.storage
      .from(STORAGE_BUCKETS.LESSON_VIDEO)
      .createSignedUrl(videoAsset.storage_path, 60 * 60 * 4);
    videoUrl = signed?.signedUrl || null;
  }

  const courseModule = Array.isArray(lesson.course_modules) ? lesson.course_modules[0] : lesson.course_modules;

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-20">
      <Link href={`/student/courses/${courseId}`} className="inline-flex items-center gap-2 text-sm font-medium text-blue-300 hover:text-blue-200">
        <ArrowLeft size={16} /> Back to course
      </Link>
      <div className="rounded-[32px] border border-white/10 bg-slate-950/60 p-6 shadow-2xl backdrop-blur-2xl">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/10 text-blue-300">
          <PlayCircle size={24} />
        </div>
        <p className="mb-2 text-sm font-semibold text-blue-200">{courseModule?.title || "Lesson"}</p>
        <h1 className="font-outfit text-3xl font-semibold tracking-tight text-white">{lesson.title}</h1>
        <p className="mt-2 text-slate-400">{lesson.resource_type || "Learning"} module</p>
      </div>
      {!enrollment ? (
        <EmptyState title="Lesson unavailable" description="You need an active enrollment to view this lesson." />
      ) : !lesson.is_published ? (
        <EmptyState title="Lesson not published" description="This lesson is still being prepared by your lecturer." />
      ) : (
        <LessonWorkspace lesson={lesson} courseId={courseId} videoUrl={videoUrl} />
      )}
    </div>
  );
}
