"use client";

import * as React from "react";
import { motion } from "motion/react";
import { Bell, CalendarClock, CheckCircle2, Loader2, Save, ShieldCheck, SlidersHorizontal, UserRound } from "lucide-react";
import { updateLecturerSettingsAction } from "@/app/actions/settings";

const inputClass = "rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none transition focus:border-primary";

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
            className="rounded-[24px] border border-line bg-surface p-5 shadow-2xl backdrop-blur-2xl"
          >
            <Icon className="mb-5 text-primary" size={24} />
            <h2 className="font-outfit text-lg font-semibold text-ink">{title}</h2>
            <p className="mt-1 text-sm text-ink-muted">{description}</p>
          </motion.div>
        ))}
      </div>

      <section className="rounded-[28px] border border-line bg-surface p-6 shadow-2xl backdrop-blur-2xl">
        <div className="mb-6 flex items-center gap-3">
          <UserRound className="text-primary" size={22} />
          <div>
            <h2 className="font-outfit text-xl font-semibold text-ink">Public Profile</h2>
            <p className="text-sm text-ink-muted">Keep student-facing contact details accurate.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm text-ink-muted">First name<input name="firstName" defaultValue={profile.first_name} className={inputClass} /></label>
          <label className="grid gap-2 text-sm text-ink-muted">Last name<input name="lastName" defaultValue={profile.last_name} className={inputClass} /></label>
          <label className="grid gap-2 text-sm text-ink-muted md:col-span-2">Avatar URL<input name="avatarUrl" defaultValue={profile.avatar_url || ""} className={inputClass} /></label>
          <label className="grid gap-2 text-sm text-ink-muted md:col-span-2">Office hours<textarea name="officeHours" defaultValue={preferences.officeHours || ""} rows={3} className={inputClass} /></label>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[28px] border border-line bg-surface p-6 shadow-2xl backdrop-blur-2xl">
          <div className="mb-6 flex items-center gap-3">
            <Bell className="text-emerald-300" size={22} />
            <div>
              <h2 className="font-outfit text-xl font-semibold text-ink">Teaching Workflow</h2>
              <p className="text-sm text-ink-muted">Defaults used by live classes and grading queues.</p>
            </div>
          </div>
          <div className="grid gap-4">
            <label className="grid gap-2 text-sm text-ink-muted">Default live duration<input type="number" name="defaultLiveDuration" defaultValue={preferences.defaultLiveDuration || 60} className={inputClass} /></label>
            <label className="grid gap-2 text-sm text-ink-muted">Grading turnaround days<input type="number" name="gradingTurnaroundDays" defaultValue={preferences.gradingTurnaroundDays || 7} className={inputClass} /></label>
          </div>
        </div>

        <div className="rounded-[28px] border border-line bg-surface p-6 shadow-2xl backdrop-blur-2xl">
          <div className="mb-6 flex items-center gap-3">
            <ShieldCheck className="text-primary" size={22} />
            <div>
              <h2 className="font-outfit text-xl font-semibold text-ink">Preferences</h2>
              <p className="text-sm text-ink-muted">Control notifications and release checks.</p>
            </div>
          </div>
          <div className="grid gap-3">
            <label className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-status-soft p-4 text-sm text-ink">
              Email me critical course events
              <input name="emailNotifications" type="checkbox" defaultChecked={preferences.emailNotifications !== false} className="h-5 w-5 accent-primary" />
            </label>
            <label className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-status-soft p-4 text-sm text-ink">
              Require review before publishing quizzes
              <input name="quizPublishReview" type="checkbox" defaultChecked={preferences.quizPublishReview !== false} className="h-5 w-5 accent-primary" />
            </label>
          </div>
        </div>
      </section>

      {message && (
        <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${message === "Settings saved." ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200" : "border-red-500/20 bg-red-500/10 text-red-200"}`}>
          <CheckCircle2 size={17} /> {message}
        </div>
      )}

      <button className="inline-flex w-fit items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-contrast transition hover:bg-primary-hover">
        {pending ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />} Save settings
      </button>
    </form>
  );
}
