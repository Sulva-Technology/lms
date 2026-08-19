import { AcademicCrudManager } from "@/components/admin/AcademicCrudManager";
import { CourseSectionManager } from "@/components/admin/CourseSectionManager";
import { GenericList } from "@/components/academic/GenericList";
import { ErrorState } from "@/components/ui/error-state";
import { requireRole } from "@/lib/auth/guards";
import { readOr } from "@/lib/safe-read";
import { CoreReadService } from "@/lib/services/core-read.service";
import { createClient } from "@/lib/supabase/server";
import { BookMarked } from "lucide-react";
import { describeDataError } from "@/lib/errors/data-error";

export default async function CoursesPage() {
  const session = await requireRole("department_admin");
  const service = new CoreReadService((await createClient()) as any);
  let data: any[] = [];
  let departments: any[] = [];
  let sections: any[] = [];
  let semesters: any[] = [];
  let lecturers: any[] = [];
  let errorMessage: string | null = null;

  try {
    data = await service.getAcademicList(session.universityId!, "courses", true);
  } catch (error) {
    errorMessage = describeDataError(error, "Could not load courses.");
  }

  if (errorMessage) return <ErrorState message={errorMessage} />;

  [departments, sections, semesters, lecturers] = await Promise.all([
    readOr(service.getAcademicList(session.universityId!, "departments"), []),
    readOr(service.getAdminCourseSections(session.universityId!), []),
    readOr(service.getAdminSemesters(session.universityId!), []),
    readOr(service.getAdminUsers(session.universityId!, "lecturer"), []),
  ]);

  return (
    <GenericList title="Courses" description="Manage course catalog records." icon={BookMarked}>
      <AcademicCrudManager type="courses" rows={data} departments={departments} />
      <CourseSectionManager courses={data.filter((course) => !course.deleted_at)} semesters={semesters} lecturers={lecturers} sections={sections} />
    </GenericList>
  );
}
