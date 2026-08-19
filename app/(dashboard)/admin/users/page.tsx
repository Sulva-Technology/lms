import { InviteUserForm } from "@/components/admin/InviteUserForm";
import { UserRoleManager } from "@/components/admin/UserRoleManager";
import { GenericList } from "@/components/academic/GenericList";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { requireRole } from "@/lib/auth/guards";
import { CoreReadService } from "@/lib/services/core-read.service";
import { createClient } from "@/lib/supabase/server";
import { Users } from "lucide-react";
import { describeDataError } from "@/lib/errors/data-error";

export default async function AdminUsersPage() {
  const session = await requireRole("department_admin");
  const service = new CoreReadService((await createClient()) as any);
  let users: any[] = [];
  let errorMessage: string | null = null;

  try {
    users = await service.getAdminUsers(session.profile.university_id!);
  } catch (error) {
    errorMessage = describeDataError(error, "Could not load users.");
  }

  if (errorMessage) return <ErrorState message={errorMessage} />;

  return (
    <GenericList title="Users & Invites" description="Invite users and review university accounts." icon={Users}>
      <InviteUserForm universityId={session.profile.university_id} />
      {users.length === 0 ? (
        <EmptyState title="No users yet" description="Send the first invite to create accounts for this university." />
      ) : (
        <UserRoleManager users={users as any} currentUserId={session.user.id} />
      )}
    </GenericList>
  );
}
