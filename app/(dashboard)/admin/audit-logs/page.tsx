import { GenericList } from "@/components/academic/GenericList";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/guards";
import { readOr } from "@/lib/safe-read";
import { AdminReadService } from "@/lib/services/completion-read.service";
import { createClient } from "@/lib/supabase/server";
import { History } from "lucide-react";

export default async function AdminAuditLogsPage() {
  const session = await requireRole("department_admin");
  const logs = await readOr(new AdminReadService((await createClient()) as any).getAuditLogs(session.profile.university_id!), []);

  return (
    <GenericList title="Audit Logs" description="Security and operational activity for this university." icon={History}>
      {logs.length === 0 ? (
        <EmptyState title="No audit logs" description="Important account, content, and admin activity will appear here." />
      ) : (
        <DataTable
          data={logs}
          keyExtractor={(item: any) => item.id}
          columns={[
            { key: "action", header: "Action", cell: (item: any) => <span className="font-medium text-ink">{item.action}</span> },
            { key: "entity", header: "Entity", cell: (item: any) => item.entity_type },
            { key: "actor", header: "Actor", cell: (item: any) => [item.profiles?.first_name, item.profiles?.last_name].filter(Boolean).join(" ") || item.profiles?.email || "System" },
            { key: "ip", header: "IP", cell: (item: any) => item.ip_address || "N/A" },
            { key: "date", header: "Date", cell: (item: any) => new Date(item.created_at).toLocaleString() },
          ]}
        />
      )}
    </GenericList>
  );
}
