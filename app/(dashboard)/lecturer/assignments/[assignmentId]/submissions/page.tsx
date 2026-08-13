import { SubmissionGradingPanel, type SubmissionRow } from "@/components/lecturer/SubmissionGradingPanel";
import { GenericList } from "@/components/academic/GenericList";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/guards";
import { readOr } from "@/lib/safe-read";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, ClipboardCheck } from "lucide-react";
import Link from "next/link";

export default async function LecturerSubmissionsPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const { assignmentId } = await params;
  const session = await requireRole("lecturer");
  const supabase = await createClient();

  const { data: assignment } = await supabase
    .from("assignments")
    .select("id,title,total_points,course_section_id")
    .eq("id", assignmentId)
    .maybeSingle();

  const { data: assigned } = assignment
    ? await supabase
        .from("course_lecturers")
        .select("id")
        .eq("course_section_id", assignment.course_section_id)
        .eq("lecturer_id", session.user.id)
        .maybeSingle()
    : { data: null };

  const rawSubmissions = assigned
    ? await readOr(
        supabase
          .from("assignment_submissions")
          .select(
            "id,student_id,content,file_metadata,status,score,feedback,is_late,submitted_at,profiles(first_name,last_name,email)",
          )
          .eq("assignment_id", assignmentId)
          .order("submitted_at", { ascending: false })
          .then(({ data }: { data: any[] | null }) => data || []) as Promise<any[]>,
        [] as any[],
      )
    : [];

  const submissions: SubmissionRow[] = rawSubmissions.map((row: any) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      ...row,
      student_name:
        [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || profile?.email || "Student",
    };
  });

  return (
    <GenericList title={`Submissions — ${assignment?.title || "Assignment"}`} icon={ClipboardCheck}>
      <div className="mb-4">
        <Link
          href="/lecturer/assignments"
          className="flex items-center gap-2 font-medium text-blue-400 hover:text-blue-300"
        >
          <ArrowLeft size={16} /> Back to Assignments
        </Link>
      </div>

      {!assignment || !assigned ? (
        <EmptyState
          title="Assignment unavailable"
          description="This assignment does not exist, or you are not assigned to its course section."
        />
      ) : submissions.length === 0 ? (
        <EmptyState title="No submissions yet" description="Student submissions will appear here as they arrive." />
      ) : (
        <SubmissionGradingPanel
          assignment={{ id: assignment.id, title: assignment.title, totalPoints: assignment.total_points }}
          submissions={submissions}
        />
      )}
    </GenericList>
  );
}
