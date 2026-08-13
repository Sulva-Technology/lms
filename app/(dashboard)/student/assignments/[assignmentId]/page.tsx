import { AssignmentSubmissionPanel } from "@/components/student/AssignmentSubmissionPanel";
import { GenericList } from "@/components/academic/GenericList";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";

export default async function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const { assignmentId } = await params;
  const session = await requireRole("student");
  const supabase = await createClient();

  const { data: assignment } = await supabase
    .from("assignments")
    .select(
      "id,title,description,due_date,total_points,allow_late_submissions,max_resubmissions,is_published,course_section_id,course_sections(id,name,courses(code,title))",
    )
    .eq("id", assignmentId)
    .maybeSingle();

  const section = Array.isArray(assignment?.course_sections)
    ? assignment?.course_sections[0]
    : assignment?.course_sections;
  const course = Array.isArray(section?.courses) ? section?.courses[0] : section?.courses;

  const { data: enrollment } = assignment
    ? await supabase
        .from("course_enrollments")
        .select("id")
        .eq("student_id", session.user.id)
        .eq("course_section_id", assignment.course_section_id)
        .eq("status", "active")
        .maybeSingle()
    : { data: null };

  const { data: submission } = assignment
    ? await supabase
        .from("assignment_submissions")
        .select("id,content,file_metadata,status,score,feedback,is_late,attempt_count,submitted_at")
        .eq("assignment_id", assignmentId)
        .eq("student_id", session.user.id)
        .maybeSingle()
    : { data: null };

  // Server Components render once per request, so reading the clock here is
  // deterministic for that response. The client panel receives the result as a
  // prop rather than computing it during its own render.
  // eslint-disable-next-line react-hooks/purity
  const isPastDue = assignment ? Date.now() > new Date(assignment.due_date).getTime() : false;

  return (
    <GenericList title={assignment?.title || "Assignment"} icon={FileText}>
      <div className="mb-4">
        <Link
          href="/student/assignments"
          className="flex items-center gap-2 font-medium text-blue-400 hover:text-blue-300"
        >
          <ArrowLeft size={16} /> Back to Assignments
        </Link>
      </div>

      {!assignment || !assignment.is_published ? (
        <EmptyState
          title="Assignment unavailable"
          description="This assignment does not exist or has not been published yet."
        />
      ) : !enrollment ? (
        <EmptyState
          title="Not enrolled"
          description="You need an active enrollment in this course section to view the assignment."
        />
      ) : (
        <AssignmentSubmissionPanel
          assignment={{
            id: assignment.id,
            title: assignment.title,
            description: assignment.description,
            dueDate: assignment.due_date,
            totalPoints: assignment.total_points,
            allowLateSubmissions: assignment.allow_late_submissions,
            maxResubmissions: assignment.max_resubmissions,
            courseCode: course?.code || section?.name || "Course",
          }}
          submission={(submission as any) ?? null}
          isPastDue={isPastDue}
        />
      )}
    </GenericList>
  );
}
