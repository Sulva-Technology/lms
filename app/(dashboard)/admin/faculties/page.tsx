import { AcademicCrudManager } from "@/components/admin/AcademicCrudManager";
import { GenericList } from "@/components/academic/GenericList";
import { ErrorState } from "@/components/ui/error-state";
import { requireRole } from "@/lib/auth/guards";
import { CoreReadService } from "@/lib/services/core-read.service";
import { createClient } from "@/lib/supabase/server";
import { Building } from "lucide-react";
import { describeDataError } from "@/lib/errors/data-error";

export default async function FacultiesPage() {
  const session = await requireRole("department_admin");
  const service = new CoreReadService((await createClient()) as any);
  let data: any[] = [];
  let errorMessage: string | null = null;

  try {
    data = await service.getAcademicList(session.universityId!, "faculties", true);
  } catch (error) {
    errorMessage = describeDataError(error, "Could not load faculties.");
  }

  if (errorMessage) return <ErrorState message={errorMessage} />;

  return (
    <GenericList title="Faculties" description="Manage faculties and their codes." icon={Building}>
      <AcademicCrudManager type="faculties" rows={data} />
    </GenericList>
  );
}
