import { updateStudentSettingsAction } from "@/app/actions/settings";
import { GenericList } from "@/components/academic/GenericList";
import { requireRole } from "@/lib/auth/guards";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { STORAGE_BUCKETS } from "@/lib/storage/paths";
import { env } from "@/lib/env";
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
    <GenericList title="Settings" description="Personalize your profile, notifications, and display preferences." icon={SettingsIcon}>
      <ProfileForm
        profile={{
          first_name: session.profile.first_name,
          last_name: session.profile.last_name,
          avatar_url: session.profile.avatar_url,
        }}
        publicBaseUrl={`${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKETS.PROFILE_IMAGES}`}
      />
      <form action={save} className="bg-surface backdrop-blur-2xl border border-line rounded-[24px] p-6 grid gap-5 max-w-2xl">
        <label className="grid gap-2 text-sm text-ink-muted">
          Display name
          <input name="displayName" defaultValue={preferences.displayName || ""} className="rounded-xl border border-line bg-surface px-4 py-3 text-ink outline-none focus:border-primary" />
        </label>
        <label className="flex items-center gap-3 text-sm text-ink-muted">
          <input name="emailNotifications" type="checkbox" defaultChecked={preferences.emailNotifications !== false} className="accent-primary" />
          Email me important course updates
        </label>
        <label className="grid gap-2 text-sm text-ink-muted">
          Interface density
          <select name="themeDensity" defaultValue={preferences.themeDensity || "comfortable"} className="rounded-xl border border-line bg-surface px-4 py-3 text-ink outline-none focus:border-primary">
            <option value="comfortable">Comfortable</option>
            <option value="compact">Compact</option>
          </select>
        </label>
        <button className="w-fit rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-contrast hover:bg-primary-hover">Save settings</button>
      </form>
    </GenericList>
  );
}
