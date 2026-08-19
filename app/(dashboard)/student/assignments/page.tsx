import { GenericList } from "@/components/academic/GenericList";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/guards";
import { readOr } from "@/lib/safe-read";
import { StudentReadService } from "@/lib/services/completion-read.service";
import { createClient } from "@/lib/supabase/server";
import { FileText } from "lucide-react";
import Link from "next/link";

export default async function StudentAssignmentsPage() {
  const session = await requireRole("student");
  const service = new StudentReadService((await createClient()) as any);
  const sectionIds = await readOr(service.getSectionIds(session.user.id), []);
  const assignments = await readOr(service.getAssignments(session.user.id, sectionIds), []);

  return (
    <GenericList title="Assignments" description="Track active coursework, submissions, and grades." icon={FileText}>
      {assignments.length === 0 ? (
        <EmptyState title="No assignments" description="Published assignments from enrolled courses will appear here." />
      ) : (
        <DataTable
          data={assignments}
          keyExtractor={(item: any) => item.id}
          columns={[
            { key: "title", header: "Assignment", cell: (item: any) => <Link href={`/student/assignments/${item.id}`} className="font-medium text-ink hover:text-primary">{item.title}</Link> },
            { key: "course", header: "Course", cell: (item: any) => item.course },
            { key: "due", header: "Due", cell: (item: any) => new Date(item.dueDate).toLocaleString() },
            { key: "points", header: "Points", cell: (item: any) => item.points },
            { key: "status", header: "Status", cell: (item: any) => <span className="capitalize">{String(item.status).replace(/_/g, " ")}</span> },
            { key: "score", header: "Score", cell: (item: any) => item.score == null ? "Pending" : `${item.score}/${item.points}` },
          ]}
        />
      )}
    </GenericList>
  );
}
