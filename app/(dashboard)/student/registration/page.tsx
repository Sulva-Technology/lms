import { StudentRegistrationClient } from "@/components/registration/StudentRegistrationClient";
import { ErrorState } from "@/components/ui/error-state";
import { requireRole } from "@/lib/auth/guards";
import { CoreReadService } from "@/lib/services/core-read.service";
import { createClient } from "@/lib/supabase/server";
import { describeDataError } from "@/lib/errors/data-error";

export default async function RegistrationPage() {
  const session = await requireRole("student");
  const service = new CoreReadService((await createClient()) as any);
  let data: Awaited<ReturnType<CoreReadService["getStudentRegistration"]>> | null = null;
  let errorMessage: string | null = null;

  try {
    data = await service.getStudentRegistration(session.user.id, session.universityId!);
  } catch (error) {
    errorMessage = describeDataError(error, "Could not load registration.");
  }

  if (errorMessage || !data) return <ErrorState message={errorMessage || "Could not load registration."} />;

  const existingCourseIds = (data.registration?.course_registration_items || []).map((item: any) => item.course_section_id);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="font-outfit text-4xl font-semibold text-ink tracking-tight">Course Registration</h1>
        <p className="text-ink-muted mt-2">Select courses for the active registration window and submit them for approval.</p>
      </div>

      <StudentRegistrationClient
        semesterId={data.window?.semester_id || data.registration?.semester_id}
        minCredits={data.window?.min_credits || 0}
        maxCredits={data.window?.max_credits || 24}
        existingStatus={data.registration?.status}
        existingCourseIds={existingCourseIds}
        courses={data.courses}
      />
    </div>
  );
}
