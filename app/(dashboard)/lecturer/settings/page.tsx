import { LecturerSettingsForm } from "@/components/lecturer/LecturerSettingsForm";
import { ErrorState } from "@/components/ui/error-state";
import { requireRole } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { SettingsIcon } from "lucide-react";

export default async function LecturerSettingsPage() {
  const session = await requireRole("lecturer");
  const adminClient = createAdminClient();
  const { data: profile, error } = await adminClient
    .from("profiles")
    .select("id, first_name, last_name, email, avatar_url, preferences")
    .eq("id", session.user.id)
    .single();

  if (error || !profile) return <ErrorState message={error?.message || "Could not load lecturer settings."} />;

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-20">
      <div className="rounded-[32px] border border-white/10 bg-slate-950/60 p-6 shadow-2xl backdrop-blur-2xl">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/10 text-blue-300">
          <SettingsIcon size={24} />
        </div>
        <h1 className="font-outfit text-3xl font-semibold tracking-tight text-white">Lecturer Settings</h1>
        <p className="mt-2 max-w-2xl text-slate-400">
          Manage your profile, teaching preferences, and default behaviors for live classes and assessments.
        </p>
      </div>
      <LecturerSettingsForm profile={profile} />
    </div>
  );
}
