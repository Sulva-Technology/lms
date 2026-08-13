"use client";

import { useState, useTransition } from "react";
import { Archive, Edit3, FileText, Loader2, Plus, Save, Send } from "lucide-react";
import { archiveAssignmentAction, createAssignmentAction, toggleAssignmentPublishAction, updateAssignmentAction } from "@/app/actions/assignments";
import { DataTable } from "@/components/ui/data-table";
import { Drawer } from "@/components/ui/drawer";

type Course = { id: string; code: string; title: string };
type Assignment = Record<string, any>;

const inputClass = "rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-400";

export function AssignmentManager({ courses, assignments }: { courses: Course[]; assignments: Assignment[] }) {
  const [items, setItems] = useState(assignments);
  const [editing, setEditing] = useState<Assignment | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    const payload = {
      id: editing?.id,
      courseSectionId: String(formData.get("courseSectionId") || ""),
      title: String(formData.get("title") || ""),
      description: String(formData.get("description") || ""),
      dueDate: new Date(String(formData.get("dueDate") || "")).toISOString(),
      totalPoints: Number(formData.get("totalPoints") || 100),
      isPublished: formData.get("isPublished") === "on",
      allowLateSubmissions: formData.get("allowLateSubmissions") === "on",
      maxResubmissions: Number(formData.get("maxResubmissions") || 1),
    };
    run(async () => editing ? updateAssignmentAction(payload) : createAssignmentAction(payload), (result) => {
      const next = result.assignment;
      setItems((current) => editing ? current.map((item) => item.id === next.id ? { ...item, ...next } : item) : [next, ...current]);
      setDrawerOpen(false);
    }, `Assignment ${editing ? "updated" : "created"}.`);
  }

  function publish(item: Assignment) {
    run(async () => toggleAssignmentPublishAction(item.id, !item.is_published), () => {
      setItems((current) => current.map((row) => row.id === item.id ? { ...row, is_published: !item.is_published } : row));
    }, `Assignment ${item.is_published ? "unpublished" : "published"}.`);
  }

  function archive(item: Assignment) {
    run(async () => archiveAssignmentAction({ id: item.id }), () => {
      setItems((current) => current.filter((row) => row.id !== item.id));
    }, "Assignment archived.");
  }

  function run(action: () => Promise<any>, onSuccess: (result: any) => void, success: string) {
    setError("");
    setMessage("");
    startTransition(async () => {
      const result = await action();
      if (!result.success) {
        setError(result.error || "Action failed.");
        return;
      }
      onSuccess(result);
      setMessage(success);
    });
  }

  return (
    <div className="space-y-4">
      <div className="glass-panel flex flex-col gap-3 rounded-2xl border border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-white">{items.length} assignments</p>
          <p className="text-xs text-slate-400">Create, update, publish, and archive coursework.</p>
        </div>
        <button onClick={() => { setEditing(null); setDrawerOpen(true); }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-glow-blue transition hover:bg-blue-500">
          <Plus size={16} /> Add Assignment
        </button>
      </div>
      {(message || error) && <div className={`rounded-xl border px-4 py-3 text-sm ${error ? "border-red-500/20 bg-red-500/10 text-red-300" : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"}`}>{error || message}</div>}
      <DataTable
        data={items}
        keyExtractor={(item) => item.id}
        columns={[
          { key: "title", header: "Assignment", cell: (item) => <span className="font-medium text-white">{item.title}</span> },
          { key: "course", header: "Course", cell: (item) => item.course_sections?.courses?.code || courses.find((course) => course.id === item.course_section_id)?.code || "Course" },
          { key: "due", header: "Due", cell: (item) => new Date(item.due_date).toLocaleDateString() },
          { key: "points", header: "Points", cell: (item) => item.total_points },
          { key: "status", header: "Status", cell: (item) => item.is_published ? "Published" : "Draft" },
          { key: "actions", header: "", align: "right", cell: (item) => (
            <div className="flex justify-end gap-2">
              <button onClick={() => { setEditing(item); setDrawerOpen(true); }} className="rounded-lg bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"><Edit3 size={13} /></button>
              <button onClick={() => publish(item)} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20"><Send size={13} /> {item.is_published ? "Unpublish" : "Publish"}</button>
              <button onClick={() => archive(item)} className="rounded-lg bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/20"><Archive size={13} /></button>
            </div>
          ) },
        ]}
      />
      <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title={`${editing ? "Edit" : "Add"} assignment`} className="max-w-xl">
        <form action={submit} className="grid gap-4">
          <label className="grid gap-2 text-sm font-medium text-slate-300">Course section<select name="courseSectionId" required defaultValue={editing?.course_section_id || ""} className={inputClass}>{courses.map((course) => <option key={course.id} value={course.id}>{course.code} - {course.title}</option>)}</select></label>
          <label className="grid gap-2 text-sm font-medium text-slate-300">Title<input name="title" required defaultValue={editing?.title || ""} className={inputClass} /></label>
          <label className="grid gap-2 text-sm font-medium text-slate-300">Description<textarea name="description" rows={4} defaultValue={editing?.description || ""} className={inputClass} /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-slate-300">Due date<input name="dueDate" type="datetime-local" required className={inputClass} /></label>
            <label className="grid gap-2 text-sm font-medium text-slate-300">Points<input name="totalPoints" type="number" min={0} defaultValue={editing?.total_points || 100} className={inputClass} /></label>
          </div>
          <label className="grid gap-2 text-sm font-medium text-slate-300">Resubmissions<input name="maxResubmissions" type="number" min={1} defaultValue={editing?.max_resubmissions || 1} className={inputClass} /></label>
          <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300"><input name="isPublished" type="checkbox" defaultChecked={editing?.is_published} className="h-4 w-4 accent-blue-500" /> Publish immediately</label>
          <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300"><input name="allowLateSubmissions" type="checkbox" defaultChecked={editing?.allow_late_submissions} className="h-4 w-4 accent-blue-500" /> Allow late submissions</label>
          <button disabled={pending} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60">
            {pending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save assignment
          </button>
        </form>
      </Drawer>
    </div>
  );
}
