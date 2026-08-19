import { AcademicCrudManager } from "@/components/admin/AcademicCrudManager";
import { GenericList } from "@/components/academic/GenericList";
import { ErrorState } from "@/components/ui/error-state";
import { requireRole } from "@/lib/auth/guards";
import { CoreReadService } from "@/lib/services/core-read.service";
import { createClient } from "@/lib/supabase/server";
import { BookOpen } from "lucide-react";
import { describeDataError } from "@/lib/errors/data-error";

export default async function ProgramsPage() {
  const session = await requireRole("department_admin");
  const service = new CoreReadService((await createClient()) as any);
  let data: any[] = [];
  let departments: any[] = [];
  let errorMessage: string | null = null;

  try {
    data = await service.getAcademicList(session.universityId!, "programs", true);
    departments = await service.getAcademicList(session.universityId!, "departments");
  } catch (error) {
    errorMessage = describeDataError(error, "Could not load programs.");
  }

  if (errorMessage) return <ErrorState message={errorMessage} />;

  return (
    <GenericList title="Programs" description="Manage degree and certificate programs." icon={BookOpen}>
      <AcademicCrudManager type="programs" rows={data} departments={departments} />
    </GenericList>
  );
}
