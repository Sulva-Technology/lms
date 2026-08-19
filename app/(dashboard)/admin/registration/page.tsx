import { approveRegistrationAction } from "@/app/actions/course-registration";
import { GenericList } from "@/components/academic/GenericList";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { requireRole } from "@/lib/auth/guards";
import { CoreReadService } from "@/lib/services/core-read.service";
import { createClient } from "@/lib/supabase/server";
import { FileCheck } from "lucide-react";
import { describeDataError } from "@/lib/errors/data-error";

export default async function AdminRegistrationPage() {
  const session = await requireRole("department_admin");
  const service = new CoreReadService((await createClient()) as any);
  let registrations: any[] = [];
  let errorMessage: string | null = null;

  async function setStatus(formData: FormData) {
    "use server";
    await approveRegistrationAction({
      registrationId: formData.get("registrationId"),
      status: formData.get("status"),
    });
  }

  try {
    registrations = await service.getAdminRegistrations(session.universityId!);
  } catch (error) {
    errorMessage = describeDataError(error, "Could not load registrations.");
  }

  if (errorMessage) return <ErrorState message={errorMessage} />;

  return (
    <GenericList title="Registration" description="Review course registrations and approve enrollments." icon={FileCheck}>
      {registrations.length === 0 ? <EmptyState title="No registrations" description="Student submissions will appear here." /> : (
        <DataTable
          data={registrations}
          keyExtractor={(item: any) => item.id}
          columns={[
            { key: "student", header: "Student", cell: (item: any) => {
              const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
              return <span className="font-medium text-ink">{[profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || profile?.email || "Student"}</span>;
            }},
            { key: "semester", header: "Semester", cell: (item: any) => (Array.isArray(item.semesters) ? item.semesters[0]?.name : item.semesters?.name) || "Semester" },
            { key: "courses", header: "Courses", cell: (item: any) => (item.course_registration_items || []).length },
            { key: "status", header: "Status", cell: (item: any) => item.status },
            { key: "actions", header: "Actions", cell: (item: any) => (
              <div className="flex items-center gap-2">
                <form action={setStatus}>
                  <input type="hidden" name="registrationId" value={item.id} />
                  <input type="hidden" name="status" value="approved" />
                  <button className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-success border border-emerald-500/20 text-xs font-medium hover:bg-emerald-500/20">Approve</button>
                </form>
                <form action={setStatus}>
                  <input type="hidden" name="registrationId" value={item.id} />
                  <input type="hidden" name="status" value="rejected" />
                  <button className="px-3 py-1.5 rounded-lg bg-red-500/10 text-danger border border-red-500/20 text-xs font-medium hover:bg-red-500/20">Reject</button>
                </form>
              </div>
            )},
          ]}
        />
      )}
    </GenericList>
  );
}
