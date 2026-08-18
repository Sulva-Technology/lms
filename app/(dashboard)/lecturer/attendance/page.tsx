import { AttendanceManager, type AttendanceSession } from "@/components/lecturer/AttendanceManager";
import { GenericList } from "@/components/academic/GenericList";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/guards";
import { readOr } from "@/lib/safe-read";
import { AttendanceService } from "@/lib/services/attendance.service";
import { LecturerReadService } from "@/lib/services/completion-read.service";
import { createClient } from "@/lib/supabase/server";
import { UserCheck } from "lucide-react";

export default async function LecturerAttendancePage() {
  const session = await requireRole("lecturer");
  const supabase = await createClient();
  const service = new LecturerReadService(supabase as any);

  const sectionIds = await readOr(service.getSectionIds(session.user.id), [] as string[]);
  const sessions = (await readOr(service.getAttendance(sectionIds), [] as any[])) as AttendanceSession[];

  const sectionRows = await readOr(
    supabase
      .from("course_sections")
      .select("id,name,courses(code,title)")
      .in("id", sectionIds)
      .then(({ data }: { data: any[] | null }) => data || []) as Promise<any[]>,
    [] as any[],
  );

  const sections = sectionRows.map((row: any) => {
    const course = Array.isArray(row.courses) ? row.courses[0] : row.courses;
    return { id: row.id, label: course?.code ? `${course.code} — ${row.name}` : row.name };
  });

  const enrollments = await readOr(
    supabase
      .from("course_enrollments")
      .select("course_section_id,student_id,profiles(first_name,last_name,email)")
      .in("course_section_id", sectionIds)
      .eq("status", "active")
      .then(({ data }: { data: any[] | null }) => data || []) as Promise<any[]>,
    [] as any[],
  );

  const roster: Record<string, Array<{ id: string; name: string }>> = {};
  for (const enrollment of enrollments) {
    const profile = Array.isArray(enrollment.profiles) ? enrollment.profiles[0] : enrollment.profiles;
    const name =
      [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || profile?.email || "Student";
    roster[enrollment.course_section_id] = roster[enrollment.course_section_id] || [];
    roster[enrollment.course_section_id].push({ id: enrollment.student_id, name });
  }

  const attendanceRates = await readOr(
    new AttendanceService(supabase as any).getAttendanceRates(sectionIds),
    [] as any[],
  );

  const liveClasses = await readOr(
    supabase
      .from("live_classes")
      .select("id,topic,title,course_section_id")
      .in("course_section_id", sectionIds)
      .order("start_time", { ascending: false })
      .limit(10)
      .then(({ data }: { data: any[] | null }) => data || []) as Promise<any[]>,
    [] as any[],
  );

  return (
    <GenericList
      title="Attendance"
      description="Take roll calls for assigned sections, or derive attendance from live class participation."
      icon={UserCheck}
    >
      {sections.length === 0 ? (
        <EmptyState
          title="No assigned sections"
          description="Ask an admin to assign course sections to your profile before taking attendance."
        />
      ) : (
        <AttendanceManager
          sections={sections}
          sessions={sessions}
          roster={roster}
          rates={attendanceRates}
          liveClasses={liveClasses.map((liveClass: any) => ({
            id: liveClass.id,
            topic: liveClass.topic || liveClass.title || "Live class",
            course_section_id: liveClass.course_section_id,
          }))}
        />
      )}
    </GenericList>
  );
}
