import { updateUniversitySettingsAction } from "@/app/actions/settings";
import { GenericList } from "@/components/academic/GenericList";
import { requireRole } from "@/lib/auth/guards";
import { readOr } from "@/lib/safe-read";
import { AdminReadService } from "@/lib/services/completion-read.service";
import { createClient } from "@/lib/supabase/server";
import { SettingsIcon } from "lucide-react";

export default async function AdminSettingsPage() {
  const session = await requireRole("department_admin");
  const settings = await readOr(new AdminReadService((await createClient()) as any).getSettings(session.profile.university_id!), null);
  const values = settings?.settings || {};

  async function save(formData: FormData) {
    "use server";
    await updateUniversitySettingsAction({
      timezone: String(formData.get("timezone") || ""),
      gradingScale: String(formData.get("gradingScale") || ""),
      registrationPolicy: String(formData.get("registrationPolicy") || ""),
      supportEmail: String(formData.get("supportEmail") || ""),
    });
  }

  return (
    <GenericList title="Settings" description="Academic defaults and university operational settings." icon={SettingsIcon}>
      <form action={save} className="bg-slate-950/60 backdrop-blur-2xl border border-white/10 rounded-[24px] p-6 grid gap-5 max-w-3xl">
        {[
          ["timezone", "Timezone", values.timezone || "Africa/Lagos"],
          ["gradingScale", "Grading scale", values.gradingScale || "A-F"],
          ["registrationPolicy", "Registration policy", values.registrationPolicy || "Advisor approval required"],
          ["supportEmail", "Support email", values.supportEmail || ""],
        ].map(([name, label, value]) => (
          <label key={name} className="grid gap-2 text-sm text-slate-300">
            {label}
            <input name={name} defaultValue={value} className="rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none focus:border-blue-400" />
          </label>
        ))}
        <button className="w-fit rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500">Save settings</button>
      </form>
    </GenericList>
  );
}
