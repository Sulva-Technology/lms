import { GenericList } from "@/components/academic/GenericList";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/guards";
import { readOr } from "@/lib/safe-read";
import { StudentReadService } from "@/lib/services/completion-read.service";
import { createClient } from "@/lib/supabase/server";
import { MessageSquare } from "lucide-react";

export default async function StudentDiscussionsPage() {
  const session = await requireRole("student");
  const service = new StudentReadService((await createClient()) as any);
  const sectionIds = await readOr(service.getSectionIds(session.user.id), []);
  const discussions = await readOr(service.getDiscussions(sectionIds), []);

  return (
    <GenericList title="Discussions" description="Course questions and lecturer-endorsed answers." icon={MessageSquare}>
      {discussions.length === 0 ? (
        <EmptyState title="No discussions" description="Questions from your enrolled courses will appear here." />
      ) : (
        <DataTable
          data={discussions}
          keyExtractor={(item: any) => item.id}
          columns={[
            { key: "title", header: "Question", cell: (item: any) => <span className="font-medium text-white">{item.title}</span> },
            { key: "course", header: "Course", cell: (item: any) => item.course_sections?.courses?.code || "Course" },
            { key: "replies", header: "Replies", cell: (item: any) => (item.discussion_replies || []).length },
            { key: "status", header: "Status", cell: (item: any) => item.is_answered ? "Answered" : "Open" },
          ]}
        />
      )}
    </GenericList>
  );
}
