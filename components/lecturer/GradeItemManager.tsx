"use client";

import * as React from "react";
import { Loader2, Plus, Save } from "lucide-react";
import { createGradeItemAction } from "@/app/actions/gradebook";
import { DataTable } from "@/components/ui/data-table";
import { Drawer } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";

type Section = { id: string; label: string };
export type GradeItem = Record<string, any>;

const inputClass =
  "rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none transition focus:border-primary";
const labelClass = "grid gap-2 text-sm font-medium text-ink-muted";

export function GradeItemManager({ sections, items }: { sections: Section[]; items: GradeItem[] }) {
  const [rows, setRows] = React.useState(items);
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  function submit(formData: FormData) {
    const payload = {
      courseSectionId: String(formData.get("courseSectionId") || ""),
      name: String(formData.get("name") || ""),
      maxScore: Number(formData.get("maxScore") || 100),
      weight: Number(formData.get("weight") || 0),
    };

    setError("");
    setMessage("");

    startTransition(async () => {
      const result = await createGradeItemAction(payload);
      if (!result.success) {
        setError(result.error || "Could not create the grade item.");
        return;
      }
      setRows((current) => [{ ...result.gradeItem, grades: [] }, ...current]);
      setOpen(false);
      setMessage("Grade item created.");
    });
  }

  function sectionLabel(item: GradeItem) {
    return (
      item.course_sections?.courses?.code ||
      sections.find((section) => section.id === item.course_section_id)?.label ||
      "Course"
    );
  }

  return (
    <div className="space-y-4">
      <div className="panel flex flex-col gap-3 rounded-2xl border border-line p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">{rows.length} grade items</p>
          <p className="text-xs text-ink-muted">
            Assignments create their own grade item automatically. Add items here for exams and participation.
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          disabled={sections.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-contrast transition hover:bg-primary-hover disabled:opacity-60"
        >
          <Plus size={16} /> Add grade item
        </button>
      </div>

      {(message || error) && (
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

      {rows.length === 0 ? (
        <EmptyState
          title="No grade items"
          description="Create grade items or grade submissions to populate the gradebook."
        />
      ) : (
        <DataTable
          data={rows}
          keyExtractor={(item) => item.id}
          columns={[
            {
              key: "item",
              header: "Item",
              cell: (item) => <span className="font-medium text-ink">{item.name || item.title}</span>,
            },
            { key: "course", header: "Course", cell: (item) => sectionLabel(item) },
            { key: "max", header: "Max", cell: (item) => item.max_score || 100 },
            {
              key: "weight",
              header: "Weight",
              cell: (item) => `${item.weight ?? item.weight_percentage ?? 0}%`,
            },
            { key: "graded", header: "Grades", cell: (item) => (item.grades || []).length },
          ]}
        />
      )}

      <Drawer isOpen={open} onClose={() => setOpen(false)} title="Add grade item" className="max-w-xl">
        <form action={submit} className="grid gap-4">
          <label className={labelClass}>
            Course section
            <select name="courseSectionId" required className={inputClass}>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.label}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Name
            <input name="name" required minLength={2} className={inputClass} placeholder="Midterm exam" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              Max score
              <input name="maxScore" type="number" min={1} defaultValue={100} required className={inputClass} />
            </label>
            <label className={labelClass}>
              Weight (%)
              <input name="weight" type="number" min={0} max={100} defaultValue={10} required className={inputClass} />
            </label>
          </div>
          <button
            disabled={pending}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-contrast hover:bg-primary-hover disabled:opacity-60"
          >
            {pending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save grade item
          </button>
        </form>
      </Drawer>
    </div>
  );
}
