import { AssignmentManager } from "@/components/lecturer/AssignmentManager";
import { GenericList } from "@/components/academic/GenericList";
import { requireRole } from "@/lib/auth/guards";
import { readOr } from "@/lib/safe-read";
import { CoreReadService } from "@/lib/services/core-read.service";
import { createClient } from "@/lib/supabase/server";
import { FileText } from "lucide-react";

export default async function LecturerAssignmentsPage() {
  const session = await requireRole("lecturer");
  const supabase = await createClient();
  const service = new CoreReadService(supabase as any);
  let data: any[] = [];

  const courses = await readOr(service.getLecturerCourses(session.user.id), []);
  const sectionIds = courses.map((course) => course.id);
  if (sectionIds.length > 0) {
    const result = await supabase
      .from("assignments")
      .select("id, course_section_id, title, description, due_date, total_points, is_published, allow_late_submissions, max_resubmissions, course_sections ( courses ( code, title ) )")
      .in("course_section_id", sectionIds)
      .is("deleted_at", null)
      .order("due_date", { ascending: true });
    data = result.error ? [] : result.data || [];
  }

  return (
    <GenericList title="Assignments" description="Manage assignment deadlines and publishing." icon={FileText}>
      <AssignmentManager courses={courses} assignments={data} />
    </GenericList>
  );
}
