import { GenericList } from "@/components/academic/GenericList";
import { requireRole } from "@/lib/auth/guards";
import { SuperadminService } from "@/lib/services/completion-read.service";
import { createClient } from "@/lib/supabase/server";
import { LayoutDashboard } from "lucide-react";

const emptyOverview: Awaited<ReturnType<SuperadminService["getOverview"]>> = {
  universities: [],
  users: [],
  plans: [],
  tickets: [],
};

export default async function SuperadminOverviewPage() {
  await requireRole("super_admin");
  const service = new SuperadminService((await createClient()) as any);
  let data = emptyOverview;

  try {
    data = await service.getOverview();
  } catch {
    data = emptyOverview;
  }

  const cards = [
    ["Universities", data.universities.length],
    ["Users", data.users.length],
    ["Plans", data.plans.length],
    ["Open tickets", data.tickets.filter((ticket: any) => ticket.status !== "closed").length],
  ];

  return (
    <GenericList title="Platform Overview" description="Cross-university operating health." icon={LayoutDashboard}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(([label, value]) => (
          <div key={label} className="bg-surface backdrop-blur-2xl border border-line rounded-[24px] p-5">
            <p className="text-xs uppercase tracking-wider text-ink-subtle">{label}</p>
            <p className="font-outfit text-3xl font-semibold text-ink mt-2">{value}</p>
          </div>
        ))}
      </div>
    </GenericList>
  );
}
