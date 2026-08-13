"use client";

import { useState, useTransition } from "react";
import { motion } from "motion/react";
import { Archive, Edit3, Loader2, Plus, RotateCcw, Save } from "lucide-react";
import { createFacultyAction, updateFacultyAction, archiveFacultyAction, restoreFacultyAction } from "@/app/actions/admin/faculties";
import { createDepartmentAction, updateDepartmentAction, archiveDepartmentAction, restoreDepartmentAction } from "@/app/actions/admin/departments";
import { createProgramAction, updateProgramAction, archiveProgramAction, restoreProgramAction } from "@/app/actions/admin/programs";
import { createCourseAction, updateCourseAction, archiveCourseAction, restoreCourseAction } from "@/app/actions/admin/courses";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Drawer } from "@/components/ui/drawer";
import { Modal } from "@/components/ui/modal";

type EntityType = "faculties" | "departments" | "programs" | "courses";
type Row = Record<string, any>;
type Option = { id: string; name: string; code?: string };

type Props = {
  type: EntityType;
  rows: Row[];
  faculties?: Option[];
  departments?: Option[];
};

const labels: Record<EntityType, { singular: string; titleKey: string }> = {
  faculties: { singular: "Faculty", titleKey: "name" },
  departments: { singular: "Department", titleKey: "name" },
  programs: { singular: "Program", titleKey: "name" },
  courses: { singular: "Course", titleKey: "title" },
};

function actionSet(type: EntityType) {
  if (type === "faculties") return { create: createFacultyAction, update: updateFacultyAction, archive: archiveFacultyAction, restore: restoreFacultyAction };
  if (type === "departments") return { create: createDepartmentAction, update: updateDepartmentAction, archive: archiveDepartmentAction, restore: restoreDepartmentAction };
  if (type === "programs") return { create: createProgramAction, update: updateProgramAction, archive: archiveProgramAction, restore: restoreProgramAction };
  return { create: createCourseAction, update: updateCourseAction, archive: archiveCourseAction, restore: restoreCourseAction };
}

const inputClass = "rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-400";
const labelClass = "grid gap-2 text-sm font-medium text-slate-300";

export function AcademicCrudManager({ type, rows, faculties = [], departments = [] }: Props) {
  const [items, setItems] = useState(rows);
  const [editing, setEditing] = useState<Row | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirming, setConfirming] = useState<Row | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const copy = labels[type];
  const actions = actionSet(type);

  const columns: Column<Row>[] = (() => {
    const base: Column<Row>[] = [
      {
        key: "name",
        header: type === "courses" ? "Course" : copy.singular,
        cell: (item) => (
          <div>
            <p className="font-semibold text-white">{item.title || item.name}</p>
            {item.description && <p className="mt-1 line-clamp-1 text-xs text-slate-500">{item.description}</p>}
          </div>
        ),
      },
      { key: "code", header: "Code", cell: (item) => <span className="font-medium text-blue-300">{item.code}</span> },
    ];

    if (type === "courses") {
      base.push({ key: "credits", header: "Credits", cell: (item) => item.credits });
      base.push({ key: "status", header: "Status", cell: (item) => item.deleted_at ? "Archived" : item.status });
    } else {
      base.push({ key: "status", header: "Status", cell: (item) => item.deleted_at ? "Archived" : "Active" });
    }

    base.push({
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      cell: (item) => (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => openEdit(item)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
          >
            <Edit3 size={13} /> Edit
          </button>
          <button
            type="button"
            onClick={() => item.deleted_at ? restore(item) : setConfirming(item)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
          >
            {item.deleted_at ? <RotateCcw size={13} /> : <Archive size={13} />}
            {item.deleted_at ? "Restore" : "Archive"}
          </button>
        </div>
      ),
    });
    return base;
  })();

  function openCreate() {
    setEditing(null);
    setDrawerOpen(true);
    setError("");
    setMessage("");
  }

  function openEdit(item: Row) {
    setEditing(item);
    setDrawerOpen(true);
    setError("");
    setMessage("");
  }

  function submit(formData: FormData) {
    const payload: Row = Object.fromEntries(formData.entries());
    if (editing) payload.id = editing.id;
    if (payload.credits) payload.credits = Number(payload.credits);

    setError("");
    setMessage("");
    startTransition(async () => {
      const result = editing ? await actions.update(payload) : await actions.create(payload);
      if (!result.success) {
        setError(result.error);
        return;
      }
      const next = result.data as Row;
      setItems((current) => editing ? current.map((item) => item.id === next.id ? { ...item, ...next } : item) : [next, ...current]);
      setDrawerOpen(false);
      setMessage(`${copy.singular} ${editing ? "updated" : "created"}.`);
    });
  }

  function archiveConfirmed() {
    if (!confirming) return;
    const item = confirming;
    setError("");
    setMessage("");
    startTransition(async () => {
      const result = await actions.archive({ id: item.id });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setItems((current) => current.map((row) => row.id === item.id ? { ...row, ...(result.data as Row) } : row));
      setConfirming(null);
      setMessage(`${copy.singular} archived.`);
    });
  }

  function restore(item: Row) {
    setError("");
    setMessage("");
    startTransition(async () => {
      const result = await actions.restore({ id: item.id });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setItems((current) => current.map((row) => row.id === item.id ? { ...row, ...(result.data as Row) } : row));
      setMessage(`${copy.singular} restored.`);
    });
  }

  return (
    <div className="space-y-4">
      <div className="glass-panel flex flex-col gap-3 rounded-2xl border border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-white">{items.length} records</p>
          <p className="text-xs text-slate-400">Create, update, archive, and restore {copy.singular.toLowerCase()} records.</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-glow-blue transition hover:bg-blue-500 active:scale-[0.98]"
        >
          <Plus size={16} /> Add {copy.singular}
        </button>
      </div>

      {(message || error) && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl border px-4 py-3 text-sm ${error ? "border-red-500/20 bg-red-500/10 text-red-300" : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"}`}
        >
          {error || message}
        </motion.div>
      )}

      <DataTable data={items} keyExtractor={(item) => item.id} columns={columns} />

      <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title={`${editing ? "Edit" : "Add"} ${copy.singular}`} className="max-w-xl">
        <form action={submit} className="grid gap-4">
          {type === "departments" && (
            <label className={labelClass}>
              Faculty
              <select name="facultyId" defaultValue={editing?.faculty_id || ""} required className={inputClass}>
                <option value="" disabled>Select faculty</option>
                {faculties.map((faculty) => <option key={faculty.id} value={faculty.id}>{faculty.code ? `${faculty.code} - ` : ""}{faculty.name}</option>)}
              </select>
            </label>
          )}
          {type === "programs" && (
            <label className={labelClass}>
              Department
              <select name="departmentId" defaultValue={editing?.department_id || ""} required className={inputClass}>
                <option value="" disabled>Select department</option>
                {departments.map((department) => <option key={department.id} value={department.id}>{department.code ? `${department.code} - ` : ""}{department.name}</option>)}
              </select>
            </label>
          )}
          {type === "courses" && (
            <label className={labelClass}>
              Department
              <select name="departmentId" defaultValue={editing?.department_id || ""} required className={inputClass}>
                <option value="" disabled>Select department</option>
                {departments.map((department) => <option key={department.id} value={department.id}>{department.code ? `${department.code} - ` : ""}{department.name}</option>)}
              </select>
            </label>
          )}
          <label className={labelClass}>
            {type === "courses" ? "Title" : "Name"}
            <input name={type === "courses" ? "title" : "name"} required defaultValue={editing?.title || editing?.name || ""} className={inputClass} />
          </label>
          <label className={labelClass}>
            Code
            <input name="code" required defaultValue={editing?.code || ""} className={inputClass} />
          </label>
          {(type === "programs" || type === "courses") && (
            <label className={labelClass}>
              Description
              <textarea name="description" defaultValue={editing?.description || ""} rows={4} className={inputClass} />
            </label>
          )}
          {type === "courses" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={labelClass}>
                Credits
                <input name="credits" type="number" min={1} max={10} required defaultValue={editing?.credits || 3} className={inputClass} />
              </label>
              <label className={labelClass}>
                Status
                <select name="status" defaultValue={editing?.status || "draft"} className={inputClass}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
            </div>
          )}
          <button disabled={pending} className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60">
            {pending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save {copy.singular}
          </button>
        </form>
      </Drawer>

      <Modal isOpen={Boolean(confirming)} onClose={() => setConfirming(null)} title={`Archive ${copy.singular}`}>
        <div className="space-y-5">
          <p className="text-sm leading-6 text-slate-300">
            This will hide <span className="font-semibold text-white">{confirming?.[copy.titleKey]}</span> from active lists while preserving history, enrollments, submissions, and audit trails.
          </p>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setConfirming(null)} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/10">Cancel</button>
            <button type="button" disabled={pending} onClick={archiveConfirmed} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60">
              {pending && <Loader2 size={15} className="animate-spin" />}
              Archive
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
