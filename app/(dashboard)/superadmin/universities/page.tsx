import { createUniversityAction, updateUniversityStatusAction } from "@/app/actions/superadmin";
import { GenericList } from "@/components/academic/GenericList";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/guards";
import { readOr } from "@/lib/safe-read";
import { SuperadminService } from "@/lib/services/completion-read.service";
import { createClient } from "@/lib/supabase/server";
import { Building } from "lucide-react";

const inputClass = "rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-blue-400";
const statusValues = ["active", "trialing", "suspended", "archived"];

export default async function SuperadminUniversitiesPage() {
  await requireRole("super_admin");
  const universities = await readOr(new SuperadminService((await createClient()) as any).getUniversities(), []);

  async function createUniversity(formData: FormData) {
    "use server";
    await createUniversityAction({
      name: String(formData.get("name") || ""),
      domain: String(formData.get("domain") || ""),
      status: String(formData.get("status") || "trialing"),
    });
  }

  async function updateStatus(formData: FormData) {
    "use server";
    await updateUniversityStatusAction({
      universityId: String(formData.get("universityId") || ""),
      status: String(formData.get("status") || "trialing"),
    });
  }

  return (
    <GenericList title="Universities" description="Manage tenant status and plan posture." icon={Building}>
      <form action={createUniversity} className="grid gap-4 rounded-[28px] border border-white/10 bg-slate-950/60 p-6 shadow-2xl backdrop-blur-2xl lg:grid-cols-[1fr_1fr_180px_auto]">
        <input name="name" required placeholder="University name" className={inputClass} />
        <input name="domain" placeholder="domain.edu" className={inputClass} />
        <select name="status" defaultValue="trialing" className={inputClass}>
          {statusValues.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        <button className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-glow-blue hover:bg-blue-500">Create university</button>
      </form>
      {universities.length === 0 ? <EmptyState title="No universities" description="New tenants appear here after creation." /> : (
        <DataTable
          data={universities}
          keyExtractor={(item: any) => item.id}
          columns={[
            { key: "name", header: "University", cell: (item: any) => <span className="font-medium text-white">{item.name}</span> },
            { key: "domain", header: "Domain", cell: (item: any) => item.domain },
            { key: "status", header: "Status", cell: (item: any) => item.status },
            { key: "plan", header: "Plan", cell: (item: any) => item.university_plan_subscriptions?.platform_plans?.name || "Unassigned" },
            { key: "created", header: "Created", cell: (item: any) => new Date(item.created_at).toLocaleDateString() },
            { key: "actions", header: "Update", cell: (item: any) => (
              <form action={updateStatus} className="flex min-w-[220px] items-center gap-2">
                <input type="hidden" name="universityId" value={item.id} />
                <select name="status" defaultValue={item.status} className="rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-xs text-white outline-none focus:border-blue-400">
                  {statusValues.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
                <button className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500">Save</button>
              </form>
            ) },
          ]}
        />
      )}
    </GenericList>
  );
}
