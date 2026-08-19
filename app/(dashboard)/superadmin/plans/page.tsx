import { managePlatformPlanAction } from "@/app/actions/superadmin";
import { GenericList } from "@/components/academic/GenericList";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/guards";
import { readOr } from "@/lib/safe-read";
import { SuperadminService } from "@/lib/services/completion-read.service";
import { createClient } from "@/lib/supabase/server";
import { Award, Plus } from "lucide-react";

const inputClass = "rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-primary";

export default async function SuperadminPlansPage() {
  await requireRole("super_admin");
  const plans = await readOr(new SuperadminService((await createClient()) as any).getPlans(), []);

  async function createPlan(formData: FormData) {
    "use server";
    await managePlatformPlanAction({
      name: String(formData.get("name")),
      slug: String(formData.get("slug")),
      description: String(formData.get("description") || ""),
      monthlyPriceCents: Number(formData.get("monthlyPriceCents") || 0),
      maxStudents: formData.get("maxStudents") ? Number(formData.get("maxStudents")) : undefined,
      maxStorageGb: formData.get("maxStorageGb") ? Number(formData.get("maxStorageGb")) : undefined,
      isActive: formData.get("isActive") === "on",
    });
  }

  async function updatePlanStatus(formData: FormData) {
    "use server";
    await managePlatformPlanAction({
      id: String(formData.get("id")),
      name: String(formData.get("name")),
      slug: String(formData.get("slug")),
      description: String(formData.get("description") || ""),
      monthlyPriceCents: Number(formData.get("monthlyPriceCents") || 0),
      maxStudents: formData.get("maxStudents") ? Number(formData.get("maxStudents")) : undefined,
      maxStorageGb: formData.get("maxStorageGb") ? Number(formData.get("maxStorageGb")) : undefined,
      isActive: formData.get("isActive") === "true",
    });
  }

  return (
    <GenericList title="Plans" description="Create and maintain platform packages for universities." icon={Award}>
      <form action={createPlan} className="rounded-[28px] border border-line bg-surface p-6 shadow-2xl backdrop-blur-2xl">
        <div className="mb-5 flex items-center gap-3">
          <Plus className="text-primary" size={20} />
          <h2 className="font-outfit text-xl font-semibold text-ink">New platform plan</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <input name="name" placeholder="Plan name" className={inputClass} />
          <input name="slug" placeholder="plan-slug" className={inputClass} />
          <input name="monthlyPriceCents" type="number" placeholder="Monthly price cents" className={inputClass} />
          <input name="maxStudents" type="number" placeholder="Max students" className={inputClass} />
          <input name="maxStorageGb" type="number" placeholder="Max storage GB" className={inputClass} />
          <label className="flex items-center justify-between rounded-xl border border-line bg-status-soft px-4 py-3 text-sm text-ink">
            Active <input name="isActive" type="checkbox" defaultChecked className="accent-primary" />
          </label>
          <textarea name="description" placeholder="Description" rows={3} className={`${inputClass} lg:col-span-2`} />
          <button className="inline-flex h-fit items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-contrast hover:bg-primary-hover">
            <Plus size={16} /> Create plan
          </button>
        </div>
      </form>

      {plans.length === 0 ? <EmptyState title="No plans" description="Create platform plans to assign universities." /> : (
        <DataTable
          data={plans}
          keyExtractor={(item: any) => item.id}
          columns={[
            { key: "name", header: "Plan", cell: (item: any) => <span className="font-medium text-ink">{item.name}</span> },
            { key: "slug", header: "Slug", cell: (item: any) => item.slug },
            { key: "price", header: "Monthly", cell: (item: any) => `$${(Number(item.monthly_price_cents || 0) / 100).toFixed(2)}` },
            { key: "students", header: "Students", cell: (item: any) => item.max_students || "Unlimited" },
            { key: "storage", header: "Storage", cell: (item: any) => item.max_storage_gb ? `${item.max_storage_gb} GB` : "Unlimited" },
            { key: "status", header: "Status", cell: (item: any) => item.is_active ? "Active" : "Inactive" },
            { key: "actions", header: "Actions", cell: (item: any) => (
              <form action={updatePlanStatus}>
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="name" value={item.name} />
                <input type="hidden" name="slug" value={item.slug} />
                <input type="hidden" name="description" value={item.description || ""} />
                <input type="hidden" name="monthlyPriceCents" value={item.monthly_price_cents || 0} />
                <input type="hidden" name="maxStudents" value={item.max_students || ""} />
                <input type="hidden" name="maxStorageGb" value={item.max_storage_gb || ""} />
                <input type="hidden" name="isActive" value={item.is_active ? "false" : "true"} />
                <button className={`rounded-lg px-3 py-2 text-xs font-semibold ${item.is_active ? "border border-red-500/20 bg-red-500/10 text-red-300 hover:bg-red-500/20" : "border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"}`}>
                  {item.is_active ? "Archive" : "Reactivate"}
                </button>
              </form>
            ) },
          ]}
        />
      )}
    </GenericList>
  );
}
