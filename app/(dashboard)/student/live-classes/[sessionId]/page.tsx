import { GenericList } from "@/components/academic/GenericList";
import { EmptyState } from "@/components/ui/empty-state";
import { LiveClassRoom } from "@/components/live/LiveClassRoom";
import { requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { Video } from "lucide-react";

export default async function StudentLiveClassRoomPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const session = await requireRole("student");
  const supabase = await createClient();
  const { data: liveClass, error } = await supabase
    .from("live_classes")
    .select("id,title,topic,description,start_time,end_time,status,join_url,course_section_id,course_sections(courses(code,title))")
    .eq("id", sessionId)
    .single();
  if (error) throw error;

  const { data: enrollment } = await supabase
    .from("course_enrollments")
    .select("id")
    .eq("course_section_id", liveClass.course_section_id)
    .eq("student_id", session.user.id)
    .eq("status", "active")
    .maybeSingle();

  return (
    <GenericList title={liveClass.topic || liveClass.title} description={liveClass.description || "Live class room"} icon={Video}>
      {!enrollment ? (
        <EmptyState title="Live class unavailable" description="Only enrolled students can join this session." />
      ) : (
        <div className="grid gap-6">
          <LiveClassRoom
            sessionId={liveClass.id}
            roomUrl={liveClass.join_url}
            role="guest"
            topic={liveClass.topic || liveClass.title}
          />
          <div className="bg-surface backdrop-blur-2xl border border-line rounded-[24px] p-5 text-sm text-ink-muted">
            Status: <span className="font-medium text-ink capitalize">{liveClass.status}</span>
          </div>
        </div>
      )}
    </GenericList>
  );
}
