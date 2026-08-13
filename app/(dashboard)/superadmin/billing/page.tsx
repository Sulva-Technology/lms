import { updateUniversitySubscriptionAction } from "@/app/actions/superadmin";
import { GenericList } from "@/components/academic/GenericList";
import { DataTable } from "@/components/ui/data-table";
import { requireRole } from "@/lib/auth/guards";
import { readOr } from "@/lib/safe-read";
import { SuperadminService } from "@/lib/services/completion-read.service";
import { createClient } from "@/lib/supabase/server";
import { CreditCard } from "lucide-react";

const inputClass = "rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-blue-400";

export default async function SuperadminBillingPage() {
  await requireRole("super_admin");
  const service = new SuperadminService((await createClient()) as any);
  const [universities, plans] = await Promise.all([
    readOr(service.getUniversities(), []),
    readOr(service.getPlans(), []),
  ]);

  async function assignPlan(formData: FormData) {
    "use server";
    await updateUniversitySubscriptionAction({
      universityId: String(formData.get("universityId")),
      planId: String(formData.get("planId") || ""),
      status: String(formData.get("status") || "trialing"),
    });
  }

  return (
    <GenericList title="Billing" description="Assign plans and track subscription status by university." icon={CreditCard}>
      <form action={assignPlan} className="grid gap-4 rounded-[28px] border border-white/10 bg-slate-950/60 p-6 shadow-2xl backdrop-blur-2xl lg:grid-cols-4">
        <select name="universityId" className={inputClass}>
          {universities.map((university: any) => <option key={university.id} value={university.id}>{university.name}</option>)}
        </select>
        <select name="planId" className={inputClass}>
          <option value="">Unassigned</option>
          {plans.map((plan: any) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
        </select>
        <select name="status" className={inputClass}>
          {["trialing", "active", "past_due", "cancelled"].map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        <button className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-glow-blue hover:bg-blue-500">Update subscription</button>
      </form>
      <DataTable
        data={universities}
        keyExtractor={(item: any) => item.id}
        columns={[
          { key: "university", header: "University", cell: (item: any) => <span className="font-medium text-white">{item.name}</span> },
          { key: "plan", header: "Plan", cell: (item: any) => item.university_plan_subscriptions?.platform_plans?.name || "Unassigned" },
          { key: "status", header: "Subscription", cell: (item: any) => item.university_plan_subscriptions?.status || "Not configured" },
          { key: "tenant", header: "Tenant status", cell: (item: any) => item.status },
        ]}
      />
    </GenericList>
  );
}
