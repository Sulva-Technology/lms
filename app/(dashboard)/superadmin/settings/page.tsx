import { upsertPlatformSettingAction } from "@/app/actions/settings";
import { GenericList } from "@/components/academic/GenericList";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/guards";
import { readOr } from "@/lib/safe-read";
import { SuperadminService } from "@/lib/services/completion-read.service";
import { createClient } from "@/lib/supabase/server";
import { Settings } from "lucide-react";

const inputClass = "rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-blue-400";

export default async function SuperadminSettingsPage() {
  await requireRole("super_admin");
  const settings = await readOr(new SuperadminService((await createClient()) as any).getSettings(), []);

  async function save(formData: FormData) {
    "use server";
    await upsertPlatformSettingAction({
      key: String(formData.get("key")),
      description: String(formData.get("description") || ""),
      value: String(formData.get("value") || "{}"),
    });
  }

  return (
    <GenericList title="System Settings" description="Platform-level configuration flags and defaults." icon={Settings}>
      <form action={save} className="grid gap-4 rounded-[28px] border border-white/10 bg-slate-950/60 p-6 shadow-2xl backdrop-blur-2xl lg:grid-cols-[1fr_1fr_2fr_auto]">
        <input name="key" placeholder="setting.key" className={inputClass} />
        <input name="description" placeholder="Description" className={inputClass} />
        <textarea name="value" placeholder='{"enabled":true}' rows={1} className={inputClass} />
        <button className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-glow-blue hover:bg-blue-500">Save setting</button>
      </form>
      {settings.length === 0 ? <EmptyState title="No settings" description="Create platform settings for feature flags and defaults." /> : (
        <DataTable
          data={settings}
          keyExtractor={(item: any) => item.key}
          columns={[
            { key: "key", header: "Key", cell: (item: any) => <span className="font-medium text-white">{item.key}</span> },
            { key: "description", header: "Description", cell: (item: any) => item.description || "No description" },
            { key: "value", header: "Value", cell: (item: any) => <code className="rounded-lg bg-black/30 px-2 py-1 text-xs text-blue-100">{JSON.stringify(item.value)}</code> },
            { key: "updated", header: "Updated", cell: (item: any) => new Date(item.updated_at).toLocaleString() },
          ]}
        />
      )}
    </GenericList>
  );
}
