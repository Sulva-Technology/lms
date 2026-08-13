"use client";

import * as React from "react";
import { CalendarCheck, Loader2, Plus, Save, Users, Video } from "lucide-react";
import {
  calculateLiveClassAttendanceAction,
  markAttendanceAction,
} from "@/app/actions/attendance";
import { DataTable } from "@/components/ui/data-table";
import { Drawer } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";

type Section = { id: string; label: string };
type Student = { id: string; name: string };
type AttendanceStatus = "present" | "absent" | "late" | "excused";

export type AttendanceSession = {
  id: string;
  title: string;
  date: string;
  course_section_id: string;
  live_class_id: string | null;
  course_sections?: any;
  attendance_records?: Array<{ student_id: string; status: string }>;
};

type LiveClass = { id: string; topic: string; course_section_id: string };

const inputClass =
  "rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-400";
const labelClass = "grid gap-2 text-sm font-medium text-slate-300";

const STATUSES: AttendanceStatus[] = ["present", "absent", "late", "excused"];

export function AttendanceManager({
  sections,
  sessions,
  roster,
  liveClasses,
}: {
  sections: Section[];
  sessions: AttendanceSession[];
  /** Enrolled students keyed by course section id. */
  roster: Record<string, Student[]>;
  liveClasses: LiveClass[];
}) {
  const [items, setItems] = React.useState(sessions);
  const [drawer, setDrawer] = React.useState<"create" | "roll" | null>(null);
  const [activeSession, setActiveSession] = React.useState<AttendanceSession | null>(null);
  const [sectionId, setSectionId] = React.useState(sections[0]?.id || "");
  const [marks, setMarks] = React.useState<Record<string, AttendanceStatus>>({});
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  const students = roster[sectionId] || [];

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

  function openCreate() {
    const first = sections[0]?.id || "";
    setSectionId(first);
    setActiveSession(null);
    setMarks(Object.fromEntries((roster[first] || []).map((student) => [student.id, "present" as AttendanceStatus])));
    setError("");
    setMessage("");
    setDrawer("create");
  }

  function openRoll(session: AttendanceSession) {
    setActiveSession(session);
    setSectionId(session.course_section_id);

    const existing = Object.fromEntries(
      (session.attendance_records || []).map((record) => [record.student_id, record.status as AttendanceStatus]),
    );
    const sectionStudents = roster[session.course_section_id] || [];
    setMarks(
      Object.fromEntries(
        sectionStudents.map((student) => [student.id, existing[student.id] || ("present" as AttendanceStatus)]),
      ),
    );

    setError("");
    setMessage("");
    setDrawer("roll");
  }

  function changeSection(nextSectionId: string) {
    setSectionId(nextSectionId);
    setMarks(
      Object.fromEntries(
        (roster[nextSectionId] || []).map((student) => [student.id, "present" as AttendanceStatus]),
      ),
    );
  }

  function submitRoll(formData: FormData) {
    const title = String(formData.get("title") || activeSession?.title || "");
    const date = String(formData.get("date") || activeSession?.date || "");

    const payload = {
      courseSectionId: sectionId,
      title,
      date,
      liveClassId: activeSession?.live_class_id || undefined,
      records: Object.entries(marks).map(([studentId, status]) => ({ studentId, status })),
    };

    run(
      async () => markAttendanceAction(payload),
      (result) => {
        const records = payload.records.map((record) => ({
          student_id: record.studentId,
          status: record.status,
        }));

        setItems((current) => {
          const existing = current.find((item) => item.id === result.sessionId);
          if (existing) {
            return current.map((item) =>
              item.id === result.sessionId ? { ...item, attendance_records: records } : item,
            );
          }
          return [
            {
              id: result.sessionId,
              title,
              date,
              course_section_id: sectionId,
              live_class_id: payload.liveClassId || null,
              attendance_records: records,
            },
            ...current,
          ];
        });
        setDrawer(null);
      },
      "Attendance saved.",
    );
  }

  function pullFromLiveClass(liveClassId: string) {
    run(
      async () => calculateLiveClassAttendanceAction(liveClassId),
      () => setDrawer(null),
      "Attendance calculated from live class participation. Reload to see the updated roll.",
    );
  }

  function sectionLabel(session: AttendanceSession) {
    return (
      session.course_sections?.courses?.code ||
      sections.find((section) => section.id === session.course_section_id)?.label ||
      "Course"
    );
  }

  return (
    <div className="space-y-4">
      <div className="glass-panel flex flex-col gap-3 rounded-2xl border border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-white">{items.length} attendance sessions</p>
          <p className="text-xs text-slate-400">Take a roll call, or derive one from live class participation.</p>
        </div>
        <button
          onClick={openCreate}
          disabled={sections.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-glow-blue transition hover:bg-blue-500 disabled:opacity-60"
        >
          <Plus size={16} /> Take attendance
        </button>
      </div>

      {(message || error) && (
        <div
          className={
            error
              ? "rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
              : "rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
          }
        >
          {error || message}
        </div>
      )}

      {liveClasses.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
            <Video size={15} className="text-violet-300" /> Derive from a live class
          </p>
          <div className="flex flex-wrap gap-2">
            {liveClasses.map((liveClass) => (
              <button
                key={liveClass.id}
                onClick={() => pullFromLiveClass(liveClass.id)}
                disabled={pending}
                className="rounded-lg bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10 disabled:opacity-60"
              >
                {liveClass.topic}
              </button>
            ))}
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState
          title="No attendance sessions"
          description="Take a roll call for a section, or derive one from a completed live class."
        />
      ) : (
        <DataTable
          data={items}
          keyExtractor={(item) => item.id}
          columns={[
            {
              key: "title",
              header: "Session",
              cell: (item) => <span className="font-medium text-white">{item.title}</span>,
            },
            { key: "course", header: "Course", cell: (item) => sectionLabel(item) },
            { key: "date", header: "Date", cell: (item) => new Date(item.date).toLocaleDateString() },
            {
              key: "present",
              header: "Present",
              cell: (item) => (item.attendance_records || []).filter((r) => r.status === "present").length,
            },
            { key: "total", header: "Marked", cell: (item) => (item.attendance_records || []).length },
            {
              key: "actions",
              header: "",
              align: "right",
              cell: (item) => (
                <button
                  onClick={() => openRoll(item)}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500"
                >
                  Edit roll
                </button>
              ),
            },
          ]}
        />
      )}

      <Drawer
        isOpen={drawer !== null}
        onClose={() => setDrawer(null)}
        title={drawer === "roll" ? `Roll call — ${activeSession?.title || ""}` : "Take attendance"}
        className="max-w-2xl"
      >
        <form action={submitRoll} className="grid gap-4">
          {drawer === "create" ? (
            <label className={labelClass}>
              Course section
              <select
                name="courseSectionId"
                value={sectionId}
                onChange={(event) => changeSection(event.target.value)}
                className={inputClass}
              >
                {sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className={labelClass}>
            Session title
            <input name="title" required defaultValue={activeSession?.title || ""} className={inputClass} />
          </label>

          <label className={labelClass}>
            Date
            <input
              name="date"
              type="date"
              required
              defaultValue={(activeSession?.date || "").slice(0, 10)}
              className={inputClass}
            />
          </label>

          <div className="grid gap-2">
            <p className="flex items-center gap-2 text-sm font-medium text-slate-300">
              <Users size={15} className="text-blue-300" /> {students.length} enrolled students
            </p>

            {students.length === 0 ? (
              <p className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-slate-500">
                No active enrollments in this section yet.
              </p>
            ) : (
              <div className="grid gap-2">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="text-sm text-slate-200">{student.name}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {STATUSES.map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setMarks((current) => ({ ...current, [student.id]: status }))}
                          className={
                            marks[student.id] === status
                              ? "rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold capitalize text-white"
                              : "rounded-lg bg-white/5 px-3 py-1.5 text-xs font-semibold capitalize text-slate-300 hover:bg-white/10"
                          }
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            disabled={pending || students.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
          >
            {pending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <CalendarCheck size={16} /> Save attendance
          </button>
        </form>
      </Drawer>
    </div>
  );
}
