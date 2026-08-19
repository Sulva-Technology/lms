"use client";

import { useState, useTransition } from "react";
import { Archive, Edit3, Loader2, Plus, Save, Send } from "lucide-react";
import { archiveAnnouncementAction, createAnnouncementAction, updateAnnouncementAction } from "@/app/actions/announcements";
import { DataTable } from "@/components/ui/data-table";
import { Drawer } from "@/components/ui/drawer";

type Course = { id: string; code: string; title: string };
type Announcement = Record<string, any>;

const inputClass = "rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none transition focus:border-primary";

export function AnnouncementManager({ courses, announcements }: { courses: Course[]; announcements: Announcement[] }) {
  const [items, setItems] = useState(announcements);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    const targetId = String(formData.get("targetId") || "university");
    const payload = {
      id: editing?.id,
      title: String(formData.get("title") || ""),
      content: String(formData.get("content") || ""),
      targetScope: targetId === "university" ? "university" : "course_section",
      targetId: targetId === "university" ? undefined : targetId,
      isPublished: formData.get("isPublished") === "on",
    };
    run(async () => editing ? updateAnnouncementAction(payload) : createAnnouncementAction(payload), (result) => {
      const next = result.data;
      setItems((current) => editing ? current.map((item) => item.id === next.id ? { ...item, ...next } : item) : [next, ...current]);
      setDrawerOpen(false);
    }, `Announcement ${editing ? "updated" : "created"}.`);
  }

  function togglePublish(item: Announcement) {
    run(async () => updateAnnouncementAction({ id: item.id, isPublished: !item.is_published }), () => {
      setItems((current) => current.map((row) => row.id === item.id ? { ...row, is_published: !item.is_published } : row));
    }, `Announcement ${item.is_published ? "unpublished" : "published"}.`);
  }

  function archive(item: Announcement) {
    run(async () => archiveAnnouncementAction({ id: item.id }), () => {
      setItems((current) => current.filter((row) => row.id !== item.id));
    }, "Announcement archived.");
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
      <div className="panel flex flex-col gap-3 rounded-2xl border border-line p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">{items.length} announcements</p>
          <p className="text-xs text-ink-muted">Create, edit, publish, and archive course updates.</p>
        </div>
        <button onClick={() => { setEditing(null); setDrawerOpen(true); }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-primary-hover">
          <Plus size={16} /> New Announcement
        </button>
      </div>
      {(message || error) && <div className={`rounded-xl border px-4 py-3 text-sm ${error ? "border-red-500/20 bg-red-500/10 text-danger" : "border-emerald-500/20 bg-emerald-500/10 text-success"}`}>{error || message}</div>}
      <DataTable
        data={items}
        keyExtractor={(item) => item.id}
        columns={[
          { key: "title", header: "Title", cell: (item) => <span className="font-medium text-ink">{item.title}</span> },
          { key: "target", header: "Target", cell: (item) => item.target_scope === "course_section" ? item.course_sections?.courses?.code || "Course" : "University" },
          { key: "status", header: "Status", cell: (item) => item.is_published ? "Published" : "Draft" },
          { key: "date", header: "Posted", cell: (item) => new Date(item.created_at).toLocaleDateString() },
          { key: "actions", header: "", align: "right", cell: (item) => (
            <div className="flex justify-end gap-2">
              <button onClick={() => { setEditing(item); setDrawerOpen(true); }} className="rounded-lg bg-status-soft px-3 py-2 text-xs font-semibold text-ink hover:bg-ink/[0.06]"><Edit3 size={13} /></button>
              <button onClick={() => togglePublish(item)} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-success hover:bg-emerald-500/20"><Send size={13} /> {item.is_published ? "Unpublish" : "Publish"}</button>
              <button onClick={() => archive(item)} className="rounded-lg bg-red-500/10 px-3 py-2 text-xs font-semibold text-danger hover:bg-red-500/20"><Archive size={13} /></button>
            </div>
          ) },
        ]}
      />
      <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title={`${editing ? "Edit" : "New"} announcement`} className="max-w-xl">
        <form action={submit} className="grid gap-4">
          <label className="grid gap-2 text-sm font-medium text-ink-muted">Target<select name="targetId" defaultValue={editing?.course_section_id || "university"} className={inputClass}><option value="university">University</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.code} - {course.title}</option>)}</select></label>
          <label className="grid gap-2 text-sm font-medium text-ink-muted">Title<input name="title" required defaultValue={editing?.title || ""} className={inputClass} /></label>
          <label className="grid gap-2 text-sm font-medium text-ink-muted">Content<textarea name="content" required rows={6} defaultValue={editing?.content || ""} className={inputClass} /></label>
          <label className="flex items-center gap-3 rounded-xl border border-line bg-status-soft px-4 py-3 text-sm text-ink-muted"><input name="isPublished" type="checkbox" defaultChecked={editing?.is_published ?? true} className="h-4 w-4 accent-indigo-500" /> Publish immediately</label>
          <button disabled={pending} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-ink hover:bg-primary-hover disabled:opacity-60">
            {pending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save announcement
          </button>
        </form>
      </Drawer>
    </div>
  );
}
