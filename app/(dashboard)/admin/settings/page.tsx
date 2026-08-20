import { updateUniversitySettingsAction } from "@/app/actions/settings";
import { BrandingForm } from "@/components/admin/BrandingForm";
import { GenericList } from "@/components/academic/GenericList";
import { requireRole } from "@/lib/auth/guards";
import { readOr } from "@/lib/safe-read";
import { AdminReadService } from "@/lib/services/completion-read.service";
import { createClient } from "@/lib/supabase/server";
import { SettingsIcon } from "lucide-react";

export default async function AdminSettingsPage() {
  const session = await requireRole("department_admin");
  const supabase = await createClient();
  const settings = await readOr(new AdminReadService(supabase as any).getSettings(session.universityId!), null);
  const values = settings?.settings || {};

  const { data: school } = await supabase
    .from("universities")
    .select("name, primary_color, secondary_color")
    .eq("id", session.universityId!)
    .maybeSingle();

  async function save(formData: FormData) {
    "use server";
    await updateUniversitySettingsAction({
      // Empty means follow the tenant mode. Writing "academic" here on every
      // save is what silently pinned the wording and made changing the mode
      // look like it did nothing.
      vocabulary: String(formData.get("vocabulary") || "") || undefined,
      timezone: String(formData.get("timezone") || ""),
      gradingScale: String(formData.get("gradingScale") || ""),
      registrationPolicy: String(formData.get("registrationPolicy") || ""),
      supportEmail: String(formData.get("supportEmail") || ""),
    });
  }

  return (
    <GenericList title="Settings" description="Academic defaults, branding, and university operational settings." icon={SettingsIcon}>
      <BrandingForm
        schoolName={school?.name ?? "your institution"}
        initialPrimary={school?.primary_color ?? null}
        initialSecondary={school?.secondary_color ?? null}
      />

      <form action={save} className="bg-surface backdrop-blur-2xl border border-line rounded-[24px] p-6 grid gap-5 max-w-3xl">
        <label className="grid gap-2 text-sm text-ink-muted">
          Vocabulary
          <select
            name="vocabulary"
            defaultValue={values.vocabulary || ""}
            className="rounded-xl border border-line bg-surface px-4 py-3 text-ink outline-none focus:border-primary"
          >
            <option value="">Follow the organisation type (recommended)</option>
            <option value="academic">Academic — university, lecturer, student, semester</option>
            <option value="organization">Organization — trainer, trainee, programme, cohort</option>
          </select>
          <span className="text-xs text-ink-subtle">
            Changes what people read across the app. Nothing about your data or links changes.
          </span>
        </label>

        {[
          ["timezone", "Timezone", values.timezone || "Africa/Lagos"],
          ["gradingScale", "Grading scale", values.gradingScale || "A-F"],
          ["registrationPolicy", "Registration policy", values.registrationPolicy || "Advisor approval required"],
          ["supportEmail", "Support email", values.supportEmail || ""],
        ].map(([name, label, value]) => (
          <label key={name} className="grid gap-2 text-sm text-ink-muted">
            {label}
            <input name={name} defaultValue={value} className="rounded-xl border border-line bg-surface px-4 py-3 text-ink outline-none focus:border-primary" />
          </label>
        ))}
        <button className="w-fit rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-contrast hover:bg-primary-hover">Save settings</button>
      </form>
    </GenericList>
  );
}
