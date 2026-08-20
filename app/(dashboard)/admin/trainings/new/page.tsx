import Link from "next/link";
import { GenericList } from "@/components/academic/GenericList";
import { TrainingBuilder } from "@/components/training/TrainingBuilder";
import { requireRole } from "@/lib/auth/guards";
import { readOr } from "@/lib/safe-read";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, Wand2 } from "lucide-react";

export default async function NewTrainingPage() {
  const session = await requireRole("lecturer");
  const supabase = await createClient();
  const universityId = session.universityId!;

  const learnerRows = await readOr(
    supabase
      .from("memberships")
      .select("user_id,profiles(first_name,last_name,email)")
      .eq("university_id", universityId)
      .eq("role", "student")
      .is("deleted_at", null)
      .then(({ data }: { data: any[] | null }) => data || []) as Promise<any[]>,
    [] as any[],
  );

  const learners = learnerRows.map((row: any) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      id: row.user_id,
      label: [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || profile?.email || "Learner",
    };
  });

  const teamRows = await readOr(
    supabase
      .from("departments")
      .select("id,name")
      .eq("university_id", universityId)
      .then(({ data }: { data: any[] | null }) => data || []) as Promise<any[]>,
    [] as any[],
  );

  return (
    <GenericList title="New training" description="One form. It builds everything behind it." icon={Wand2}>
      <Link
        href="/admin/trainings"
        className="inline-flex w-fit items-center gap-2 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft size={15} /> All trainings
      </Link>
      <TrainingBuilder learners={learners} teams={teamRows.map((row: any) => ({ id: row.id, label: row.name }))} />
    </GenericList>
  );
}
