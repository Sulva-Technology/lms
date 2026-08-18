import { createUniversityAction, updateUniversityStatusAction } from "@/app/actions/superadmin";
import { GenericList } from "@/components/academic/GenericList";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/guards";
import { env } from "@/lib/env";
import { readOr } from "@/lib/safe-read";
import { SuperadminService } from "@/lib/services/completion-read.service";
import { createClient } from "@/lib/supabase/server";
import { tenantOrigin } from "@/lib/tenant/url";
import { Building } from "lucide-react";
import { redirect } from "next/navigation";

const inputClass = "rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-blue-400";
const statusValues = ["active", "trialing", "suspended", "archived"];

export default async function SuperadminUniversitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; created?: string }>;
}) {
  await requireRole("super_admin");
  const params = await searchParams;
  const rootDomain = env.NEXT_PUBLIC_ROOT_DOMAIN;
  const universities = await readOr(new SuperadminService((await createClient()) as any).getUniversities(), []);

  async function createUniversity(formData: FormData) {
    "use server";
    const result = await createUniversityAction({
      name: String(formData.get("name") || ""),
      subdomain: String(formData.get("subdomain") || ""),
      domain: String(formData.get("domain") || ""),
      status: String(formData.get("status") || "trialing"),
      adminEmail: String(formData.get("adminEmail") || ""),
      adminFirstName: String(formData.get("adminFirstName") || ""),
      adminLastName: String(formData.get("adminLastName") || ""),
    });
    if (result?.error) {
      redirect(`/superadmin/universities?error=${encodeURIComponent(result.error)}`);
    }
    redirect(`/superadmin/universities?created=${encodeURIComponent(result?.url || "")}`);
  }

  async function updateStatus(formData: FormData) {
    "use server";
    await updateUniversityStatusAction({
      universityId: String(formData.get("universityId") || ""),
      status: String(formData.get("status") || "trialing"),
    });
  }

  return (
    <GenericList title="Schools" description="Create tenants, manage status and plan posture." icon={Building}>
      {params.error ? (
        <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-200">{params.error}</p>
      ) : null}
      {params.created ? (
        <p className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-200">
          School created at {params.created}. An invite email is on its way to the school administrator.
        </p>
      ) : null}
      <form action={createUniversity} className="grid gap-4 rounded-[28px] border border-white/10 bg-slate-950/60 p-6 shadow-2xl backdrop-blur-2xl lg:grid-cols-3">
        <input name="name" required placeholder="School name" className={inputClass} />
        <input name="subdomain" required placeholder="unilag" pattern="[a-zA-Z0-9- ]+" className={inputClass} />
        <input name="domain" placeholder="domain.edu (optional)" className={inputClass} />
        <input name="adminEmail" type="email" required placeholder="School admin email" className={inputClass} />
        <input name="adminFirstName" placeholder="Admin first name" className={inputClass} />
        <input name="adminLastName" placeholder="Admin last name" className={inputClass} />
        <select name="status" defaultValue="trialing" className={inputClass}>
          {statusValues.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        <p className="self-center text-xs text-slate-400">
          The school goes live at <span className="text-slate-200">{`<subdomain>.${rootDomain}`}</span> and the admin receives an invite email.
        </p>
        <button className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-glow-blue hover:bg-blue-500">Create school</button>
      </form>
      {universities.length === 0 ? <EmptyState title="No schools" description="New tenants appear here after creation." /> : (
        <DataTable
          data={universities}
          keyExtractor={(item: any) => item.id}
          columns={[
            { key: "name", header: "School", cell: (item: any) => <span className="font-medium text-white">{item.name}</span> },
            { key: "address", header: "Address", cell: (item: any) => (
              <a href={tenantOrigin(item.subdomain, rootDomain)} target="_blank" rel="noreferrer" className="text-blue-300 hover:text-blue-200">
                {item.subdomain}.{rootDomain}
              </a>
            ) },
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
