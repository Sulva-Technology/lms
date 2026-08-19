import { CourseContentManager } from "@/components/lecturer/CourseContentManager";
import { ErrorState } from "@/components/ui/error-state";
import { requireRole } from "@/lib/auth/guards";
import { LearningService } from "@/lib/services/learning.service";
import { createClient } from "@/lib/supabase/server";
import { describeDataError } from "@/lib/errors/data-error";

export default async function LecturerCourseContentPage({ params }: { params: Promise<{ sectionId: string }> }) {
  const { sectionId } = await params;
  const session = await requireRole("lecturer");
  const supabase = await createClient();
  const service = new LearningService(supabase as any);
  let course: any;
  let section: any;
  let modules: any[] = [];

  try {
    section = await service.getSectionCourseForLecturer(sectionId, session.user.id);
    course = Array.isArray(section.courses) ? section.courses[0] : section.courses;
    modules = await service.getCourseContent(course.id, false);
  } catch (error) {
    return <ErrorState message={describeDataError(error, "Could not load course content.")} />;
  }

  return <CourseContentManager course={{ ...course, sectionId, sectionName: section.name }} modules={modules || []} />;
}
