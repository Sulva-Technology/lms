import { InviteUserForm } from "@/components/admin/InviteUserForm";
import { GenericList } from "@/components/academic/GenericList";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { requireRole } from "@/lib/auth/guards";
import { roleLabels } from "@/lib/auth/roles";
import { CoreReadService } from "@/lib/services/core-read.service";
import { createClient } from "@/lib/supabase/server";
import { Users } from "lucide-react";

export default async function AdminUsersPage() {
  const session = await requireRole("department_admin");
  const service = new CoreReadService((await createClient()) as any);
  let users: any[] = [];
  let errorMessage: string | null = null;

  try {
    users = await service.getAdminUsers(session.profile.university_id!);
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Could not load users.";
  }

  if (errorMessage) return <ErrorState message={errorMessage} />;

  return (
    <GenericList title="Users & Invites" description="Invite users and review university accounts." icon={Users}>
      <InviteUserForm universityId={session.profile.university_id} />
      {users.length === 0 ? (
        <EmptyState title="No users yet" description="Send the first invite to create accounts for this university." />
      ) : (
        <DataTable
          data={users}
          keyExtractor={(item: any) => item.id}
          columns={[
            { key: "name", header: "Name", cell: (item: any) => <span className="font-medium text-white">{[item.first_name, item.last_name].filter(Boolean).join(" ") || "Unnamed user"}</span> },
            { key: "email", header: "Email", cell: (item: any) => item.email || "No email" },
            { key: "role", header: "Role", cell: (item: any) => roleLabels[item.role as keyof typeof roleLabels] || item.role },
            { key: "joined", header: "Created", cell: (item: any) => new Date(item.created_at).toLocaleDateString() },
          ]}
        />
      )}
    </GenericList>
  );
}
