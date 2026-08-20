"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FileText, Film, Loader2, Paperclip, Plus, Trash2, Wand2 } from "lucide-react";
import { createTrainingAction } from "@/app/actions/trainings";

type Option = { id: string; label: string };
type Kind = "written" | "video" | "document";
type Material = { key: number; title: string; kind: Kind; body: string };

const inputClass =
  "w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none transition focus:border-primary";
const labelClass = "grid gap-2 text-sm font-medium text-ink-muted";

const KINDS: Array<{ value: Kind; label: string; hint: string; icon: typeof FileText }> = [
  { value: "written", label: "Written lesson", hint: "Text they read and mark done", icon: FileText },
  { value: "video", label: "Video", hint: "A file they watch", icon: Film },
  { value: "document", label: "Document", hint: "A PDF or file they download", icon: Paperclip },
];

let nextKey = 1;

export function TrainingBuilder({ learners, teams }: { learners: Option[]; teams: Option[] }) {
  const router = useRouter();
  const [material, setMaterial] = React.useState<Material[]>([
    { key: 0, title: "", kind: "written", body: "" },
  ]);
  const [learnerIds, setLearnerIds] = React.useState<string[]>([]);
  const [teamIds, setTeamIds] = React.useState<string[]>([]);
  const [repeats, setRepeats] = React.useState(false);
  const [hasQuiz, setHasQuiz] = React.useState(false);
  const [error, setError] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  const toggle = (list: string[], set: (next: string[]) => void, id: string) =>
    set(list.includes(id) ? list.filter((item) => item !== id) : [...list, id]);

  function submit(formData: FormData) {
    setError("");

    const payload = {
      name: String(formData.get("name") || ""),
      description: String(formData.get("description") || ""),
      material: material
        .filter((item) => item.title.trim())
        .map((item) => ({ title: item.title.trim(), kind: item.kind, body: item.body.trim() || undefined })),
      passMark: hasQuiz ? Number(formData.get("passMark") || 70) : null,
      validForMonths: repeats ? Number(formData.get("validForMonths") || 12) : null,
      startsOn: String(formData.get("startsOn") || ""),
      dueOn: String(formData.get("dueOn") || "") || null,
      learnerIds,
      teamIds,
      publish: formData.get("publish") !== null,
    };

    startTransition(async () => {
      const result = await createTrainingAction(payload);
      if (!("success" in result)) {
        setError(result.error || "Could not create this training.");
        return;
      }
      router.push("/admin/trainings");
      router.refresh();
    });
  }

  return (
    <form action={submit} className="grid gap-6">
      <section className="grid gap-4 rounded-[24px] border border-line bg-surface p-6">
        <h2 className="font-outfit text-lg font-semibold text-ink">What is this training?</h2>
        <label className={labelClass}>
          Name
          <input name="name" required placeholder="Client confidentiality" className={inputClass} />
        </label>
        <label className={labelClass}>
          What it covers
          <textarea name="description" rows={2} placeholder="Optional" className={inputClass} />
        </label>
      </section>

      <section className="grid gap-4 rounded-[24px] border border-line bg-surface p-6">
        <div>
          <h2 className="font-outfit text-lg font-semibold text-ink">What will they work through?</h2>
          <p className="mt-1 text-sm text-ink-muted">In the order you add it. You can change it later.</p>
        </div>

        {material.map((item, index) => (
          <div key={item.key} className="grid gap-3 rounded-2xl border border-line bg-surface-muted p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Step {index + 1}</span>
              {material.length > 1 ? (
                <button
                  type="button"
                  onClick={() => setMaterial((rows) => rows.filter((row) => row.key !== item.key))}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-ink-muted hover:text-danger"
                >
                  <Trash2 size={13} /> Remove
                </button>
              ) : null}
            </div>

            <input
              value={item.title}
              onChange={(event) =>
                setMaterial((rows) =>
                  rows.map((row) => (row.key === item.key ? { ...row, title: event.target.value } : row)),
                )
              }
              placeholder="Name this step"
              className={inputClass}
            />

            <div className="flex flex-wrap gap-2">
              {KINDS.map((kind) => (
                <button
                  key={kind.value}
                  type="button"
                  title={kind.hint}
                  onClick={() =>
                    setMaterial((rows) =>
                      rows.map((row) => (row.key === item.key ? { ...row, kind: kind.value } : row)),
                    )
                  }
                  className={
                    item.kind === kind.value
                      ? "inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-contrast"
                      : "inline-flex items-center gap-2 rounded-lg bg-surface px-3 py-2 text-xs font-semibold text-ink-muted hover:text-ink"
                  }
                >
                  <kind.icon size={13} /> {kind.label}
                </button>
              ))}
            </div>

            <textarea
              value={item.body}
              onChange={(event) =>
                setMaterial((rows) =>
                  rows.map((row) => (row.key === item.key ? { ...row, body: event.target.value } : row)),
                )
              }
              rows={item.kind === "written" ? 4 : 2}
              placeholder={
                item.kind === "written"
                  ? "What should they read?"
                  : "Paste the file link, or leave blank and upload it after saving"
              }
              className={inputClass}
            />
          </div>
        ))}

        <button
          type="button"
          onClick={() => setMaterial((rows) => [...rows, { key: nextKey++, title: "", kind: "written", body: "" }])}
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink hover:bg-surface-muted"
        >
          <Plus size={15} /> Add another step
        </button>
      </section>

      <section className="grid gap-4 rounded-[24px] border border-line bg-surface p-6">
        <h2 className="font-outfit text-lg font-semibold text-ink">Who has to do it?</h2>

        {teams.length > 0 ? (
          <div className="grid gap-2">
            <span className="text-sm font-medium text-ink-muted">Whole teams</span>
            <div className="flex flex-wrap gap-2">
              {teams.map((team) => (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => toggle(teamIds, setTeamIds, team.id)}
                  className={
                    teamIds.includes(team.id)
                      ? "rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-contrast"
                      : "rounded-lg bg-surface-muted px-3 py-2 text-xs font-semibold text-ink-muted hover:text-ink"
                  }
                >
                  {team.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="grid gap-2">
          <span className="text-sm font-medium text-ink-muted">Individual people</span>
          {learners.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line p-4 text-sm text-ink-muted">
              Nobody to assign yet. Create the training now and assign it once people have joined.
            </p>
          ) : (
            <div className="grid gap-1.5 sm:grid-cols-2">
              {learners.map((learner) => (
                <label key={learner.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={learnerIds.includes(learner.id)}
                    onChange={() => toggle(learnerIds, setLearnerIds, learner.id)}
                  />
                  {learner.label}
                </label>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4 rounded-[24px] border border-line bg-surface p-6">
        <h2 className="font-outfit text-lg font-semibold text-ink">When, and how often?</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            Available from
            <input
              name="startsOn"
              type="date"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            Due by
            <input name="dueOn" type="date" className={inputClass} />
            <span className="text-xs font-normal text-ink-muted">Leave empty and it never counts as overdue.</span>
          </label>
        </div>

        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={hasQuiz} onChange={(event) => setHasQuiz(event.target.checked)} />
          They must reach a mark before they are certified
        </label>
        {hasQuiz ? (
          <label className={labelClass}>
            Pass mark (%)
            <input name="passMark" type="number" min={0} max={100} defaultValue={70} className={inputClass} />
          </label>
        ) : null}

        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={repeats} onChange={(event) => setRepeats(event.target.checked)} />
          This has to be repeated
        </label>
        {repeats ? (
          <label className={labelClass}>
            Certificate valid for (months)
            <input name="validForMonths" type="number" min={1} max={120} defaultValue={12} className={inputClass} />
            <span className="text-xs font-normal text-ink-muted">
              It appears for renewal thirty days before it lapses.
            </span>
          </label>
        ) : null}

        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" name="publish" defaultChecked />
          Make it available now
        </label>
      </section>

      {error ? (
        <p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>
      ) : null}

      <button
        disabled={pending}
        className="inline-flex w-fit items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-contrast transition hover:bg-primary-hover disabled:opacity-60"
      >
        {pending ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
        Create training
      </button>
    </form>
  );
}
