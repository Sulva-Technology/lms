"use client";

import { useState, useTransition } from "react";
import { Archive, Loader2, Plus, Save, UserPlus, X } from "lucide-react";
import { archiveCourseSectionAction, assignLecturerToSectionAction, removeLecturerFromSectionAction, upsertCourseSectionAction } from "@/app/actions/admin/courses";
import { DataTable } from "@/components/ui/data-table";
import { Drawer } from "@/components/ui/drawer";

type Row = Record<string, any>;
type Option = { id: string; code?: string; title?: string; name?: string; email?: string; first_name?: string; last_name?: string };

const inputClass = "rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none transition focus:border-primary";

function one<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function lecturerName(profile: any) {
  return [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || profile?.email || "Lecturer";
}

function optionById(options: Option[], id: string) {
  return options.find((option) => option.id === id) || null;
}

export function CourseSectionManager({ courses, semesters, lecturers, sections }: { courses: Option[]; semesters: Option[]; lecturers: Option[]; sections: Row[] }) {
  const [items, setItems] = useState(sections);
  const [drawer, setDrawer] = useState<"section" | "assign" | null>(null);
  const [selected, setSelected] = useState<Row | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function createSection(formData: FormData) {
    const courseId = String(formData.get("courseId") || "");
    const semesterId = String(formData.get("semesterId") || "");
    const payload = {
      courseId,
      semesterId,
      name: String(formData.get("name") || ""),
      capacity: formData.get("capacity") ? Number(formData.get("capacity")) : null,
    };
    run(async () => upsertCourseSectionAction(payload), (result) => {
      setItems((current) => [{
        ...result.data,
        courses: optionById(courses, courseId),
        semesters: optionById(semesters, semesterId),
        course_lecturers: [],
      }, ...current]);
      setDrawer(null);
    }, "Course section created.");
  }

  function assignLecturer(formData: FormData) {
    const courseSectionId = String(formData.get("courseSectionId") || selected?.id || "");
    const lecturerId = String(formData.get("lecturerId") || "");
    const payload = {
      courseSectionId,
      lecturerId,
      isPrimary: formData.get("isPrimary") === "on",
    };
    run(async () => assignLecturerToSectionAction(payload), (result) => {
      const lecturer = optionById(lecturers, lecturerId);
      setItems((current) => current.map((section) => {
        if (section.id !== courseSectionId) return section;

        const existingAssignments = section.course_lecturers || [];
        const assignment = {
          ...result.data,
          profiles: lecturer,
        };

        return {
          ...section,
          course_lecturers: existingAssignments.some((item: any) => item.lecturer_id === lecturerId)
            ? existingAssignments.map((item: any) => item.lecturer_id === lecturerId ? assignment : item)
            : [assignment, ...existingAssignments],
        };
      }));
      setDrawer(null);
    }, "Lecturer assigned.");
  }

  function removeLecturer(sectionId: string, lecturerId: string) {
    run(async () => removeLecturerFromSectionAction({ courseSectionId: sectionId, lecturerId }), () => {
      setItems((current) => current.map((section) => section.id === sectionId ? {
        ...section,
        course_lecturers: (section.course_lecturers || []).filter((item: any) => item.lecturer_id !== lecturerId),
      } : section));
    }, "Lecturer removed from section.");
  }

  function archiveSection(section: Row) {
    run(async () => archiveCourseSectionAction({ id: section.id }), (result) => {
      setItems((current) => current.map((item) => item.id === section.id ? { ...item, ...result.data } : item));
    }, "Course section archived.");
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
          <p className="text-sm font-semibold text-ink">Course sections and lecturer assignment</p>
          <p className="text-xs text-ink-muted">Create sections first, then assign one or more lecturers to each section.</p>
        </div>
        <button onClick={() => setDrawer("section")} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-contrast transition hover:bg-primary-hover">
          <Plus size={16} /> Add Section
        </button>
      </div>

      {(message || error) && <div className={`rounded-xl border px-4 py-3 text-sm ${error ? "border-red-500/20 bg-red-500/10 text-red-300" : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"}`}>{error || message}</div>}

      <DataTable
        data={items}
        keyExtractor={(item) => item.id}
        columns={[
          { key: "section", header: "Section", cell: (item) => <span className="font-semibold text-ink">{item.name}</span> },
          { key: "course", header: "Course", cell: (item) => {
            const course = one(item.courses);
            return <span className="text-primary">{course?.code || "Course"} - {course?.title || ""}</span>;
          } },
          { key: "semester", header: "Semester", cell: (item) => one(item.semesters)?.name || "Semester" },
          { key: "lecturers", header: "Lecturers", cell: (item) => (
            <div className="flex flex-wrap gap-2">
              {(item.course_lecturers || []).length === 0 ? <span className="text-ink-subtle">Unassigned</span> : item.course_lecturers.map((assignment: any) => {
                const profile = one(assignment.profiles);
                return (
                  <span key={assignment.id} className="inline-flex items-center gap-2 rounded-full border border-line bg-status-soft px-3 py-1.5 text-xs text-ink">
                    {lecturerName(profile)}
                    <button onClick={() => removeLecturer(item.id, assignment.lecturer_id)} className="text-ink-subtle hover:text-red-300" aria-label="Remove lecturer"><X size={12} /></button>
                  </span>
                );
              })}
            </div>
          ) },
          { key: "status", header: "Status", cell: (item) => item.deleted_at ? "Archived" : "Active" },
          { key: "actions", header: "Actions", align: "right", cell: (item) => (
            <div className="flex justify-end gap-2">
              <button onClick={() => { setSelected(item); setDrawer("assign"); }} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20"><UserPlus size={13} /> Assign</button>
              <button onClick={() => archiveSection(item)} className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/20"><Archive size={13} /> Archive</button>
            </div>
          ) },
        ]}
      />

      <Drawer isOpen={drawer === "section"} onClose={() => setDrawer(null)} title="Add course section" className="max-w-xl">
        <form action={createSection} className="grid gap-4">
          <label className="grid gap-2 text-sm font-medium text-ink-muted">Course<select name="courseId" required className={inputClass}>{courses.map((course) => <option key={course.id} value={course.id}>{course.code} - {course.title}</option>)}</select></label>
          <label className="grid gap-2 text-sm font-medium text-ink-muted">Semester<select name="semesterId" required className={inputClass}>{semesters.map((semester) => <option key={semester.id} value={semester.id}>{semester.name}</option>)}</select></label>
          <label className="grid gap-2 text-sm font-medium text-ink-muted">Section name<input name="name" required placeholder="Group A / 2026 Cohort" className={inputClass} /></label>
          <label className="grid gap-2 text-sm font-medium text-ink-muted">Capacity<input name="capacity" type="number" min={1} className={inputClass} /></label>
          <button disabled={pending || courses.length === 0 || semesters.length === 0} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-contrast hover:bg-primary-hover disabled:opacity-60">
            {pending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save section
          </button>
        </form>
      </Drawer>

      <Drawer isOpen={drawer === "assign"} onClose={() => setDrawer(null)} title="Assign lecturer" className="max-w-xl">
        <form action={assignLecturer} className="grid gap-4">
          <input type="hidden" name="courseSectionId" value={selected?.id || ""} />
          <div className="rounded-xl border border-line bg-status-soft p-4 text-sm text-ink-muted">
            Section: <span className="font-semibold text-ink">{selected?.name || "Selected section"}</span>
          </div>
          <label className="grid gap-2 text-sm font-medium text-ink-muted">Lecturer<select name="lecturerId" required className={inputClass}>{lecturers.map((lecturer) => <option key={lecturer.id} value={lecturer.id}>{lecturerName(lecturer)} ({lecturer.email || "no email"})</option>)}</select></label>
          <label className="flex items-center gap-3 rounded-xl border border-line bg-status-soft px-4 py-3 text-sm text-ink-muted"><input name="isPrimary" type="checkbox" className="h-4 w-4 accent-emerald-500" /> Primary lecturer</label>
          <button disabled={pending || lecturers.length === 0} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-ink hover:bg-emerald-500 disabled:opacity-60">
            {pending ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />} Assign lecturer
          </button>
        </form>
      </Drawer>
    </div>
  );
}
