import { GenericList } from "@/components/academic/GenericList";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/guards";
import { readOr } from "@/lib/safe-read";
import { StudentReadService } from "@/lib/services/completion-read.service";
import { createClient } from "@/lib/supabase/server";
import { Award } from "lucide-react";

export default async function StudentGradesPage() {
  const session = await requireRole("student");
  const service = new StudentReadService((await createClient()) as any);
  const sectionIds = await readOr(service.getSectionIds(session.user.id), []);
  const grades = await readOr(service.getGrades(session.user.id, sectionIds), { rows: [], average: 0 });

  return (
    <GenericList title="Grades" description="Weighted gradebook results across enrolled courses." icon={Award}>
      <div className="bg-surface backdrop-blur-2xl border border-line rounded-[24px] p-6">
        <p className="text-sm text-ink-muted">Current average</p>
        <p className="font-outfit text-4xl font-semibold text-ink mt-2">{grades.average}%</p>
      </div>
      {grades.rows.length === 0 ? (
        <EmptyState title="No grades posted" description="Grades appear after lecturers publish scores." />
      ) : (
        <DataTable
          data={grades.rows}
          keyExtractor={(item: any) => item.id}
          columns={[
            { key: "item", header: "Item", cell: (item: any) => <span className="font-medium text-ink">{item.item}</span> },
            { key: "course", header: "Course", cell: (item: any) => item.course },
            { key: "score", header: "Score", cell: (item: any) => `${item.score}/${item.maxScore}` },
            { key: "weight", header: "Weight", cell: (item: any) => `${item.weight}%` },
            { key: "percent", header: "Percent", cell: (item: any) => `${item.percentage}%` },
          ]}
        />
      )}
    </GenericList>
  );
}
