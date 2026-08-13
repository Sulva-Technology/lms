import { DiscussionBoard } from "@/components/discussions/DiscussionBoard";
import { GenericList } from "@/components/academic/GenericList";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/guards";
import { courseLabel, personName, toReply } from "@/lib/discussions/shape";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, MessageCircle } from "lucide-react";
import Link from "next/link";

export default async function LecturerQuestionThreadPage({
  params,
}: {
  params: Promise<{ discussionId: string }>;
}) {
  const { discussionId } = await params;
  const session = await requireRole("lecturer");
  const supabase = await createClient();

  const { data: row } = await supabase
    .from("discussions")
    .select(
      "id,title,content,is_answered,created_at,course_section_id,course_sections(name,courses(code,title)),profiles(first_name,last_name,email),discussion_replies(id,content,is_endorsed,created_at,profiles(first_name,last_name,email))",
    )
    .eq("id", discussionId)
    .maybeSingle();

  const { data: assigned } = row
    ? await supabase
        .from("course_lecturers")
        .select("id")
        .eq("lecturer_id", session.user.id)
        .eq("course_section_id", row.course_section_id)
        .maybeSingle()
    : { data: null };

  const replies = ((row as any)?.discussion_replies || [])
    .slice()
    .sort((a: any, b: any) => String(a.created_at).localeCompare(String(b.created_at)))
    .map(toReply);

  return (
    <GenericList title={row?.title || "Question"} icon={MessageCircle}>
      <div className="mb-4">
        <Link
          href="/lecturer/questions"
          className="flex items-center gap-2 font-medium text-blue-400 hover:text-blue-300"
        >
          <ArrowLeft size={16} /> Back to Questions
        </Link>
      </div>

      {!row || !assigned ? (
        <EmptyState
          title="Question unavailable"
          description="This question does not exist, or you are not assigned to its course section."
        />
      ) : (
        <DiscussionBoard
          mode="lecturer"
          sections={[]}
          detailHrefBase="/lecturer/questions"
          discussion={{
            id: row.id,
            title: row.title,
            content: row.content,
            author_name: personName(Array.isArray(row.profiles) ? row.profiles[0] : row.profiles),
            course_label: courseLabel(row),
            is_answered: Boolean(row.is_answered),
            created_at: row.created_at,
            replies,
          }}
        />
      )}
    </GenericList>
  );
}
