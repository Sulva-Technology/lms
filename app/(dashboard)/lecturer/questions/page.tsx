import { DiscussionBoard } from "@/components/discussions/DiscussionBoard";
import { GenericList } from "@/components/academic/GenericList";
import { requireRole } from "@/lib/auth/guards";
import { readOr } from "@/lib/safe-read";
import { toDiscussion } from "@/lib/discussions/shape";
import { LecturerReadService } from "@/lib/services/completion-read.service";
import { createClient } from "@/lib/supabase/server";
import { MessageCircle } from "lucide-react";

export default async function LecturerQuestionsPage() {
  const session = await requireRole("lecturer");
  const supabase = await createClient();
  const service = new LecturerReadService(supabase as any);

  const sectionIds = await readOr(service.getSectionIds(session.user.id), [] as string[]);
  const questions = await readOr(service.getQuestions(sectionIds), [] as any[]);

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
      title="Questions"
      description="Answer student questions across your assigned sections."
      icon={MessageCircle}
    >
      <DiscussionBoard
        mode="lecturer"
        sections={sections}
        discussions={questions.map(toDiscussion)}
        detailHrefBase="/lecturer/questions"
      />
    </GenericList>
  );
}
