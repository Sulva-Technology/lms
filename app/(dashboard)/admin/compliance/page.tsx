import { GenericList } from "@/components/academic/GenericList";
import { AssignTrainingPanel } from "@/components/training/AssignTrainingPanel";
import { ComplianceTable } from "@/components/training/ComplianceTable";
import { requireRole } from "@/lib/auth/guards";
import { readOr } from "@/lib/safe-read";
import { ComplianceService } from "@/lib/services/compliance.service";
import { createClient } from "@/lib/supabase/server";
import { ShieldCheck } from "lucide-react";

export default async function AdminCompliancePage() {
  const session = await requireRole("department_admin");
  const supabase = await createClient();
  const universityId = session.profile.university_id!;

  const overview = await readOr(new ComplianceService(supabase as any).getOverview(universityId), {
    totals: { active: 0, overdue: 0, dueSoon: 0, completed: 0, expiring: 0, compliantPercent: 100 },
    overdue: [],
    dueSoon: [],
    expiring: [],
  });

  const cohortRows = await readOr(
    supabase
      .from("course_sections")
      .select("id,name,courses(code,title)")
      .eq("university_id", universityId)
      .is("deleted_at", null)
      .then(({ data }: { data: any[] | null }) => data || []) as Promise<any[]>,
    [] as any[],
  );

  const cohorts = cohortRows.map((row: any) => {
    const course = Array.isArray(row.courses) ? row.courses[0] : row.courses;
    return { id: row.id, label: course?.title ? `${course.title} — ${row.name}` : row.name };
  });

  const learnerRows = await readOr(
    supabase
      .from("profiles")
      .select("id,first_name,last_name,email")
      .eq("university_id", universityId)
      .eq("role", "student")
      .order("first_name", { ascending: true })
      .then(({ data }: { data: any[] | null }) => data || []) as Promise<any[]>,
    [] as any[],
  );

  const learners = learnerRows.map((row: any) => ({
    id: row.id,
    label: [row.first_name, row.last_name].filter(Boolean).join(" ") || row.email || "Learner",
  }));

  const teamRows = await readOr(
    supabase
      .from("departments")
      .select("id,name")
      .eq("university_id", universityId)
      .then(({ data }: { data: any[] | null }) => data || []) as Promise<any[]>,
    [] as any[],
  );

  const teams = teamRows.map((row: any) => ({ id: row.id, label: row.name }));

  return (
    <GenericList
      title="Compliance"
      description="Who still owes required training, and whose certificate is about to lapse."
      icon={ShieldCheck}
    >
      <div className="grid gap-6">
        <ComplianceTable overview={overview} />
        <AssignTrainingPanel cohorts={cohorts} learners={learners} teams={teams} />
      </div>
    </GenericList>
  );
}
