import { InviteUserForm } from "@/components/admin/InviteUserForm";
import { GenericList } from "@/components/academic/GenericList";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { requireRole } from "@/lib/auth/guards";
import { CoreReadService } from "@/lib/services/core-read.service";
import { createClient } from "@/lib/supabase/server";
import { Users } from "lucide-react";
import { describeDataError } from "@/lib/errors/data-error";

export default async function StudentsPage() {
  const session = await requireRole("department_admin");
  const service = new CoreReadService((await createClient()) as any);
  let students: any[] = [];
  let errorMessage: string | null = null;

  try {
    students = await service.getAdminUsers(session.universityId!, "student");
  } catch (error) {
    errorMessage = describeDataError(error, "Could not load students.");
  }

  if (errorMessage) return <ErrorState message={errorMessage} />;

  return (
    <GenericList title="Students" description="Invite and manage student accounts." icon={Users}>
      <InviteUserForm defaultRole="student" allowedRoles={["student"]} universityId={session.universityId} />
      {students.length === 0 ? (
        <EmptyState title="No students" description="Student accounts appear here after invite acceptance and onboarding." />
      ) : (
        <DataTable
          data={students}
          keyExtractor={(item: any) => item.id}
          columns={[
            { key: "name", header: "Name", cell: (item: any) => <span className="font-medium text-ink">{[item.first_name, item.last_name].filter(Boolean).join(" ")}</span> },
            { key: "student", header: "Student ID", cell: (item: any) => item.student_id || "Not set" },
            { key: "email", header: "Email", cell: (item: any) => item.email || "No email" },
            { key: "created", header: "Created", cell: (item: any) => new Date(item.created_at).toLocaleDateString() },
          ]}
        />
      )}
    </GenericList>
  );
}
