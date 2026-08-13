import { GenericList } from "@/components/academic/GenericList";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/guards";
import { readOr } from "@/lib/safe-read";
import { LecturerReadService } from "@/lib/services/completion-read.service";
import { createClient } from "@/lib/supabase/server";
import { UserCheck } from "lucide-react";

export default async function LecturerAttendancePage() {
  const session = await requireRole("lecturer");
  const service = new LecturerReadService((await createClient()) as any);
  const sectionIds = await readOr(service.getSectionIds(session.user.id), []);
  const sessions = await readOr(service.getAttendance(sectionIds), []);

  return (
    <GenericList title="Attendance" description="Review and manage attendance sessions for assigned sections." icon={UserCheck}>
      {sessions.length === 0 ? (
        <EmptyState title="No attendance sessions" description="Create attendance sessions from live classes or course rosters." />
      ) : (
        <DataTable
          data={sessions}
          keyExtractor={(item: any) => item.id}
          columns={[
            { key: "title", header: "Session", cell: (item: any) => <span className="font-medium text-white">{item.title}</span> },
            { key: "course", header: "Course", cell: (item: any) => item.course_sections?.courses?.code || "Course" },
            { key: "date", header: "Date", cell: (item: any) => new Date(item.date).toLocaleDateString() },
            { key: "present", header: "Present", cell: (item: any) => (item.attendance_records || []).filter((r: any) => r.status === "present").length },
            { key: "total", header: "Marked", cell: (item: any) => (item.attendance_records || []).length },
          ]}
        />
      )}
    </GenericList>
  );
}
