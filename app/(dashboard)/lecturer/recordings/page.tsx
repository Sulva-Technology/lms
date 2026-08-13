import { GenericList } from "@/components/academic/GenericList";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/guards";
import { readOr } from "@/lib/safe-read";
import { LecturerReadService } from "@/lib/services/completion-read.service";
import { createClient } from "@/lib/supabase/server";
import { Video } from "lucide-react";

export default async function LecturerRecordingsPage() {
  const session = await requireRole("lecturer");
  const service = new LecturerReadService((await createClient()) as any);
  const sectionIds = await readOr(service.getSectionIds(session.user.id), []);
  const recordings = await readOr(service.getRecordings(sectionIds), []);

  return (
    <GenericList title="Recordings" description="Class recordings from Daily live sessions and uploaded assets." icon={Video}>
      {recordings.length === 0 ? (
        <EmptyState title="No recordings" description="Recordings appear after live classes finish processing." />
      ) : (
        <DataTable
          data={recordings}
          keyExtractor={(item: any) => item.id}
          columns={[
            { key: "title", header: "Class", cell: (item: any) => <span className="font-medium text-white">{item.live_classes?.topic || item.live_classes?.title || "Recording"}</span> },
            { key: "course", header: "Course", cell: (item: any) => item.live_classes?.course_sections?.courses?.code || "Course" },
            { key: "status", header: "Status", cell: (item: any) => item.status || "Ready" },
            { key: "date", header: "Date", cell: (item: any) => new Date(item.created_at).toLocaleDateString() },
            { key: "link", header: "Link", cell: (item: any) => item.recording_url ? <a className="text-blue-300 hover:text-blue-200" href={item.recording_url}>Open</a> : "Processing" },
          ]}
        />
      )}
    </GenericList>
  );
}
