import { DiscussionBoard } from "@/components/discussions/DiscussionBoard";
import { GenericList } from "@/components/academic/GenericList";
import { requireRole } from "@/lib/auth/guards";
import { readOr } from "@/lib/safe-read";
import { toDiscussion } from "@/lib/discussions/shape";
import { StudentReadService } from "@/lib/services/completion-read.service";
import { createClient } from "@/lib/supabase/server";
import { MessageSquare } from "lucide-react";

export default async function StudentDiscussionsPage() {
  const session = await requireRole("student");
  const supabase = await createClient();
  const service = new StudentReadService(supabase as any);

  const sectionIds = await readOr(service.getSectionIds(session.user.id), [] as string[]);
  const discussions = await readOr(service.getDiscussions(sectionIds), [] as any[]);

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
      title="Discussions"
      description="Ask questions and read lecturer-endorsed answers for your courses."
      icon={MessageSquare}
    >
      <DiscussionBoard
        mode="student"
        sections={sections}
        discussions={discussions.map(toDiscussion)}
        detailHrefBase="/student/discussions"
      />
    </GenericList>
  );
}
