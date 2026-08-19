"use client";

import * as React from "react";
import { Loader2, XCircle } from "lucide-react";
import { cancelTrainingAssignmentAction } from "@/app/actions/training";

/**
 * Withdraws an assignment that should not have been made. The row stays in the
 * table as evidence; it simply stops counting against anyone.
 */
export function CancelAssignmentButton({ assignmentId }: { assignmentId: string }) {
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  if (done) return <span className="text-xs text-slate-500">Withdrawn</span>;

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError("");
            const result = await cancelTrainingAssignmentAction({ assignmentId });
            if (!result.success) {
              setError(result.error || "Could not withdraw this assignment.");
              return;
            }
            setDone(true);
          })
        }
        className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10 disabled:opacity-60"
      >
        {pending ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
        Withdraw
      </button>
      {error ? <span className="text-xs text-red-300">{error}</span> : null}
    </span>
  );
}
