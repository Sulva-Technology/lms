import { GenericList } from "@/components/academic/GenericList";
import { EmptyState } from "@/components/ui/empty-state";
import { CertificateManager } from "@/components/certificates/CertificateManager";
import { requireRole } from "@/lib/auth/guards";
import { readOr } from "@/lib/safe-read";
import { LecturerReadService } from "@/lib/services/completion-read.service";
import { createClient } from "@/lib/supabase/server";
import { Award } from "lucide-react";

export default async function LecturerCertificatesPage() {
  const session = await requireRole("lecturer");
  const supabase = await createClient();
  const sectionIds = await readOr(
    new LecturerReadService(supabase as any).getSectionIds(session.user.id),
    [] as string[],
  );

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

  const issued = await readOr(
    supabase
      .from("certificates")
      .select("id,serial,student_id,course_section_id,issued_at,revoked_at,snapshot")
      .in("course_section_id", sectionIds)
      .order("issued_at", { ascending: false })
      .then(({ data }: { data: any[] | null }) => data || []) as Promise<any[]>,
    [] as any[],
  );

  return (
    <GenericList
      title="Certificates"
      description="Issue completion certificates and withdraw ones issued in error."
      icon={Award}
    >
      {sections.length === 0 ? (
        <EmptyState
          title="No assigned sections"
          description="Certificates are issued per course section, so you need an assigned section first."
        />
      ) : (
        <CertificateManager sections={sections} issued={issued} />
      )}
    </GenericList>
  );
}
