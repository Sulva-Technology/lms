import Link from "next/link";
import { Activity, BookOpen, Building2, GraduationCap, LayoutPanelLeft, Users } from "lucide-react";
import { requireRole } from "@/lib/auth/guards";
import { readOr } from "@/lib/safe-read";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/ui/status-badge";
import { StructureBootstrapCard } from "@/components/admin/StructureBootstrapCard";

function formatTime(value: string) {
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.round(diff / 60000));
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  return date.toLocaleDateString();
}

function statusForAction(action: string): "success" | "warning" | "info" | "neutral" {
  if (action.includes("ARCHIVED") || action.includes("REJECT")) return "warning";
  if (action.includes("CREATED") || action.includes("UPDATED") || action.includes("APPROVED")) return "success";
  if (action.includes("LOGIN") || action.includes("INVITE")) return "info";
  return "neutral";
}

export default async function AdminDashboardPage() {
  const session = await requireRole("department_admin");
  const supabase = await createClient();
  const universityId = session.profile.university_id!;

  const [studentCount, lecturerCount, facultyCount, departmentCount, courseCount, semesterCount, recentEvents] = await Promise.all([
    readOr(Promise.resolve(supabase.from("profiles").select("id", { count: "exact", head: true }).eq("university_id", universityId).eq("role", "student").then((result) => result.count || 0)), 0),
    readOr(Promise.resolve(supabase.from("profiles").select("id", { count: "exact", head: true }).eq("university_id", universityId).eq("role", "lecturer").then((result) => result.count || 0)), 0),
    readOr(Promise.resolve(supabase.from("faculties").select("id", { count: "exact", head: true }).eq("university_id", universityId).is("deleted_at", null).then((result) => result.count || 0)), 0),
    readOr(Promise.resolve(supabase.from("departments").select("id", { count: "exact", head: true }).eq("university_id", universityId).is("deleted_at", null).then((result) => result.count || 0)), 0),
    readOr(Promise.resolve(supabase.from("courses").select("id", { count: "exact", head: true }).eq("university_id", universityId).is("deleted_at", null).then((result) => result.count || 0)), 0),
    readOr(Promise.resolve(supabase.from("semesters").select("id", { count: "exact", head: true }).eq("university_id", universityId).then((result) => result.count || 0)), 0),
    readOr(
      Promise.resolve(supabase
        .from("audit_logs")
        .select("id, action, entity_type, entity_id, created_at")
        .eq("university_id", universityId)
        .order("created_at", { ascending: false })
        .limit(8)
        .then((result) => result.data || [])),
      []
    ),
  ]);

  const stats = [
    { label: "Students", value: studentCount, icon: GraduationCap, color: "text-success bg-emerald-500/10" },
    { label: "Lecturers", value: lecturerCount, icon: Users, color: "text-teal-300 bg-teal-500/10" },
    { label: "Faculties", value: facultyCount, icon: Building2, color: "text-primary bg-primary-soft" },
    { label: "Departments", value: departmentCount, icon: Activity, color: "text-primary bg-primary-soft" },
    { label: "Courses", value: courseCount, icon: BookOpen, color: "text-warn bg-amber-500/10" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="font-outfit text-4xl lg:text-5xl font-semibold tracking-tight text-ink mb-2">
            University <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Overview</span>
          </h1>
          <p className="text-ink-muted text-lg max-w-xl">
            Live administrative totals for your university tenant.
          </p>
        </div>
        <Link href="/admin/reports" className="bg-emerald-600 hover:bg-emerald-500 text-ink px-5 py-2.5 rounded-full flex items-center gap-2 group whitespace-nowrap transition-colors">
          <LayoutPanelLeft size={16} />
          <span className="font-medium text-sm">Open Reports</span>
        </Link>
      </div>

      {departmentCount === 0 || semesterCount === 0 ? <StructureBootstrapCard /> : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5">
        {stats.map((stat) => (
          <div key={stat.label} className="panel p-6 rounded-[24px] relative overflow-hidden flex flex-col hover:bg-ink/[0.06] transition-colors group border border-line">
            <div className="absolute top-0 right-0 w-32 h-32 blur-[50px] -mr-10 -mt-10 bg-emerald-500/10" />
            <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-line ${stat.color}`}>
              <stat.icon size={22} />
            </div>
            <span className="text-3xl font-bold font-outfit text-ink group-hover:text-emerald-100 transition-colors">{stat.value.toLocaleString()}</span>
            <span className="text-sm text-ink-muted font-medium">{stat.label}</span>
          </div>
        ))}
      </div>

      <section className="panel p-8 rounded-[32px] overflow-hidden">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="font-outfit text-2xl font-semibold text-ink">Recent Administrative Events</h2>
            <p className="mt-1 text-sm text-ink-muted">Real audit entries from this university tenant.</p>
          </div>
          <Link href="/admin/audit" className="rounded-xl border border-line bg-status-soft px-4 py-2 text-sm font-semibold text-ink hover:bg-ink/[0.06]">
            View audit logs
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-line text-sm font-medium text-ink-muted hidden sm:table-row">
                <th className="pb-3 px-4">Event</th>
                <th className="pb-3 px-4">Entity</th>
                <th className="pb-3 px-4">Time</th>
                <th className="pb-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm text-ink-muted">
              {recentEvents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-ink-subtle">No audit events yet. Admin actions will appear here.</td>
                </tr>
              ) : recentEvents.map((event: any) => {
                const status = statusForAction(event.action || "");
                return (
                  <tr key={event.id} className="border-b border-line hover:bg-ink/[0.06] transition-colors">
                    <td className="py-4 px-4 font-medium">
                      <span className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                        {String(event.action || "Event").replaceAll("_", " ")}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-ink-muted">{event.entity_type || "System"}</td>
                    <td className="py-4 px-4 text-ink-muted">{formatTime(event.created_at)}</td>
                    <td className="py-4 px-4"><StatusBadge status={status}>{status}</StatusBadge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
