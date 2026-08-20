"use client";

import * as React from "react";
import { Check, FileText, Film, Loader2, Paperclip, Plus, Trash2, X } from "lucide-react";
import {
  addTrainingMaterialAction,
  editTrainingMaterialAction,
  removeTrainingMaterialAction,
} from "@/app/actions/trainings";

type Kind = "written" | "video" | "document";
export type MaterialRow = {
  id: string;
  title: string;
  body: string | null;
  kind: Kind;
};

const inputClass =
  "w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-ink outline-none focus:border-primary";

const ICON: Record<Kind, typeof FileText> = { written: FileText, video: Film, document: Paperclip };

export function TrainingMaterialEditor({
  trainingId,
  material,
}: {
  trainingId: string;
  material: MaterialRow[];
}) {
  const [rows, setRows] = React.useState(material);
  const [editing, setEditing] = React.useState<string | null>(null);
  const [adding, setAdding] = React.useState(false);
  const [error, setError] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  function add(formData: FormData) {
    setError("");
    startTransition(async () => {
      const result = await addTrainingMaterialAction({
        trainingId,
        title: String(formData.get("title") || ""),
        kind: String(formData.get("kind") || "written") as Kind,
        body: String(formData.get("body") || ""),
      });
      if (!("success" in result)) {
        setError(result.error || "Could not add that step.");
        return;
      }
      const lesson: any = result.lesson;
      setRows((current) => [
        ...current,
        {
          id: lesson.id,
          title: lesson.title,
          body: lesson.content,
          kind: lesson.resource_type === "video" ? "video" : "written",
        },
      ]);
      setAdding(false);
    });
  }

  function save(lessonId: string, formData: FormData) {
    setError("");
    const title = String(formData.get("title") || "");
    const body = String(formData.get("body") || "");
    startTransition(async () => {
      const result = await editTrainingMaterialAction({ lessonId, title, body });
      if (!("success" in result)) {
        setError(result.error || "Could not save that step.");
        return;
      }
      setRows((current) => current.map((row) => (row.id === lessonId ? { ...row, title, body } : row)));
      setEditing(null);
    });
  }

  function remove(lessonId: string) {
    setError("");
    startTransition(async () => {
      const result = await removeTrainingMaterialAction({ lessonId });
      if (!("success" in result)) {
        setError(result.error || "Could not remove that step.");
        return;
      }
      setRows((current) => current.filter((row) => row.id !== lessonId));
    });
  }

  return (
    <section className="grid gap-4 rounded-[24px] border border-line bg-surface p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-outfit text-lg font-semibold text-ink">What they work through</h2>
        <button
          type="button"
          onClick={() => setAdding((value) => !value)}
          className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2 text-sm font-semibold text-ink hover:bg-surface-muted"
        >
          <Plus size={15} /> Add a step
        </button>
      </div>

      {error ? (
        <p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>
      ) : null}

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-4 text-sm text-ink-muted">
          Nothing in this training yet. Add the first step and it becomes available to everyone assigned.
        </p>
      ) : (
        <ol className="grid gap-2">
          {rows.map((row, index) => {
            const Icon = ICON[row.kind] || FileText;
            return (
              <li key={row.id} className="rounded-2xl border border-line bg-surface-muted p-4">
                {editing === row.id ? (
                  <form action={(formData) => save(row.id, formData)} className="grid gap-2">
                    <input name="title" defaultValue={row.title} required className={inputClass} />
                    <textarea name="body" defaultValue={row.body || ""} rows={3} className={inputClass} />
                    <div className="flex gap-2">
                      <button
                        disabled={pending}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-contrast disabled:opacity-60"
                      >
                        {pending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditing(null)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-3 py-1.5 text-xs font-semibold text-ink-muted"
                      >
                        <X size={13} /> Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 text-xs font-semibold text-ink-muted">{index + 1}</span>
                      <Icon size={16} className="mt-0.5 text-ink-muted" aria-hidden />
                      <div>
                        <p className="text-sm font-medium text-ink">{row.title}</p>
                        {row.body ? (
                          <p className="mt-1 line-clamp-2 max-w-xl text-xs text-ink-muted">{row.body}</p>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditing(row.id)}
                        className="rounded-lg bg-surface px-3 py-1.5 text-xs font-semibold text-ink-muted hover:text-ink"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(row.id)}
                        disabled={pending}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-3 py-1.5 text-xs font-semibold text-ink-muted hover:text-danger disabled:opacity-60"
                      >
                        <Trash2 size={13} /> Remove
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}

      {adding ? (
        <form action={add} className="grid gap-2 rounded-2xl border border-line bg-surface-muted p-4">
          <input name="title" required placeholder="Name this step" className={inputClass} />
          <select name="kind" defaultValue="written" className={inputClass}>
            <option value="written">Written lesson</option>
            <option value="video">Video</option>
            <option value="document">Document</option>
          </select>
          <textarea name="body" rows={3} placeholder="What should they read, or the file link" className={inputClass} />
          <div className="flex gap-2">
            <button
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-contrast disabled:opacity-60"
            >
              {pending ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Add
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="rounded-lg bg-surface px-3 py-1.5 text-xs font-semibold text-ink-muted"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
