import { updateStudentSettingsAction } from "@/app/actions/settings";
import { GenericList } from "@/components/academic/GenericList";
import { requireRole } from "@/lib/auth/guards";
import { SettingsIcon } from "lucide-react";

export default async function StudentSettingsPage() {
  const session = await requireRole("student");
  const preferences = (session.profile as any).preferences || {};

  async function save(formData: FormData) {
    "use server";
    await updateStudentSettingsAction({
      displayName: String(formData.get("displayName") || ""),
      emailNotifications: formData.get("emailNotifications") === "on",
      themeDensity: formData.get("themeDensity") || "comfortable",
    });
  }

  return (
    <GenericList title="Settings" description="Personalize notification and display preferences." icon={SettingsIcon}>
      <form action={save} className="bg-slate-950/60 backdrop-blur-2xl border border-white/10 rounded-[24px] p-6 grid gap-5 max-w-2xl">
        <label className="grid gap-2 text-sm text-slate-300">
          Display name
          <input name="displayName" defaultValue={preferences.displayName || ""} className="rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none focus:border-blue-400" />
        </label>
        <label className="flex items-center gap-3 text-sm text-slate-300">
          <input name="emailNotifications" type="checkbox" defaultChecked={preferences.emailNotifications !== false} className="accent-blue-500" />
          Email me important course updates
        </label>
        <label className="grid gap-2 text-sm text-slate-300">
          Interface density
          <select name="themeDensity" defaultValue={preferences.themeDensity || "comfortable"} className="rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none focus:border-blue-400">
            <option value="comfortable">Comfortable</option>
            <option value="compact">Compact</option>
          </select>
        </label>
        <button className="w-fit rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500">Save settings</button>
      </form>
    </GenericList>
  );
}
