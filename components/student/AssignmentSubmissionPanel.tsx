"use client";

import * as React from "react";
import { motion } from "motion/react";
import { AlertTriangle, CheckCircle2, Clock, Loader2, Send } from "lucide-react";
import { submitAssignmentAction } from "@/app/actions/submissions";
import { FileUploader, type UploadedFile } from "@/components/ui/file-uploader";
import { FileList } from "@/components/ui/file-list";
import { STORAGE_BUCKETS } from "@/lib/storage/paths";

type Assignment = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  totalPoints: number;
  allowLateSubmissions: boolean;
  maxResubmissions: number;
  courseCode: string;
};

type Submission = {
  id: string;
  content: string | null;
  file_metadata: UploadedFile[] | null;
  status: string;
  score: number | null;
  feedback: string | null;
  is_late: boolean;
  attempt_count: number;
  submitted_at: string | null;
};

export function AssignmentSubmissionPanel({
  assignment,
  submission,
  isPastDue,
}: {
  assignment: Assignment;
  submission: Submission | null;
  /** Evaluated on the server so render stays pure and hydration stays stable. */
  isPastDue: boolean;
}) {
  const [current, setCurrent] = React.useState<Submission | null>(submission);
  const [content, setContent] = React.useState(submission?.content || "");
  const [files, setFiles] = React.useState<UploadedFile[]>(submission?.file_metadata || []);
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  const due = new Date(assignment.dueDate);
  const isGraded = current?.status === "graded" || current?.score != null;
  const attemptsUsed = current?.attempt_count || 0;
  const attemptsLeft = assignment.maxResubmissions - attemptsUsed;
  const locked = isGraded || attemptsLeft <= 0 || (isPastDue && !assignment.allowLateSubmissions);

  function submit() {
    setError("");
    setMessage("");
    startTransition(async () => {
      const result = await submitAssignmentAction(assignment.id, { content, files });
      if (!result.success) {
        setError(result.error || "Submission failed.");
        return;
      }
      setCurrent(result.submission as Submission);
      setMessage("Submission received.");
    });
  }

  const lockReason = isGraded
    ? "This submission has been graded and can no longer be changed."
    : attemptsLeft <= 0
      ? "You have used all available attempts."
      : "The deadline has passed and late submissions are not allowed.";

  const statusLabel = isGraded ? "Graded" : current ? "Submitted" : isPastDue ? "Overdue" : "Not submitted";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid gap-6 xl:grid-cols-[1fr_320px]"
    >
      <section className="space-y-6">
        <div className="rounded-[24px] border border-line bg-surface p-6 backdrop-blur-2xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">{assignment.courseCode}</p>
          <h2 className="mt-2 font-outfit text-2xl font-bold text-ink">{assignment.title}</h2>
          {assignment.description && (
            <p className="mt-3 whitespace-pre-wrap leading-7 text-ink-muted">{assignment.description}</p>
          )}
        </div>

        <div className="rounded-[24px] border border-line bg-surface p-6 backdrop-blur-2xl">
          <h3 className="font-outfit text-lg font-semibold text-ink">Your submission</h3>

          {locked ? (
            <div className="mt-4 grid gap-4">
              <p className="text-sm text-ink-muted">{lockReason}</p>
              {current?.content && (
                <p className="whitespace-pre-wrap rounded-xl border border-line bg-status-soft p-4 text-sm text-ink">
                  {current.content}
                </p>
              )}
              <FileList bucket={STORAGE_BUCKETS.ASSIGNMENT_SUBMISSIONS} files={current?.file_metadata || []} />
            </div>
          ) : (
            <div className="mt-4 grid gap-4">
              <label className="grid gap-2 text-sm font-medium text-ink-muted">
                Written answer
                <textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  rows={8}
                  className="rounded-xl border border-line bg-surface p-4 text-sm text-ink outline-none transition focus:border-primary"
                  placeholder="Type your answer, or attach files below."
                />
              </label>

              <div className="grid gap-2 text-sm font-medium text-ink-muted">
                Attachments
                <FileUploader
                  bucket={STORAGE_BUCKETS.ASSIGNMENT_SUBMISSIONS}
                  scope="submissions"
                  multiple
                  maxSizeMb={50}
                  value={files}
                  onChange={setFiles}
                  disabled={pending}
                />
              </div>

              {(error || message) && (
                <div
                  className={
                    error
                      ? "rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-danger"
                      : "rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-success"
                  }
                >
                  {error || message}
                </div>
              )}

              {isPastDue && assignment.allowLateSubmissions && (
                <p className="flex items-center gap-2 text-sm text-warn">
                  <AlertTriangle size={15} /> The deadline has passed. This will be marked as a late submission.
                </p>
              )}

              <button
                onClick={submit}
                disabled={pending || (!content.trim() && files.length === 0)}
                className="inline-flex w-fit items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-contrast transition hover:bg-primary-hover disabled:opacity-60"
              >
                {pending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {current ? "Resubmit" : "Submit assignment"}
              </button>
            </div>
          )}
        </div>
      </section>

      <aside className="space-y-4">
        <div className="rounded-[24px] border border-line bg-surface p-6 backdrop-blur-2xl">
          <h3 className="font-outfit text-sm font-semibold uppercase tracking-wide text-ink-muted">Status</h3>
          <div className="mt-4 grid gap-4 text-sm">
            <div className="flex items-center gap-2 text-ink">
              {isGraded ? (
                <CheckCircle2 size={16} className="text-success" />
              ) : current ? (
                <CheckCircle2 size={16} className="text-primary" />
              ) : isPastDue ? (
                <AlertTriangle size={16} className="text-warn" />
              ) : (
                <Clock size={16} className="text-ink-muted" />
              )}
              {statusLabel}
            </div>
            <div>
              <p className="text-xs text-ink-subtle">Due</p>
              <p className="text-ink">{due.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-ink-subtle">Points</p>
              <p className="text-ink">
                {current?.score != null
                  ? `${current.score} / ${assignment.totalPoints}`
                  : `${assignment.totalPoints} available`}
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-subtle">Attempts</p>
              <p className="text-ink">
                {attemptsUsed} of {assignment.maxResubmissions} used
              </p>
            </div>
            {current?.is_late && <p className="text-xs font-medium text-warn">Submitted late</p>}
          </div>
        </div>

        {current?.feedback && (
          <div className="rounded-[24px] border border-line bg-surface p-6 backdrop-blur-2xl">
            <h3 className="font-outfit text-sm font-semibold uppercase tracking-wide text-ink-muted">
              Lecturer feedback
            </h3>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-ink">{current.feedback}</p>
          </div>
        )}
      </aside>
    </motion.div>
  );
}
