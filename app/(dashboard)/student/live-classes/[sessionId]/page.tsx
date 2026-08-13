import { GenericList } from "@/components/academic/GenericList";
import { EmptyState } from "@/components/ui/empty-state";
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
          <div className="aspect-video rounded-[32px] border border-white/10 bg-slate-950/80 p-6 shadow-2xl">
            <iframe src={liveClass.join_url || undefined} title={liveClass.topic || "Live class"} className="h-full w-full rounded-[24px] border-0 bg-slate-900" allow="camera; microphone; fullscreen; display-capture" />
          </div>
          <div className="bg-slate-950/60 backdrop-blur-2xl border border-white/10 rounded-[24px] p-5 text-sm text-slate-300">
            Status: <span className="font-medium text-white capitalize">{liveClass.status}</span>
          </div>
        </div>
      )}
    </GenericList>
  );
}
