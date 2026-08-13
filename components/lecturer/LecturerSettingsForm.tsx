"use client";

import * as React from "react";
import { motion } from "motion/react";
import { Bell, CalendarClock, CheckCircle2, Loader2, Save, ShieldCheck, SlidersHorizontal, UserRound } from "lucide-react";
import { updateLecturerSettingsAction } from "@/app/actions/settings";

const inputClass = "rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-400";

export function LecturerSettingsForm({ profile }: { profile: any }) {
  const preferences = profile.preferences || {};
  const [pending, setPending] = React.useState(false);
  const [message, setMessage] = React.useState("");

  async function save(formData: FormData) {
    setPending(true);
    setMessage("");
    const result = await updateLecturerSettingsAction({
      firstName: String(formData.get("firstName")),
      lastName: String(formData.get("lastName")),
      avatarUrl: String(formData.get("avatarUrl") || ""),
      officeHours: String(formData.get("officeHours") || ""),
      defaultLiveDuration: Number(formData.get("defaultLiveDuration") || 60),
      gradingTurnaroundDays: Number(formData.get("gradingTurnaroundDays") || 7),
      emailNotifications: formData.get("emailNotifications") === "on",
      quizPublishReview: formData.get("quizPublishReview") === "on",
    });
    setPending(false);
    setMessage(result?.error || "Settings saved.");
  }

  return (
    <form action={save} className="grid gap-6">
      <div className="grid gap-4 lg:grid-cols-3">
        {[
          ["Profile", "Identity shown to students", UserRound],
          ["Live defaults", "Reusable class preferences", CalendarClock],
          ["Assessment review", "Publishing and grading controls", SlidersHorizontal],
        ].map(([title, description, Icon]: any, index) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="rounded-[24px] border border-white/10 bg-slate-950/60 p-5 shadow-2xl backdrop-blur-2xl"
          >
            <Icon className="mb-5 text-blue-300" size={24} />
            <h2 className="font-outfit text-lg font-semibold text-white">{title}</h2>
            <p className="mt-1 text-sm text-slate-400">{description}</p>
          </motion.div>
        ))}
      </div>

      <section className="rounded-[28px] border border-white/10 bg-slate-950/60 p-6 shadow-2xl backdrop-blur-2xl">
        <div className="mb-6 flex items-center gap-3">
          <UserRound className="text-blue-300" size={22} />
          <div>
            <h2 className="font-outfit text-xl font-semibold text-white">Public Profile</h2>
            <p className="text-sm text-slate-400">Keep student-facing contact details accurate.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm text-slate-300">First name<input name="firstName" defaultValue={profile.first_name} className={inputClass} /></label>
          <label className="grid gap-2 text-sm text-slate-300">Last name<input name="lastName" defaultValue={profile.last_name} className={inputClass} /></label>
          <label className="grid gap-2 text-sm text-slate-300 md:col-span-2">Avatar URL<input name="avatarUrl" defaultValue={profile.avatar_url || ""} className={inputClass} /></label>
          <label className="grid gap-2 text-sm text-slate-300 md:col-span-2">Office hours<textarea name="officeHours" defaultValue={preferences.officeHours || ""} rows={3} className={inputClass} /></label>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[28px] border border-white/10 bg-slate-950/60 p-6 shadow-2xl backdrop-blur-2xl">
          <div className="mb-6 flex items-center gap-3">
            <Bell className="text-emerald-300" size={22} />
            <div>
              <h2 className="font-outfit text-xl font-semibold text-white">Teaching Workflow</h2>
              <p className="text-sm text-slate-400">Defaults used by live classes and grading queues.</p>
            </div>
          </div>
          <div className="grid gap-4">
            <label className="grid gap-2 text-sm text-slate-300">Default live duration<input type="number" name="defaultLiveDuration" defaultValue={preferences.defaultLiveDuration || 60} className={inputClass} /></label>
            <label className="grid gap-2 text-sm text-slate-300">Grading turnaround days<input type="number" name="gradingTurnaroundDays" defaultValue={preferences.gradingTurnaroundDays || 7} className={inputClass} /></label>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-slate-950/60 p-6 shadow-2xl backdrop-blur-2xl">
          <div className="mb-6 flex items-center gap-3">
            <ShieldCheck className="text-violet-300" size={22} />
            <div>
              <h2 className="font-outfit text-xl font-semibold text-white">Preferences</h2>
              <p className="text-sm text-slate-400">Control notifications and release checks.</p>
            </div>
          </div>
          <div className="grid gap-3">
            <label className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-200">
              Email me critical course events
              <input name="emailNotifications" type="checkbox" defaultChecked={preferences.emailNotifications !== false} className="h-5 w-5 accent-blue-500" />
            </label>
            <label className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-200">
              Require review before publishing quizzes
              <input name="quizPublishReview" type="checkbox" defaultChecked={preferences.quizPublishReview !== false} className="h-5 w-5 accent-blue-500" />
            </label>
          </div>
        </div>
      </section>

      {message && (
        <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${message === "Settings saved." ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200" : "border-red-500/20 bg-red-500/10 text-red-200"}`}>
          <CheckCircle2 size={17} /> {message}
        </div>
      )}

      <button className="inline-flex w-fit items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-glow-blue transition hover:bg-blue-500">
        {pending ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />} Save settings
      </button>
    </form>
  );
}
