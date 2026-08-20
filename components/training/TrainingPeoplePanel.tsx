"use client";

import * as React from "react";
import { Award, Loader2, ShieldOff } from "lucide-react";
import { issueCertificateAction, revokeCertificateAction } from "@/app/actions/certificates";
import { cancelTrainingAssignmentAction } from "@/app/actions/training";

export type PersonRow = {
  studentId: string;
  name: string;
  cohortId: string;
  assignmentId: string | null;
  dueOn: string | null;
  status: string;
  lessonsDone: number;
  lessonsTotal: number;
  score: number | null;
  passMark: number | null;
  certificateId: string | null;
  certificateSerial: string | null;
  certificateRevoked: boolean;
};

const TONE: Record<string, string> = {
  overdue: "bg-warning/10 text-warning",
  due_soon: "bg-primary/10 text-primary",
  completed: "bg-success/10 text-success",
  cancelled: "bg-surface-muted text-ink-muted",
  assigned: "bg-surface-muted text-ink-muted",
};

const WORDING: Record<string, string> = {
  overdue: "Overdue",
  due_soon: "Due soon",
  completed: "Finished",
  cancelled: "Withdrawn",
  assigned: "Not started",
};

/** Why this person cannot be certified yet, in words a trainer can act on. */
function blockedReason(person: PersonRow): string | null {
  if (person.lessonsTotal === 0) return "No material yet";
  if (person.lessonsDone < person.lessonsTotal) {
    const left = person.lessonsTotal - person.lessonsDone;
    return `${left} step${left === 1 ? "" : "s"} left`;
  }
  if (person.passMark !== null && (person.score ?? -1) < person.passMark) {
    return person.score === null ? "No score yet" : `Scored ${person.score}%, needs ${person.passMark}%`;
  }
  return null;
}

export function TrainingPeoplePanel({ people }: { people: PersonRow[] }) {
  const [rows, setRows] = React.useState(people);
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  function run(action: () => Promise<any>, onDone: (result: any) => void, success: string) {
    setError("");
    setMessage("");
    startTransition(async () => {
      const result = await action();
      if (!result.success) {
        setError(result.error || "That did not work.");
        return;
      }
      onDone(result);
      setMessage(success);
    });
  }

  const patch = (studentId: string, changes: Partial<PersonRow>) =>
    setRows((current) => current.map((row) => (row.studentId === studentId ? { ...row, ...changes } : row)));

  return (
    <section className="grid gap-4 rounded-[24px] border border-line bg-surface p-6">
      <h2 className="font-outfit text-lg font-semibold text-ink">Who is doing it</h2>

      {(message || error) && (
        <p
          className={
            error
              ? "rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
              : "rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success"
          }
        >
          {error || message}
        </p>
      )}

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-4 text-sm text-ink-muted">
          Nobody has been given this training yet.
        </p>
      ) : (
        <ul className="grid gap-2">
          {rows.map((person) => {
            const reason = blockedReason(person);
            const certified = Boolean(person.certificateSerial) && !person.certificateRevoked;

            return (
              <li
                key={person.studentId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface-muted p-4"
              >
                <div>
                  <p className="text-sm font-medium text-ink">{person.name}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {person.lessonsDone} of {person.lessonsTotal} steps
                    {person.score !== null ? ` · ${person.score}%` : ""}
                    {person.dueOn ? ` · due ${new Date(person.dueOn).toLocaleDateString()}` : ""}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${TONE[person.status] || TONE.assigned}`}
                  >
                    {WORDING[person.status] || person.status}
                  </span>

                  {certified ? (
                    <>
                      <span className="font-mono text-xs text-ink-muted">{person.certificateSerial}</span>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => {
                          const why = window.prompt("Why is this certificate being withdrawn?");
                          if (!why) return;
                          run(
                            () => revokeCertificateAction({ certificateId: person.certificateId!, reason: why }),
                            () => patch(person.studentId, { certificateRevoked: true }),
                            "Certificate withdrawn.",
                          );
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-3 py-1.5 text-xs font-semibold text-ink-muted hover:text-danger disabled:opacity-60"
                      >
                        <ShieldOff size={13} /> Withdraw
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      disabled={pending || Boolean(reason)}
                      title={reason || "Issue their certificate"}
                      onClick={() =>
                        run(
                          () =>
                            issueCertificateAction({
                              courseSectionId: person.cohortId,
                              studentId: person.studentId,
                            }),
                          (result) =>
                            patch(person.studentId, {
                              status: "completed",
                              certificateId: result.certificate.id,
                              certificateSerial: result.certificate.serial,
                              certificateRevoked: false,
                            }),
                          "Certificate issued.",
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-contrast hover:bg-primary-hover disabled:opacity-40"
                    >
                      <Award size={13} /> {reason || "Certify"}
                    </button>
                  )}

                  {person.assignmentId && person.status !== "completed" && person.status !== "cancelled" ? (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        run(
                          () => cancelTrainingAssignmentAction({ assignmentId: person.assignmentId! }),
                          () => patch(person.studentId, { status: "cancelled" }),
                          "Assignment withdrawn.",
                        )
                      }
                      className="rounded-lg bg-surface px-3 py-1.5 text-xs font-semibold text-ink-muted hover:text-ink disabled:opacity-60"
                    >
                      Withdraw
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {pending ? (
        <p className="inline-flex items-center gap-2 text-xs text-ink-muted">
          <Loader2 size={13} className="animate-spin" /> Working…
        </p>
      ) : null}
    </section>
  );
}
