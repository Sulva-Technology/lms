import { LiveClassManager } from "@/components/lecturer/LiveClassManager";
import { requireRole } from "@/lib/auth/guards";
import { readOr } from "@/lib/safe-read";
import { CoreReadService } from "@/lib/services/core-read.service";
import { createClient } from "@/lib/supabase/server";

export default async function LecturerLiveClassesPage() {
  const session = await requireRole("lecturer");
  const service = new CoreReadService((await createClient()) as any);
  const courses = await readOr(service.getLecturerCourses(session.user.id), []);
  const sessions = await readOr(service.getLiveClasses(session.profile.university_id!, courses.map((course) => course.id)), []);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <LiveClassManager courses={courses} sessions={sessions} />
    </div>
  );
}
