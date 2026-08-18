import Link from "next/link";
import { GenericList } from "@/components/academic/GenericList";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/guards";
import { readOr } from "@/lib/safe-read";
import { createClient } from "@/lib/supabase/server";
import { Award } from "lucide-react";

export default async function StudentCertificatesPage() {
  const session = await requireRole("student");
  const supabase = await createClient();

  const certificates = await readOr(
    supabase
      .from("certificates")
      .select("id,serial,issued_at,revoked_at,revoked_reason,final_score,snapshot")
      .eq("student_id", session.user.id)
      .order("issued_at", { ascending: false })
      .then(({ data }: { data: any[] | null }) => data || []) as Promise<any[]>,
    [] as any[],
  );

  return (
    <GenericList title="Certificates" description="Certificates awarded for completed courses." icon={Award}>
      {certificates.length === 0 ? (
        <EmptyState
          title="No certificates yet"
          description="A certificate appears here once you finish a course and your trainer issues it."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {certificates.map((certificate: any) => (
            <div
              key={certificate.id}
              className="rounded-[24px] border border-white/10 bg-slate-950/60 p-5 backdrop-blur-2xl"
            >
              <p className="font-outfit text-lg font-semibold text-white">
                {certificate.snapshot?.courseTitle || "Course"}
              </p>
              <p className="mt-1 font-mono text-xs text-slate-500">{certificate.serial}</p>
              <p className="mt-2 text-sm text-slate-400">
                Issued {new Date(certificate.issued_at).toLocaleDateString()}
                {certificate.final_score !== null ? ` · ${certificate.final_score}%` : ""}
              </p>

              {certificate.revoked_at ? (
                <p className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                  Revoked{certificate.revoked_reason ? `: ${certificate.revoked_reason}` : ""}
                </p>
              ) : (
                <Link
                  href={`/certificates/${certificate.serial}`}
                  className="mt-4 inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                >
                  View and print
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </GenericList>
  );
}
