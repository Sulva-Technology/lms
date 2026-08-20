import Link from "next/link";
import { GenericList } from "@/components/academic/GenericList";
import { TrainingMaterialEditor, type MaterialRow } from "@/components/training/TrainingMaterialEditor";
import { TrainingPeoplePanel, type PersonRow } from "@/components/training/TrainingPeoplePanel";
import { requireRole } from "@/lib/auth/guards";
import { readOr } from "@/lib/safe-read";
import { createClient } from "@/lib/supabase/server";
import { deriveStatus } from "@/lib/services/training-assignment.service";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { notFound } from "next/navigation";

const one = (value: any) => (Array.isArray(value) ? value[0] : value);

export default async function TrainingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireRole("lecturer");
  const supabase = await createClient();
  const universityId = session.universityId!;

  const { data: training } = await supabase
    .from("courses")
    .select("id,title,description,status,pass_mark,valid_for_months,course_modules(id,lessons(id,title,content,resource_type,order_index,is_published)),course_sections(id,name,starts_on,ends_on)")
    .eq("id", id)
    .eq("university_id", universityId)
    .maybeSingle();

  if (!training) notFound();

  const lessons = (training.course_modules || [])
    .flatMap((module: any) => module.lessons || [])
    .filter((lesson: any) => lesson.is_published)
    .sort((a: any, b: any) => a.order_index - b.order_index);

  const material: MaterialRow[] = lessons.map((lesson: any) => ({
    id: lesson.id,
    title: lesson.title,
    body: lesson.content,
    kind: lesson.resource_type === "video" ? "video" : "written",
  }));

  const cohort = one(training.course_sections);
  const cohortIds = (training.course_sections || []).map((section: any) => section.id);

  const assignments = await readOr(
    supabase
      .from("training_assignments")
      .select("id,student_id,course_section_id,due_on,completed_at,cancelled_at,profiles(first_name,last_name,email)")
      .in("course_section_id", cohortIds.length > 0 ? cohortIds : ["00000000-0000-0000-0000-000000000000"])
      .then(({ data }: { data: any[] | null }) => data || []) as Promise<any[]>,
    [] as any[],
  );

  const lessonIds = lessons.map((lesson: any) => lesson.id);
  const progress = await readOr(
    supabase
      .from("lesson_progress")
      .select("student_id,lesson_id,is_completed")
      .in("lesson_id", lessonIds.length > 0 ? lessonIds : ["00000000-0000-0000-0000-000000000000"])
      .then(({ data }: { data: any[] | null }) => data || []) as Promise<any[]>,
    [] as any[],
  );

  const scores = await readOr(
    supabase
      .from("student_course_grades")
      .select("student_id,total_weighted_score")
      .in("course_section_id", cohortIds.length > 0 ? cohortIds : ["00000000-0000-0000-0000-000000000000"])
      .then(({ data }: { data: any[] | null }) => data || []) as Promise<any[]>,
    [] as any[],
  );

  const certificates = await readOr(
    supabase
      .from("certificates")
      .select("id,serial,student_id,revoked_at")
      .eq("course_id", id)
      .then(({ data }: { data: any[] | null }) => data || []) as Promise<any[]>,
    [] as any[],
  );

  const doneByStudent = new Map<string, number>();
  for (const row of progress) {
    if (!row.is_completed) continue;
    doneByStudent.set(row.student_id, (doneByStudent.get(row.student_id) || 0) + 1);
  }

  const people: PersonRow[] = assignments.map((row: any) => {
    const profile = one(row.profiles);
    const certificate = certificates.find((c: any) => c.student_id === row.student_id);
    const score = scores.find((s: any) => s.student_id === row.student_id)?.total_weighted_score;

    return {
      studentId: row.student_id,
      name: [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || profile?.email || "Learner",
      cohortId: row.course_section_id,
      assignmentId: row.id,
      dueOn: row.due_on,
      status: deriveStatus(row),
      lessonsDone: doneByStudent.get(row.student_id) || 0,
      lessonsTotal: lessons.length,
      score: score === undefined || score === null ? null : Math.round(Number(score) * 100) / 100,
      passMark: training.pass_mark ?? null,
      certificateId: certificate?.id ?? null,
      certificateSerial: certificate?.serial ?? null,
      certificateRevoked: Boolean(certificate?.revoked_at),
    };
  });

  return (
    <GenericList title={training.title} description={training.description || "Training"} icon={GraduationCap}>
      <Link href="/admin/trainings" className="inline-flex w-fit items-center gap-2 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft size={15} /> All trainings
      </Link>

      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded-lg bg-surface-muted px-3 py-1.5 font-semibold text-ink-muted">
          {training.status === "published" ? "Available" : "Draft"}
        </span>
        {training.valid_for_months ? (
          <span className="rounded-lg bg-surface-muted px-3 py-1.5 font-semibold text-ink-muted">
            Repeats every {training.valid_for_months} months
          </span>
        ) : null}
        {training.pass_mark !== null ? (
          <span className="rounded-lg bg-surface-muted px-3 py-1.5 font-semibold text-ink-muted">
            Pass mark {training.pass_mark}%
          </span>
        ) : null}
        {cohort?.starts_on ? (
          <span className="rounded-lg bg-surface-muted px-3 py-1.5 font-semibold text-ink-muted">
            From {new Date(cohort.starts_on).toLocaleDateString()}
          </span>
        ) : null}
      </div>

      <TrainingMaterialEditor trainingId={training.id} material={material} />
      <TrainingPeoplePanel people={people} />
    </GenericList>
  );
}
