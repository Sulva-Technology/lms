import { GenericList } from "@/components/academic/GenericList";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/guards";
import { readOr } from "@/lib/safe-read";
import { StudentReadService } from "@/lib/services/completion-read.service";
import { createClient } from "@/lib/supabase/server";
import { UserCheck } from "lucide-react";

export default async function StudentAttendancePage() {
  const session = await requireRole("student");
  const service = new StudentReadService((await createClient()) as any);
  const sectionIds = await readOr(service.getSectionIds(session.user.id), []);
  const attendance = await readOr(service.getAttendance(session.user.id, sectionIds), { summary: [], records: [] });

  return (
    <GenericList title="Attendance" description="Review attendance by course and session." icon={UserCheck}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {attendance.summary.map((item) => (
          <div key={item.course} className="bg-surface backdrop-blur-2xl border border-line rounded-[24px] p-5">
            <p className="text-sm text-ink-muted">{item.course}</p>
            <p className="font-outfit text-3xl font-semibold text-ink mt-2">{item.total ? Math.round((item.present / item.total) * 100) : 0}%</p>
            <p className="text-xs text-ink-subtle mt-1">{item.present} of {item.total} sessions present or late</p>
          </div>
        ))}
      </div>
      {attendance.records.length === 0 ? (
        <EmptyState title="No attendance yet" description="Attendance records appear after lecturers mark sessions." />
      ) : (
        <DataTable
          data={attendance.records}
          keyExtractor={(item: any) => item.id}
          columns={[
            { key: "course", header: "Course", cell: (item: any) => item.course },
            { key: "title", header: "Session", cell: (item: any) => <span className="font-medium text-ink">{item.title}</span> },
            { key: "date", header: "Date", cell: (item: any) => new Date(item.date).toLocaleDateString() },
            { key: "period", header: "Period", cell: (item: any) => item.period ?? 1 },
            { key: "status", header: "Status", cell: (item: any) => <span className="capitalize">{item.status}</span> },
            { key: "notes", header: "Note", cell: (item: any) => item.notes || "—" },
          ]}
        />
      )}
    </GenericList>
  );
}
