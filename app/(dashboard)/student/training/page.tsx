import Link from "next/link";
import { GenericList } from "@/components/academic/GenericList";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/guards";
import { readOr } from "@/lib/safe-read";
import { TrainingAssignmentService, deriveStatus } from "@/lib/services/training-assignment.service";
import { createClient } from "@/lib/supabase/server";
import { CalendarClock } from "lucide-react";

const TONE: Record<string, string> = {
  overdue: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  due_soon: "border-blue-500/30 bg-blue-500/10 text-blue-200",
  completed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  cancelled: "border-white/10 bg-white/5 text-slate-400",
  assigned: "border-white/10 bg-white/5 text-slate-300",
};

const WORDING: Record<string, string> = {
  overdue: "Overdue",
  due_soon: "Due soon",
  completed: "Completed",
  cancelled: "Withdrawn",
  assigned: "Assigned",
};

export default async function StudentTrainingPage() {
  const session = await requireRole("student");
  const supabase = await createClient();

  const assignments = await readOr(
    new TrainingAssignmentService(supabase as any).listForStudent(session.user.id),
    [] as any[],
  );

  const live = assignments.filter((assignment: any) => !assignment.cancelled_at);

  return (
    <GenericList
      title="My Training"
      description="Training assigned to you, and when each piece is due."
      icon={CalendarClock}
    >
      {live.length === 0 ? (
        <EmptyState
          title="No training assigned"
          description="Anything your organisation requires of you will appear here with its deadline."
        />
      ) : (
        <div className="grid gap-3">
          {live.map((assignment: any) => {
            const status = deriveStatus(assignment);
            const section = Array.isArray(assignment.course_sections)
              ? assignment.course_sections[0]
              : assignment.course_sections;
            const course = Array.isArray(section?.courses) ? section.courses[0] : section?.courses;

            return (
              <div
                key={assignment.id}
                className="flex flex-col gap-3 rounded-[24px] border border-white/10 bg-slate-950/60 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-outfit text-lg font-semibold text-white">{course?.title || "Training"}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    {section?.name ? `${section.name} · ` : ""}
                    {assignment.due_on
                      ? `Due ${new Date(assignment.due_on).toLocaleDateString()}`
                      : "No deadline"}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${TONE[status]}`}>
                    {WORDING[status]}
                  </span>
                  {status === "completed" ? null : (
                    <Link
                      href={`/student/courses`}
                      className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                    >
                      Start
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </GenericList>
  );
}
