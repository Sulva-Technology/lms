import { GenericList } from "@/components/academic/GenericList";
import { DataTable } from "@/components/ui/data-table";
import { requireRole } from "@/lib/auth/guards";
import { readOr } from "@/lib/safe-read";
import { AdminReadService } from "@/lib/services/completion-read.service";
import { createClient } from "@/lib/supabase/server";
import { BarChart } from "lucide-react";

export default async function AdminReportsPage() {
  const session = await requireRole("department_admin");
  const reports = await readOr(new AdminReadService((await createClient()) as any).getReports(session.profile.university_id!), {
    studentCount: 0,
    lecturerCount: 0,
    courseCount: 0,
    storageBytes: 0,
    registrations: [],
    attendance: [],
  });
  const cards = [
    ["Students", reports.studentCount],
    ["Lecturers", reports.lecturerCount],
    ["Courses", reports.courseCount],
    ["Storage", `${(reports.storageBytes / 1024 / 1024).toFixed(1)} MB`],
  ];

  return (
    <GenericList title="Reports" description="University-level operational metrics." icon={BarChart}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(([label, value]) => (
          <div key={label} className="bg-slate-950/60 backdrop-blur-2xl border border-white/10 rounded-[24px] p-5">
            <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
            <p className="font-outfit text-3xl font-semibold text-white mt-2">{value}</p>
          </div>
        ))}
      </div>
      <DataTable
        data={[
          { metric: "Registrations", value: reports.registrations.length, detail: `${reports.registrations.filter((r: any) => r.status === "approved").length} approved` },
          { metric: "Attendance records", value: reports.attendance.length, detail: `${reports.attendance.filter((r: any) => r.status === "present").length} present` },
        ]}
        keyExtractor={(item) => item.metric}
        columns={[
          { key: "metric", header: "Metric", cell: (item) => <span className="font-medium text-white">{item.metric}</span> },
          { key: "value", header: "Value", cell: (item) => item.value },
          { key: "detail", header: "Detail", cell: (item) => item.detail },
        ]}
      />
    </GenericList>
  );
}
