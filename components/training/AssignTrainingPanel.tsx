"use client";

import * as React from "react";
import { CalendarClock, Loader2, UserPlus, Users } from "lucide-react";
import { assignTeamTrainingAction, assignTrainingAction } from "@/app/actions/training";

type Option = { id: string; label: string };

const inputClass =
  "rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-400";
const labelClass = "grid gap-2 text-sm font-medium text-slate-300";

export function AssignTrainingPanel({
  cohorts,
  learners,
  teams,
}: {
  cohorts: Option[];
  learners: Option[];
  teams: Option[];
}) {
  const [target, setTarget] = React.useState<"person" | "team">("person");
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  function submit(formData: FormData) {
    const courseSectionId = String(formData.get("courseSectionId") || "");
    const dueOn = String(formData.get("dueOn") || "") || undefined;

    setError("");
    setMessage("");

    startTransition(async () => {
      const result =
        target === "person"
          ? await assignTrainingAction({
              courseSectionId,
              studentId: String(formData.get("studentId") || ""),
              dueOn,
            })
          : await assignTeamTrainingAction({
              courseSectionId,
              departmentId: String(formData.get("departmentId") || ""),
              dueOn,
            });

      if (!result.success) {
        setError(result.error || "Could not assign this training.");
        return;
      }

      const count = "assignments" in result ? result.assignments?.length ?? 0 : 1;
      setMessage(count === 1 ? "Training assigned." : `Training assigned to ${count} people.`);
    });
  }

  return (
    <form action={submit} className="glass-panel grid gap-4 rounded-[24px] border border-white/10 p-5">
      <div>
        <h2 className="font-outfit text-lg font-semibold text-white">Assign training</h2>
        <p className="mt-1 text-sm text-slate-400">
          Assigning enrols the person as well, so the training opens the moment they sign in.
        </p>
      </div>

      <label className={labelClass}>
        Cohort
        <select name="courseSectionId" required className={inputClass}>
          {cohorts.map((cohort) => (
            <option key={cohort.id} value={cohort.id}>
              {cohort.label}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-wrap gap-2">
        {(["person", "team"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setTarget(option)}
            className={
              target === option
                ? "inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white"
                : "inline-flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10"
            }
          >
            {option === "person" ? <UserPlus size={14} /> : <Users size={14} />}
            {option === "person" ? "One person" : "A whole team"}
          </button>
        ))}
      </div>

      {target === "person" ? (
        <label className={labelClass}>
          Person
          <select name="studentId" required className={inputClass}>
            {learners.map((learner) => (
              <option key={learner.id} value={learner.id}>
                {learner.label}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <label className={labelClass}>
          Team
          <select name="departmentId" required className={inputClass}>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.label}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className={labelClass}>
        Due by
        <input name="dueOn" type="date" className={inputClass} />
        <span className="text-xs font-normal text-slate-500">
          Leave empty for training with no deadline. It will not appear in the overdue list.
        </span>
      </label>

      {(message || error) && (
        <p
          className={
            error
              ? "rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
              : "rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
          }
        >
          {error || message}
        </p>
      )}

      <button
        disabled={pending || cohorts.length === 0}
        className="inline-flex w-fit items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
      >
        {pending ? <Loader2 size={16} className="animate-spin" /> : <CalendarClock size={16} />}
        Assign training
      </button>
    </form>
  );
}
