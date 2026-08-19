import { GenericList } from "@/components/academic/GenericList";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/guards";
import { readOr } from "@/lib/safe-read";
import { StudentReadService } from "@/lib/services/completion-read.service";
import { createClient } from "@/lib/supabase/server";
import { Target } from "lucide-react";
import Link from "next/link";

export default async function StudentQuizzesPage() {
  const session = await requireRole("student");
  const service = new StudentReadService((await createClient()) as any);
  const sectionIds = await readOr(service.getSectionIds(session.user.id), []);
  const quizzes = await readOr(service.getQuizzes(session.user.id, sectionIds), []);

  return (
    <GenericList title="Quizzes" description="Timed and graded assessments from enrolled courses." icon={Target}>
      {quizzes.length === 0 ? (
        <EmptyState title="No quizzes" description="Published quizzes from your courses will appear here." />
      ) : (
        <DataTable
          data={quizzes}
          keyExtractor={(item: any) => item.id}
          columns={[
            { key: "title", header: "Quiz", cell: (item: any) => <span className="font-medium text-ink">{item.title}</span> },
            { key: "course", header: "Course", cell: (item: any) => item.course_sections?.courses?.code || "Course" },
            { key: "window", header: "Window", cell: (item: any) => item.start_time ? new Date(item.start_time).toLocaleString() : "Open" },
            { key: "status", header: "Status", cell: (item: any) => item.attempt?.status || "not_started" },
            { key: "score", header: "Score", cell: (item: any) => item.attempt?.percentage == null ? "Pending" : `${item.attempt.percentage}%` },
            { key: "action", header: "Action", cell: (item: any) => <Link href={`/student/quizzes/${item.id}`} className="text-primary hover:text-primary">Open</Link> },
          ]}
        />
      )}
    </GenericList>
  );
}
