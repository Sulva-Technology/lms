import { AcademicCrudManager } from "@/components/admin/AcademicCrudManager";
import { GenericList } from "@/components/academic/GenericList";
import { ErrorState } from "@/components/ui/error-state";
import { requireRole } from "@/lib/auth/guards";
import { CoreReadService } from "@/lib/services/core-read.service";
import { createClient } from "@/lib/supabase/server";
import { Library } from "lucide-react";
import { describeDataError } from "@/lib/errors/data-error";

export default async function DepartmentsPage() {
  const session = await requireRole("department_admin");
  const service = new CoreReadService((await createClient()) as any);
  let data: any[] = [];
  let faculties: any[] = [];
  let errorMessage: string | null = null;

  try {
    data = await service.getAcademicList(session.universityId!, "departments", true);
    faculties = await service.getAcademicList(session.universityId!, "faculties");
  } catch (error) {
    errorMessage = describeDataError(error, "Could not load departments.");
  }

  if (errorMessage) return <ErrorState message={errorMessage} />;

  return (
    <GenericList title="Departments" description="Manage departments within faculties." icon={Library}>
      <AcademicCrudManager type="departments" rows={data} faculties={faculties} />
    </GenericList>
  );
}
