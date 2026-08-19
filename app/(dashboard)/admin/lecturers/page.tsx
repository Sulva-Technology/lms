import { InviteUserForm } from "@/components/admin/InviteUserForm";
import { GenericList } from "@/components/academic/GenericList";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { requireRole } from "@/lib/auth/guards";
import { CoreReadService } from "@/lib/services/core-read.service";
import { createClient } from "@/lib/supabase/server";
import { GraduationCap } from "lucide-react";
import { describeDataError } from "@/lib/errors/data-error";

export default async function LecturersPage() {
  const session = await requireRole("department_admin");
  const service = new CoreReadService((await createClient()) as any);
  let lecturers: any[] = [];
  let errorMessage: string | null = null;

  try {
    lecturers = await service.getAdminUsers(session.profile.university_id!, "lecturer");
  } catch (error) {
    errorMessage = describeDataError(error, "Could not load lecturers.");
  }

  if (errorMessage) return <ErrorState message={errorMessage} />;

  return (
    <GenericList title="Lecturers" description="Invite and manage lecturer accounts." icon={GraduationCap}>
      <InviteUserForm defaultRole="lecturer" allowedRoles={["lecturer"]} universityId={session.profile.university_id} />
      {lecturers.length === 0 ? (
        <EmptyState title="No lecturers" description="Lecturer accounts appear here after invite acceptance and onboarding." />
      ) : (
        <DataTable
          data={lecturers}
          keyExtractor={(item: any) => item.id}
          columns={[
            { key: "name", header: "Name", cell: (item: any) => <span className="font-medium text-ink">{[item.first_name, item.last_name].filter(Boolean).join(" ")}</span> },
            { key: "email", header: "Email", cell: (item: any) => item.email || "No email" },
            { key: "created", header: "Created", cell: (item: any) => new Date(item.created_at).toLocaleDateString() },
          ]}
        />
      )}
    </GenericList>
  );
}
