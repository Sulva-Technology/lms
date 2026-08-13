"use client";

import * as React from "react";
import { Loader2, Save } from "lucide-react";
import { gradeSubmissionAction } from "@/app/actions/grades";
import { DataTable } from "@/components/ui/data-table";
import { Drawer } from "@/components/ui/drawer";
import { FileList } from "@/components/ui/file-list";
import { STORAGE_BUCKETS } from "@/lib/storage/paths";
import type { UploadedFile } from "@/components/ui/file-uploader";

export type SubmissionRow = {
  id: string;
  student_id: string;
  student_name: string;
  content: string | null;
  file_metadata: UploadedFile[] | null;
  status: string;
  score: number | null;
  feedback: string | null;
  is_late: boolean;
  submitted_at: string | null;
};

export function SubmissionGradingPanel({
  assignment,
  submissions,
}: {
  assignment: { id: string; title: string; totalPoints: number };
  submissions: SubmissionRow[];
}) {
  const [rows, setRows] = React.useState(submissions);
  const [active, setActive] = React.useState<SubmissionRow | null>(null);
  const [score, setScore] = React.useState("");
  const [feedback, setFeedback] = React.useState("");
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  function open(row: SubmissionRow) {
    setActive(row);
    setScore(row.score != null ? String(row.score) : "");
    setFeedback(row.feedback || "");
    setError("");
    setMessage("");
  }

  function save() {
    if (!active) return;
    const numericScore = Number(score);

    if (score.trim() === "" || !Number.isFinite(numericScore) || numericScore < 0 || numericScore > assignment.totalPoints) {
      setError(`Score must be a number between 0 and ${assignment.totalPoints}.`);
      return;
    }

    setError("");
    const target = active;

    startTransition(async () => {
      const result = await gradeSubmissionAction(target.id, { score: numericScore, feedback });
      if (!result.success) {
        setError(result.error || "Could not save the grade.");
        return;
      }
      setRows((current) =>
        current.map((row) =>
          row.id === target.id ? { ...row, score: numericScore, feedback, status: "graded" } : row,
        ),
      );
      setMessage(`Saved grade for ${target.student_name}.`);
      setActive(null);
    });
  }

  const graded = rows.filter((row) => row.score != null).length;

  return (
    <div className="space-y-4">
      <div className="glass-panel flex items-center justify-between rounded-2xl border border-white/10 p-4">
        <div>
          <p className="text-sm font-semibold text-white">
            {graded} of {rows.length} graded
          </p>
          <p className="text-xs text-slate-400">Out of {assignment.totalPoints} points.</p>
        </div>
      </div>

      {message && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {message}
        </div>
      )}

      <DataTable
        data={rows}
        keyExtractor={(row) => row.id}
        columns={[
          {
            key: "student",
            header: "Student",
            cell: (row) => <span className="font-medium text-white">{row.student_name}</span>,
          },
          {
            key: "submitted",
            header: "Submitted",
            cell: (row) => (row.submitted_at ? new Date(row.submitted_at).toLocaleString() : "—"),
          },
          { key: "late", header: "Late", cell: (row) => (row.is_late ? "Yes" : "No") },
          {
            key: "score",
            header: "Score",
            cell: (row) => (row.score == null ? "Ungraded" : `${row.score}/${assignment.totalPoints}`),
          },
          {
            key: "actions",
            header: "",
            align: "right",
            cell: (row) => (
              <button
                onClick={() => open(row)}
                className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500"
              >
                {row.score == null ? "Grade" : "Edit grade"}
              </button>
            ),
          },
        ]}
      />

      <Drawer
        isOpen={Boolean(active)}
        onClose={() => setActive(null)}
        title={active ? `Grade — ${active.student_name}` : "Grade"}
        className="max-w-2xl"
      >
        {active && (
          <div className="grid gap-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Written answer</p>
              <p className="mt-2 whitespace-pre-wrap rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-200">
                {active.content || "No written answer."}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Attachments</p>
              <div className="mt-2">
                <FileList bucket={STORAGE_BUCKETS.ASSIGNMENT_SUBMISSIONS} files={active.file_metadata || []} />
              </div>
            </div>

            <label className="grid gap-2 text-sm font-medium text-slate-300">
              Score (max {assignment.totalPoints})
              <input
                type="number"
                min={0}
                max={assignment.totalPoints}
                value={score}
                onChange={(event) => setScore(event.target.value)}
                className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-blue-400"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-300">
              Feedback
              <textarea
                rows={6}
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-blue-400"
              />
            </label>

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              onClick={save}
              disabled={pending}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
            >
              {pending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save grade
            </button>
          </div>
        )}
      </Drawer>
    </div>
  );
}
