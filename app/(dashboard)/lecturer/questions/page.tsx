import { GenericList } from "@/components/academic/GenericList";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/guards";
import { readOr } from "@/lib/safe-read";
import { LecturerReadService } from "@/lib/services/completion-read.service";
import { createClient } from "@/lib/supabase/server";
import { MessageCircle } from "lucide-react";

export default async function LecturerQuestionsPage() {
  const session = await requireRole("lecturer");
  const service = new LecturerReadService((await createClient()) as any);
  const sectionIds = await readOr(service.getSectionIds(session.user.id), []);
  const questions = await readOr(service.getQuestions(sectionIds), []);

  return (
    <GenericList title="Questions" description="Student discussions and questions across assigned sections." icon={MessageCircle}>
      {questions.length === 0 ? (
        <EmptyState title="No questions" description="Student questions from assigned course sections will appear here." />
      ) : (
        <DataTable
          data={questions}
          keyExtractor={(item: any) => item.id}
          columns={[
            { key: "title", header: "Question", cell: (item: any) => <span className="font-medium text-white">{item.title}</span> },
            { key: "course", header: "Course", cell: (item: any) => item.course_sections?.courses?.code || "Course" },
            { key: "student", header: "Student", cell: (item: any) => [item.profiles?.first_name, item.profiles?.last_name].filter(Boolean).join(" ") || item.profiles?.email || "Student" },
            { key: "replies", header: "Replies", cell: (item: any) => (item.discussion_replies || []).length },
            { key: "status", header: "Status", cell: (item: any) => item.is_answered ? "Answered" : "Open" },
          ]}
        />
      )}
    </GenericList>
  );
}
