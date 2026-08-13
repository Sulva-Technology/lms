import { DiscussionBoard } from "@/components/discussions/DiscussionBoard";
import { GenericList } from "@/components/academic/GenericList";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/guards";
import { courseLabel, personName, toReply } from "@/lib/discussions/shape";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, MessageSquare } from "lucide-react";
import Link from "next/link";

export default async function StudentDiscussionThreadPage({
  params,
}: {
  params: Promise<{ discussionId: string }>;
}) {
  const { discussionId } = await params;
  const session = await requireRole("student");
  const supabase = await createClient();

  const { data: row } = await supabase
    .from("discussions")
    .select(
      "id,title,content,is_answered,created_at,course_section_id,course_sections(name,courses(code,title)),profiles(first_name,last_name,email),discussion_replies(id,content,is_endorsed,created_at,profiles(first_name,last_name,email))",
    )
    .eq("id", discussionId)
    .maybeSingle();

  const { data: enrollment } = row
    ? await supabase
        .from("course_enrollments")
        .select("id")
        .eq("student_id", session.user.id)
        .eq("course_section_id", row.course_section_id)
        .eq("status", "active")
        .maybeSingle()
    : { data: null };

  const replies = ((row as any)?.discussion_replies || [])
    .slice()
    .sort((a: any, b: any) => String(a.created_at).localeCompare(String(b.created_at)))
    .map(toReply);

  return (
    <GenericList title={row?.title || "Discussion"} icon={MessageSquare}>
      <div className="mb-4">
        <Link
          href="/student/discussions"
          className="flex items-center gap-2 font-medium text-blue-400 hover:text-blue-300"
        >
          <ArrowLeft size={16} /> Back to Discussions
        </Link>
      </div>

      {!row || !enrollment ? (
        <EmptyState
          title="Discussion unavailable"
          description="This discussion does not exist, or you are not enrolled in its course section."
        />
      ) : (
        <DiscussionBoard
          mode="student"
          sections={[]}
          detailHrefBase="/student/discussions"
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
