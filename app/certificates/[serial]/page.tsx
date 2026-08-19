import { CertificateService } from "@/lib/services/certificate.service";
import { createAdminClient } from "@/lib/supabase/admin";
import { BadgeCheck, ShieldAlert, ShieldX } from "lucide-react";

export const dynamic = "force-dynamic";

/**
 * Public verification. Whoever checks a certificate — an employer, a regulator —
 * has no account here, so this reads through the service role and exposes only
 * the frozen snapshot, never the learner's record.
 */
export default async function CertificatePage({ params }: { params: Promise<{ serial: string }> }) {
  const { serial } = await params;
  const result = await new CertificateService(createAdminClient() as any).verify(serial);

  if (!result.found) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
        <ShieldX className="h-12 w-12 text-red-400" aria-hidden />
        <h1 className="font-outfit text-2xl font-semibold text-ink">No certificate with that serial</h1>
        <p className="text-sm text-ink-muted">
          Check the serial exactly as printed. Serials look like ABCD-EFGH-JKLM.
        </p>
      </main>
    );
  }

  const { certificate, valid } = result;
  const snapshot = (certificate.snapshot || {}) as Record<string, string>;

  return (
    <main className="mx-auto max-w-3xl px-6 py-16 print:py-0">
      <div
        className={`rounded-[32px] border p-10 text-center print:border-slate-300 ${
          valid ? "border-emerald-500/30 bg-emerald-500/[0.04]" : "border-red-500/30 bg-red-500/[0.04]"
        }`}
      >
        {valid ? (
          <BadgeCheck className="mx-auto h-14 w-14 text-emerald-400" aria-hidden />
        ) : (
          <ShieldAlert className="mx-auto h-14 w-14 text-red-400" aria-hidden />
        )}

        <p className="mt-6 text-xs uppercase tracking-[0.3em] text-ink-muted">
          {snapshot.organisationName || "Certificate of completion"}
        </p>

        <h1 className="mt-4 font-outfit text-3xl font-semibold text-ink print:text-slate-900">
          {snapshot.studentName || "Learner"}
        </h1>

        <p className="mt-3 text-sm text-ink-muted">has completed</p>

        <p className="mt-2 font-outfit text-xl font-medium text-ink print:text-slate-900">
          {snapshot.courseTitle || "Course"}
          {snapshot.courseCode ? <span className="text-ink-subtle"> ({snapshot.courseCode})</span> : null}
        </p>

        <dl className="mt-8 grid gap-3 text-sm text-ink-muted sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-wider text-ink-subtle">Issued</dt>
            <dd className="text-ink">{new Date(certificate.issued_at).toLocaleDateString()}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-ink-subtle">Lessons</dt>
            <dd className="text-ink">
              {certificate.lessons_completed} of {certificate.lessons_total}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-ink-subtle">Serial</dt>
            <dd className="font-mono text-ink">{certificate.serial}</dd>
          </div>
        </dl>

        {valid ? (
          <p className="mt-8 text-sm font-medium text-emerald-300">This certificate is valid.</p>
        ) : (
          <p className="mt-8 text-sm font-medium text-red-300">
            This certificate was revoked
            {certificate.revoked_reason ? `: ${certificate.revoked_reason}` : "."}
          </p>
        )}
      </div>
    </main>
  );
}
