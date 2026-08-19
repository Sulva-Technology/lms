import { AnnouncementManager } from "@/components/lecturer/AnnouncementManager";
import { GenericList } from "@/components/academic/GenericList";
import { ErrorState } from "@/components/ui/error-state";
import { requireRole } from "@/lib/auth/guards";
import { readOr } from "@/lib/safe-read";
import { CoreReadService } from "@/lib/services/core-read.service";
import { createClient } from "@/lib/supabase/server";
import { Bell } from "lucide-react";
import { describeDataError } from "@/lib/errors/data-error";

export default async function LecturerAnnouncementsPage() {
  const session = await requireRole("lecturer");
  const supabase = await createClient();
  const courses = await readOr(new CoreReadService(supabase as any).getLecturerCourses(session.user.id), []);
  let data: any[] = [];
  let errorMessage: string | null = null;

  try {
    const result = await supabase
      .from("announcements")
      .select("id, title, content, target_scope, course_section_id, is_published, created_at, course_sections ( courses ( code, title ) )")
      .eq("author_id", session.user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (result.error) throw result.error;
    data = result.data || [];
  } catch (error) {
    errorMessage = describeDataError(error, "Could not load announcements.");
  }

  if (errorMessage) return <ErrorState message={errorMessage} />;

  return (
    <GenericList title="Announcements" description="Review updates you have posted to students." icon={Bell}>
      <AnnouncementManager courses={courses} announcements={data} />
    </GenericList>
  );
}
