import { LecturerCourseCard } from "@/components/lecturer/LecturerCourseCard";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { requireRole } from "@/lib/auth/guards";
import { CoreReadService } from "@/lib/services/core-read.service";
import { createClient } from "@/lib/supabase/server";
import { BookOpen } from "lucide-react";

export default async function LecturerCoursesPage() {
  const session = await requireRole("lecturer");
  const service = new CoreReadService((await createClient()) as any);
  let courses: any[] = [];
  let errorMessage: string | null = null;

  try {
    courses = await service.getLecturerCourses(session.user.id);
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Could not load assigned courses.";
  }

  if (errorMessage) return <ErrorState message={errorMessage} />;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="font-outfit text-3xl font-bold text-white flex items-center gap-3">
          <BookOpen className="text-violet-500" /> My Assigned Courses
        </h1>
        <p className="text-slate-400 mt-2">Manage assigned courses, content, and enrolled students.</p>
      </div>

      {courses.length === 0 ? (
        <EmptyState icon={<BookOpen size={28} />} title="No assigned courses" description="Ask an admin to assign course sections to your profile." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course, idx) => (
            <LecturerCourseCard key={course.id} course={course} delay={idx * 0.05} />
          ))}
        </div>
      )}
    </div>
  );
}
