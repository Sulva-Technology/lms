import { StudentCourseCard } from "@/components/student/StudentCourseCard";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { CoreReadService } from "@/lib/services/core-read.service";
import { BookOpen } from "lucide-react";
import { describeDataError } from "@/lib/errors/data-error";

export default async function StudentCoursesPage() {
  const session = await requireRole("student");
  const service = new CoreReadService((await createClient()) as any);
  let courses: any[] = [];
  let errorMessage: string | null = null;

  try {
    courses = await service.getStudentCourses(session.user.id);
  } catch (error) {
    errorMessage = describeDataError(error, "Could not load courses.");
  }

  if (errorMessage) return <ErrorState message={errorMessage} />;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="font-outfit text-3xl font-bold text-white flex items-center gap-3">
          <BookOpen className="text-blue-500" /> My Courses
        </h1>
        <p className="text-slate-400 mt-2">Your approved enrollments and learning progress.</p>
      </div>

      {courses.length === 0 ? (
        <EmptyState icon={<BookOpen size={28} />} title="No enrolled courses" description="Submit course registration or wait for approval to see courses here." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course, idx) => (
            <StudentCourseCard key={course.id} course={course} idx={idx} />
          ))}
        </div>
      )}
    </div>
  );
}
