import Link from "next/link";
import { GenericList } from "@/components/academic/GenericList";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/guards";
import { readOr } from "@/lib/safe-read";
import { createClient } from "@/lib/supabase/server";
import { deriveStatus } from "@/lib/services/training-assignment.service";
import { GraduationCap, Plus } from "lucide-react";

export default async function TrainingsPage() {
  const session = await requireRole("lecturer");
  const supabase = await createClient();
  const universityId = session.universityId!;

  // A training is a course; its cohorts carry the people and the deadlines.
  const rows = await readOr(
    supabase
      .from("courses")
      .select(
        "id,title,description,status,pass_mark,valid_for_months,created_at,course_sections(id,name,starts_on,training_assignments(id,due_on,completed_at,cancelled_at))",
      )
      .eq("university_id", universityId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .then(({ data }: { data: any[] | null }) => data || []) as Promise<any[]>,
    [] as any[],
  );

  const trainings = rows.map((row: any) => {
    const sections = row.course_sections || [];
    const assignments = sections.flatMap((section: any) => section.training_assignments || []);
    const live = assignments.filter((a: any) => !a.cancelled_at);
    const done = live.filter((a: any) => a.completed_at).length;
    const overdue = live.filter((a: any) => deriveStatus(a) === "overdue").length;

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      published: row.status === "published",
      repeats: row.valid_for_months,
      assigned: live.length,
      done,
      overdue,
    };
  });

  return (
    <GenericList title="Trainings" description="Everything your people are asked to complete." icon={GraduationCap}>
      <Link
        href="/admin/trainings/new"
        className="inline-flex w-fit items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-contrast hover:bg-primary-hover"
      >
        <Plus size={16} /> New training
      </Link>

      {trainings.length === 0 ? (
        <EmptyState
          title="No trainings yet"
          description="Create one and it will appear here with who has finished it."
        />
      ) : (
        <div className="grid gap-3">
          {trainings.map((training) => (
            <div key={training.id} className="rounded-[24px] border border-line bg-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-outfit text-lg font-semibold text-ink">{training.title}</p>
                  {training.description ? (
                    <p className="mt-1 max-w-2xl text-sm text-ink-muted">{training.description}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {training.published ? null : (
                    <span className="rounded-lg bg-surface-muted px-3 py-1.5 text-xs font-semibold text-ink-muted">
                      Draft
                    </span>
                  )}
                  {training.repeats ? (
                    <span className="rounded-lg bg-surface-muted px-3 py-1.5 text-xs font-semibold text-ink-muted">
                      Repeats every {training.repeats} months
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-6 text-sm">
                <span className="text-ink-muted">
                  <span className="font-outfit text-xl font-semibold text-ink">{training.assigned}</span> assigned
                </span>
                <span className="text-ink-muted">
                  <span className="font-outfit text-xl font-semibold text-ink">{training.done}</span> finished
                </span>
                {training.overdue > 0 ? (
                  <span className="text-ink-muted">
                    <span className="font-outfit text-xl font-semibold text-warning">{training.overdue}</span> overdue
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </GenericList>
  );
}
