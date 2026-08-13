import { GenericList } from "@/components/academic/GenericList";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { Video } from "lucide-react";

export default async function LecturerLiveClassRoomPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const session = await requireRole("lecturer");
  const supabase = await createClient();
  const { data: liveClass, error } = await supabase
    .from("live_classes")
    .select("id,title,topic,description,start_time,end_time,status,host_url,lecturer_id,course_sections(courses(code,title)),live_class_participants(id,user_id,role,joined_at,left_at)")
    .eq("id", sessionId)
    .single();
  if (error) throw error;

  return (
    <GenericList title={liveClass.topic || liveClass.title} description={liveClass.description || "Host live class"} icon={Video}>
      {liveClass.lecturer_id !== session.user.id ? (
        <EmptyState title="Live class unavailable" description="Only the assigned lecturer can host this session." />
      ) : (
        <div className="grid gap-6">
          <div className="aspect-video rounded-[32px] border border-white/10 bg-slate-950/80 p-6 shadow-2xl">
            <iframe src={liveClass.host_url || undefined} title={liveClass.topic || "Live class"} className="h-full w-full rounded-[24px] border-0 bg-slate-900" allow="camera; microphone; fullscreen; display-capture" />
          </div>
          <div className="bg-slate-950/60 backdrop-blur-2xl border border-white/10 rounded-[24px] p-5">
            <h2 className="font-outfit text-lg font-semibold text-white">Participants</h2>
            <p className="mt-2 text-sm text-slate-400">{(liveClass.live_class_participants || []).length} participant records captured for this session.</p>
          </div>
        </div>
      )}
    </GenericList>
  );
}
