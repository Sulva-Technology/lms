import { GradeItemManager } from "@/components/lecturer/GradeItemManager";
import { GenericList } from "@/components/academic/GenericList";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/guards";
import { readOr } from "@/lib/safe-read";
import { LecturerReadService } from "@/lib/services/completion-read.service";
import { createClient } from "@/lib/supabase/server";
import { Award } from "lucide-react";

export default async function LecturerGradebookPage() {
  const session = await requireRole("lecturer");
  const supabase = await createClient();
  const service = new LecturerReadService(supabase as any);

  const sectionIds = await readOr(service.getSectionIds(session.user.id), [] as string[]);
  const items = await readOr(service.getGradebook(sectionIds), [] as any[]);

  const sectionRows = await readOr(
    supabase
      .from("course_sections")
      .select("id,name,courses(code,title)")
      .in("id", sectionIds)
      .then(({ data }: { data: any[] | null }) => data || []) as Promise<any[]>,
    [] as any[],
  );

  const sections = sectionRows.map((row: any) => {
    const course = Array.isArray(row.courses) ? row.courses[0] : row.courses;
    return { id: row.id, label: course?.code ? `${course.code} — ${row.name}` : row.name };
  });

  return (
    <GenericList
      title="Gradebook"
      description="Grade items and recorded scores for assigned sections."
      icon={Award}
    >
      {sections.length === 0 ? (
        <EmptyState
          title="No assigned sections"
          description="Ask an admin to assign course sections to your profile."
        />
      ) : (
        <GradeItemManager sections={sections} items={items} />
      )}
    </GenericList>
  );
}
