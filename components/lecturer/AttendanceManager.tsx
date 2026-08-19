"use client";

import * as React from "react";
import {
  CalendarCheck,
  Download,
  History,
  Loader2,
  Plus,
  Save,
  TriangleAlert,
  Users,
  Video,
} from "lucide-react";
import {
  calculateLiveClassAttendanceAction,
  getAttendanceHistoryAction,
  markAttendanceAction,
} from "@/app/actions/attendance";
import type { AttendanceChange } from "@/types/attendance";
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
  period?: number;
  course_section_id: string;
  live_class_id: string | null;
  course_sections?: any;
  attendance_records?: Array<{ student_id: string; status: string; notes?: string | null }>;
};

type LiveClass = { id: string; topic: string; course_section_id: string };

export type AttendanceRate = {
  studentId: string;
  sectionId: string;
  name: string;
  identifier: string;
  attended: number;
  total: number;
  rate: number;
  belowThreshold: boolean;
};

const inputClass =
  "rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none transition focus:border-primary";
const labelClass = "grid gap-2 text-sm font-medium text-ink-muted";

const STATUSES: AttendanceStatus[] = ["present", "absent", "late", "excused"];

/** Matches the default in AttendanceService.getAttendanceRates. */
const THRESHOLD = 75;

export function AttendanceManager({
  sections,
  sessions,
  roster,
  liveClasses,
  rates = [],
}: {
  sections: Section[];
  sessions: AttendanceSession[];
  /** Enrolled students keyed by course section id. */
  roster: Record<string, Student[]>;
  liveClasses: LiveClass[];
  rates?: AttendanceRate[];
}) {
  const [items, setItems] = React.useState(sessions);
  const [drawer, setDrawer] = React.useState<"create" | "roll" | null>(null);
  const [activeSession, setActiveSession] = React.useState<AttendanceSession | null>(null);
  const [sectionId, setSectionId] = React.useState(sections[0]?.id || "");
  const [marks, setMarks] = React.useState<Record<string, AttendanceStatus>>({});
  const [notes, setNotes] = React.useState<Record<string, string>>({});
  const [history, setHistory] = React.useState<AttendanceChange[]>([]);
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  const students = roster[sectionId] || [];
  const sectionRates = rates.filter((rate) => rate.sectionId === sectionId);
  const defaulters = sectionRates.filter((rate) => rate.belowThreshold);

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
    setNotes({});
    setHistory([]);
    setHistoryOpen(false);
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
    const existingNotes = Object.fromEntries(
      (session.attendance_records || []).map((record) => [record.student_id, record.notes || ""]),
    );
    const sectionStudents = roster[session.course_section_id] || [];
    setMarks(
      Object.fromEntries(
        sectionStudents.map((student) => [student.id, existing[student.id] || ("present" as AttendanceStatus)]),
      ),
    );
    setNotes(Object.fromEntries(sectionStudents.map((student) => [student.id, existingNotes[student.id] || ""])));

    setHistory([]);
    setHistoryOpen(false);
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
    setNotes({});
  }

  function submitRoll(formData: FormData) {
    const title = String(formData.get("title") || activeSession?.title || "");
    const date = String(formData.get("date") || activeSession?.date || "");

    const payload = {
      courseSectionId: sectionId,
      title,
      date,
      period: Number(formData.get("period") || activeSession?.period || 1),
      liveClassId: activeSession?.live_class_id || undefined,
      records: Object.entries(marks).map(([studentId, status]) => ({
        studentId,
        status,
        notes: notes[studentId]?.trim() || undefined,
      })),
    };

    run(
      async () => markAttendanceAction(payload),
      (result) => {
        const records = payload.records.map((record) => ({
          student_id: record.studentId,
          status: record.status,
          notes: record.notes || null,
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
              period: payload.period,
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

  function studentName(studentId: string) {
    for (const list of Object.values(roster)) {
      const match = list.find((student) => student.id === studentId);
      if (match) return match.name;
    }
    return "Student";
  }

  function loadHistory() {
    if (!activeSession) return;
    setHistoryOpen(true);
    startTransition(async () => {
      const result = await getAttendanceHistoryAction(activeSession.id);
      if (!result.success) {
        setError(result.error || "Could not load the change log.");
        return;
      }
      setHistory(result.changes || []);
    });
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
      <div className="panel flex flex-col gap-3 rounded-2xl border border-line p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">{items.length} attendance sessions</p>
          <p className="text-xs text-ink-muted">Take a roll call, or derive one from live class participation.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {sections.length > 0 ? (
            <select
              value={sectionId}
              onChange={(event) => setSectionId(event.target.value)}
              aria-label="Section to export"
              className="rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-primary"
            >
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.label}
                </option>
              ))}
            </select>
          ) : null}
          <a
            href={sectionId ? `/api/exports/attendance/${sectionId}` : undefined}
            aria-disabled={!sectionId}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-status-soft px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-ink/[0.06] aria-disabled:pointer-events-none aria-disabled:opacity-60"
          >
            <Download size={16} /> Export CSV
          </a>
          <button
            onClick={openCreate}
            disabled={sections.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-contrast transition hover:bg-primary-hover disabled:opacity-60"
          >
            <Plus size={16} /> Take attendance
          </button>
        </div>
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
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
            <Video size={15} className="text-primary" /> Derive from a live class
          </p>
          <div className="flex flex-wrap gap-2">
            {liveClasses.map((liveClass) => (
              <button
                key={liveClass.id}
                onClick={() => pullFromLiveClass(liveClass.id)}
                disabled={pending}
                className="rounded-lg bg-status-soft px-3 py-2 text-xs font-semibold text-ink transition hover:bg-ink/[0.06] disabled:opacity-60"
              >
                {liveClass.topic}
              </button>
            ))}
          </div>
        </div>
      )}

      {sectionRates.length > 0 ? (
        <div className="rounded-2xl border border-line bg-surface p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink">
              <TriangleAlert size={15} className="text-amber-300" /> Below {THRESHOLD}% attendance
            </p>
            <p className="text-xs text-ink-subtle">
              {defaulters.length} of {sectionRates.length} students in this section
            </p>
          </div>

          {defaulters.length === 0 ? (
            <p className="text-xs text-ink-muted">
              Every student in this section is at or above {THRESHOLD}%.
            </p>
          ) : (
            <ul className="grid gap-2">
              {defaulters.map((student) => (
                <li
                  key={student.studentId}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-status-soft px-3 py-2 text-xs"
                >
                  <span className="text-ink">
                    {student.name}
                    {student.identifier ? <span className="text-ink-subtle"> · {student.identifier}</span> : null}
                  </span>
                  <span className="font-semibold text-amber-300">
                    {student.rate}%{" "}
                    <span className="font-normal text-ink-subtle">
                      ({student.attended} of {student.total})
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

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
              cell: (item) => <span className="font-medium text-ink">{item.title}</span>,
            },
            { key: "course", header: "Course", cell: (item) => sectionLabel(item) },
            { key: "date", header: "Date", cell: (item) => new Date(item.date).toLocaleDateString() },
            { key: "period", header: "Period", cell: (item) => item.period ?? 1 },
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
                  className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-contrast hover:bg-primary-hover"
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

          <div className="grid gap-4 sm:grid-cols-2">
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

            <label className={labelClass}>
              Period
              <input
                name="period"
                type="number"
                min={1}
                max={20}
                required
                defaultValue={activeSession?.period ?? 1}
                className={inputClass}
              />
              <span className="text-xs font-normal text-ink-subtle">
                Which meeting of the day this register covers.
              </span>
            </label>
          </div>

          <div className="grid gap-2">
            <p className="flex items-center gap-2 text-sm font-medium text-ink-muted">
              <Users size={15} className="text-primary" /> {students.length} enrolled students
            </p>

            {students.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line p-4 text-sm text-ink-subtle">
                No active enrollments in this section yet.
              </p>
            ) : (
              <div className="grid gap-2">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="grid gap-2 rounded-xl border border-line bg-status-soft p-3"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-sm text-ink">{student.name}</span>
                      <div className="flex flex-wrap gap-1.5">
                        {STATUSES.map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => setMarks((current) => ({ ...current, [student.id]: status }))}
                            className={
                              marks[student.id] === status
                                ? "rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold capitalize text-primary-contrast"
                                : "rounded-lg bg-status-soft px-3 py-1.5 text-xs font-semibold capitalize text-ink-muted hover:bg-ink/[0.06]"
                            }
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      value={notes[student.id] || ""}
                      onChange={(event) =>
                        setNotes((current) => ({ ...current, [student.id]: event.target.value }))
                      }
                      maxLength={500}
                      placeholder="Reason or note (optional)"
                      aria-label={`Note for ${student.name}`}
                      className="rounded-lg border border-line bg-surface px-3 py-2 text-xs text-ink outline-none transition focus:border-primary"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {drawer === "roll" && activeSession ? (
            <div className="grid gap-3 rounded-xl border border-line bg-status-soft p-4">
              <button
                type="button"
                onClick={loadHistory}
                className="flex items-center gap-2 text-left text-sm font-semibold text-ink hover:text-ink"
              >
                <History size={15} className="text-amber-300" />
                Change log
              </button>

              {historyOpen ? (
                history.length === 0 ? (
                  <p className="text-xs text-ink-subtle">
                    {pending ? "Loading the change log…" : "No changes recorded for this register yet."}
                  </p>
                ) : (
                  <ul className="grid gap-2">
                    {history.map((change) => (
                      <li key={change.id} className="rounded-lg bg-surface px-3 py-2 text-xs text-ink-muted">
                        <span className="font-medium text-ink">{studentName(change.studentId)}</span>{" "}
                        {change.previousStatus ? (
                          <>
                            changed from <span className="capitalize">{change.previousStatus}</span> to{" "}
                            <span className="capitalize text-ink">{change.newStatus}</span>
                          </>
                        ) : (
                          <>
                            marked <span className="capitalize text-ink">{change.newStatus}</span>
                          </>
                        )}{" "}
                        by {change.changedByName} on {new Date(change.changedAt).toLocaleString()}
                        {change.newNotes ? <span className="block text-ink-subtle">Note: {change.newNotes}</span> : null}
                      </li>
                    ))}
                  </ul>
                )
              ) : (
                <p className="text-xs text-ink-subtle">
                  Every status and note change on this register, with who made it and when.
                </p>
              )}
            </div>
          ) : null}

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            disabled={pending || students.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-contrast transition hover:bg-primary-hover disabled:opacity-60"
          >
            {pending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <CalendarCheck size={16} /> Save attendance
          </button>
        </form>
      </Drawer>
    </div>
  );
}
