import { GenericList } from "@/components/academic/GenericList";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/guards";
import { readOr } from "@/lib/safe-read";
import { StudentReadService } from "@/lib/services/completion-read.service";
import { createClient } from "@/lib/supabase/server";
import { Video } from "lucide-react";

export default async function StudentRecordingsPage() {
  const session = await requireRole("student");
  const service = new StudentReadService((await createClient()) as any);
  const sectionIds = await readOr(service.getSectionIds(session.user.id), []);
  const recordings = await readOr(service.getRecordings(sectionIds), []);

  return (
    <GenericList title="Recordings" description="Recorded live classes available for replay." icon={Video}>
      {recordings.length === 0 ? (
        <EmptyState title="No recordings" description="Recorded classes appear here after processing." />
      ) : (
        <DataTable
          data={recordings}
          keyExtractor={(item: any) => item.id}
          columns={[
            { key: "title", header: "Recording", cell: (item: any) => <span className="font-medium text-ink">{item.live_classes?.topic || item.live_classes?.title || "Class recording"}</span> },
            { key: "status", header: "Status", cell: (item: any) => item.status || "Ready" },
            { key: "duration", header: "Duration", cell: (item: any) => item.duration ? `${Math.round(item.duration / 60)} min` : "Unknown" },
            { key: "date", header: "Date", cell: (item: any) => new Date(item.created_at).toLocaleDateString() },
            { key: "link", header: "Link", cell: (item: any) => item.recording_url ? <a className="text-primary hover:text-primary" href={item.recording_url}>Watch</a> : "Processing" },
          ]}
        />
      )}
    </GenericList>
  );
}
