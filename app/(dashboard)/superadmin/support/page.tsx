import { updateSupportTicketStatusAction } from "@/app/actions/settings";
import { GenericList } from "@/components/academic/GenericList";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/guards";
import { readOr } from "@/lib/safe-read";
import { SuperadminService } from "@/lib/services/completion-read.service";
import { createClient } from "@/lib/supabase/server";
import { HelpCircle } from "lucide-react";

const selectClass = "rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-xs text-white outline-none focus:border-blue-400";

export default async function SuperadminSupportPage() {
  await requireRole("super_admin");
  const tickets = await readOr(new SuperadminService((await createClient()) as any).getTickets(), []);

  async function updateTicket(formData: FormData) {
    "use server";
    await updateSupportTicketStatusAction({
      ticketId: String(formData.get("ticketId")),
      status: String(formData.get("status")),
      priority: String(formData.get("priority")),
    });
  }

  return (
    <GenericList title="Support" description="Triage operational support requests across universities." icon={HelpCircle}>
      {tickets.length === 0 ? <EmptyState title="No tickets" description="Support requests will appear here." /> : (
        <DataTable
          data={tickets}
          keyExtractor={(item: any) => item.id}
          columns={[
            { key: "subject", header: "Subject", cell: (item: any) => <span className="font-medium text-white">{item.subject}</span> },
            { key: "university", header: "University", cell: (item: any) => item.universities?.name || "Platform" },
            { key: "requester", header: "Requester", cell: (item: any) => [item.profiles?.first_name, item.profiles?.last_name].filter(Boolean).join(" ") || item.profiles?.email || "Unknown" },
            { key: "created", header: "Created", cell: (item: any) => new Date(item.created_at).toLocaleDateString() },
            {
              key: "action",
              header: "Triage",
              cell: (item: any) => (
                <form action={updateTicket} className="flex min-w-[260px] items-center gap-2">
                  <input type="hidden" name="ticketId" value={item.id} />
                  <select name="priority" defaultValue={item.priority} className={selectClass}>
                    {["low", "normal", "high", "urgent"].map((value) => <option key={value} value={value}>{value}</option>)}
                  </select>
                  <select name="status" defaultValue={item.status} className={selectClass}>
                    {["open", "pending", "resolved", "closed"].map((value) => <option key={value} value={value}>{value}</option>)}
                  </select>
                  <button className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500">Save</button>
                </form>
              )
            },
          ]}
        />
      )}
    </GenericList>
  );
}
