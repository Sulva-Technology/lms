import { GenericList } from "@/components/academic/GenericList";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/guards";
import { readOr } from "@/lib/safe-read";
import { LecturerReadService } from "@/lib/services/completion-read.service";
import { createClient } from "@/lib/supabase/server";
import { Award } from "lucide-react";

export default async function LecturerGradebookPage() {
  const session = await requireRole("lecturer");
  const service = new LecturerReadService((await createClient()) as any);
  const sectionIds = await readOr(service.getSectionIds(session.user.id), []);
  const items = await readOr(service.getGradebook(sectionIds), []);

  return (
    <GenericList title="Gradebook" description="Grade items and recorded scores for assigned sections." icon={Award}>
      {items.length === 0 ? (
        <EmptyState title="No grade items" description="Create grade items or grade submissions to populate the gradebook." />
      ) : (
        <DataTable
          data={items}
          keyExtractor={(item: any) => item.id}
          columns={[
            { key: "item", header: "Item", cell: (item: any) => <span className="font-medium text-white">{item.name || item.title}</span> },
            { key: "course", header: "Course", cell: (item: any) => item.course_sections?.courses?.code || "Course" },
            { key: "max", header: "Max", cell: (item: any) => item.max_score || 100 },
            { key: "weight", header: "Weight", cell: (item: any) => `${item.weight || item.weight_percentage || 0}%` },
            { key: "graded", header: "Grades", cell: (item: any) => (item.grades || []).length },
          ]}
        />
      )}
    </GenericList>
  );
}
