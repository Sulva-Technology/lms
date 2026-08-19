"use client";

import * as React from "react";
import { Loader2, Wand2 } from "lucide-react";
import { bootstrapAcademicStructureAction } from "@/app/actions/admin/structure";

/**
 * Shown only while a tenant is missing the chain every course depends on.
 * Organisations that do not think in faculties and terms still need one of
 * each, because the columns are NOT NULL.
 */
export function StructureBootstrapCard() {
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm text-success">
        Default structure created. You can create a course now.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5">
      <h2 className="font-outfit text-base font-semibold text-ink">Finish setting up</h2>
      <p className="mt-1 text-sm text-amber-100/80">
        Courses need a faculty, a department and a term before they can exist. Create one of each with
        sensible defaults, and rename them later if you like.
      </p>

      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}

      <button
        onClick={() =>
          startTransition(async () => {
            setError("");
            const result = await bootstrapAcademicStructureAction();
            if (!result.success) {
              setError(result.error || "Could not create the default structure.");
              return;
            }
            setDone(true);
          })
        }
        disabled={pending}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:opacity-60"
      >
        {pending ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
        Create default structure
      </button>
    </div>
  );
}
