import { RecordingManager } from "@/components/lecturer/RecordingManager";
import { GenericList } from "@/components/academic/GenericList";
import { requireRole } from "@/lib/auth/guards";
import { readOr } from "@/lib/safe-read";
import { LecturerReadService } from "@/lib/services/completion-read.service";
import { createClient } from "@/lib/supabase/server";
import { Video } from "lucide-react";

export default async function LecturerRecordingsPage() {
  const session = await requireRole("lecturer");
  const service = new LecturerReadService((await createClient()) as any);
  const sectionIds = await readOr(service.getSectionIds(session.user.id), [] as string[]);
  const recordings = await readOr(service.getRecordings(sectionIds), [] as any[]);

  return (
    <GenericList
      title="Recordings"
      description="Publish class recordings to students, or keep them hidden while you review."
      icon={Video}
    >
      <RecordingManager recordings={recordings} />
    </GenericList>
  );
}
