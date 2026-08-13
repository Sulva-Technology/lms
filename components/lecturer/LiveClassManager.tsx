"use client";

import { useState, useTransition } from "react";
import { motion } from "motion/react";
import { CalendarPlus, Loader2, Save, XCircle } from "lucide-react";
import { cancelLiveClassAction, createLiveClassAction } from "@/app/actions/live-classes";
import { Drawer } from "@/components/ui/drawer";
import { LiveClassList } from "@/components/live/LiveClassList";
import type { LiveSession } from "@/types/live-class";

type Course = { id: string; courseId?: string; code: string; title: string };

export function LiveClassManager({ courses, sessions }: { courses: Course[]; sessions: LiveSession[] }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [items, setItems] = useState(sessions);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    const selected = courses.find((course) => course.id === String(formData.get("courseSectionId")));
    const payload = {
      courseId: selected?.courseId || "",
      courseSectionId: selected?.id || "",
      topic: String(formData.get("topic") || ""),
      description: String(formData.get("description") || ""),
      startTime: new Date(String(formData.get("startTime") || "")).toISOString(),
      durationMinutes: Number(formData.get("durationMinutes") || 60),
      isRecordingEnabled: formData.get("isRecordingEnabled") === "on",
      isWaitingRoomEnabled: formData.get("isWaitingRoomEnabled") === "on",
      joinBeforeHost: formData.get("joinBeforeHost") === "on",
      trackingRule: String(formData.get("trackingRule") || "duration"),
    };

    setError("");
    setMessage("");
    startTransition(async () => {
      const result = await createLiveClassAction(payload);
      if (!result.success) {
        setError(result.error || "Could not schedule live class.");
        return;
      }
      setDrawerOpen(false);
      setMessage("Live class scheduled.");
    });
  }

  function cancel(id: string) {
    setError("");
    setMessage("");
    startTransition(async () => {
      const result = await cancelLiveClassAction(id);
      if (!result.success) {
        setError(result.error || "Could not cancel live class.");
        return;
      }
      setItems((current) => current.map((item) => item.id === id ? { ...item, status: "completed" } : item));
      setMessage("Live class cancelled.");
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-outfit text-3xl font-bold text-white mb-2 tracking-tight">Manage Live Classes</h1>
          <p className="text-slate-400">Host scheduled classes, view attendance, and manage recordings.</p>
        </div>
        <button onClick={() => setDrawerOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] transition hover:bg-blue-500">
          <CalendarPlus size={16} /> Schedule Class
        </button>
      </div>

      {(message || error) && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className={`rounded-xl border px-4 py-3 text-sm ${error ? "border-red-500/20 bg-red-500/10 text-red-300" : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"}`}>
          {error || message}
        </motion.div>
      )}

      <div className="grid gap-3">
        {items.map((session) => (
          <div key={session.id} className="relative">
            <LiveClassList role="lecturer" sessions={[session]} />
            {session.status === "scheduled" && (
              <button onClick={() => cancel(session.id)} className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/20">
                <XCircle size={14} /> Cancel
              </button>
            )}
          </div>
        ))}
        {items.length === 0 && <LiveClassList role="lecturer" sessions={[]} />}
      </div>

      <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title="Schedule live class" className="max-w-xl">
        <form action={submit} className="grid gap-4">
          <label className="grid gap-2 text-sm font-medium text-slate-300">Course section<select name="courseSectionId" required className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-blue-400">{courses.map((course) => <option key={course.id} value={course.id}>{course.code} - {course.title}</option>)}</select></label>
          <label className="grid gap-2 text-sm font-medium text-slate-300">Topic<input name="topic" required className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-blue-400" /></label>
          <label className="grid gap-2 text-sm font-medium text-slate-300">Description<textarea name="description" rows={4} className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-blue-400" /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-slate-300">Start time<input name="startTime" type="datetime-local" required className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-blue-400" /></label>
            <label className="grid gap-2 text-sm font-medium text-slate-300">Duration<input name="durationMinutes" type="number" min={15} max={300} defaultValue={60} required className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-blue-400" /></label>
          </div>
          <label className="grid gap-2 text-sm font-medium text-slate-300">Attendance tracking<select name="trackingRule" className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-blue-400"><option value="duration">Duration based</option><option value="join">Join based</option></select></label>
          <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300"><input name="isRecordingEnabled" type="checkbox" className="h-4 w-4 accent-blue-500" /> Enable recording</label>
          <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300"><input name="isWaitingRoomEnabled" type="checkbox" className="h-4 w-4 accent-blue-500" /> Enable waiting room</label>
          <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300"><input name="joinBeforeHost" type="checkbox" className="h-4 w-4 accent-blue-500" /> Allow students to join before host</label>
          <button disabled={pending || courses.length === 0} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60">
            {pending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Schedule class
          </button>
        </form>
      </Drawer>
    </div>
  );
}
