"use client";

import * as React from "react";
import { Award, Loader2, ShieldOff } from "lucide-react";
import {
  evaluateCertificatesAction,
  issueCertificateAction,
  revokeCertificateAction,
} from "@/app/actions/certificates";
import type { Eligibility } from "@/lib/services/certificate.service";

type Section = { id: string; label: string };
type Issued = {
  id: string;
  serial: string;
  student_id: string;
  course_section_id: string;
  issued_at: string;
  revoked_at: string | null;
  snapshot: Record<string, any> | null;
};

export function CertificateManager({ sections, issued }: { sections: Section[]; issued: Issued[] }) {
  const [sectionId, setSectionId] = React.useState(sections[0]?.id || "");
  const [candidates, setCandidates] = React.useState<Eligibility[]>([]);
  const [records, setRecords] = React.useState(issued);
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  const holders = new Set(
    records.filter((r) => r.course_section_id === sectionId && !r.revoked_at).map((r) => r.student_id),
  );

  function load(nextSectionId: string) {
    setSectionId(nextSectionId);
    setError("");
    setMessage("");
    startTransition(async () => {
      const result = await evaluateCertificatesAction(nextSectionId);
      if (!result.success) {
        setError(result.error || "Could not check completion.");
        return;
      }
      setCandidates(result.candidates || []);
      setLoaded(true);
    });
  }

  function issue(studentId: string) {
    setError("");
    setMessage("");
    startTransition(async () => {
      const result = await issueCertificateAction({ courseSectionId: sectionId, studentId });
      if (!result.success) {
        setError(result.error || "Could not issue the certificate.");
        return;
      }
      setRecords((current) => [result.certificate as Issued, ...current]);
      setMessage(`Certificate ${result.certificate.serial} issued.`);
    });
  }

  function revoke(certificateId: string) {
    const reason = window.prompt("Why is this certificate being revoked?");
    if (!reason) return;

    setError("");
    setMessage("");
    startTransition(async () => {
      const result = await revokeCertificateAction({ certificateId, reason });
      if (!result.success) {
        setError(result.error || "Could not revoke the certificate.");
        return;
      }
      setRecords((current) =>
        current.map((record) =>
          record.id === certificateId ? { ...record, revoked_at: new Date().toISOString() } : record,
        ),
      );
      setMessage("Certificate revoked.");
    });
  }

  return (
    <div className="space-y-5">
      <div className="panel flex flex-wrap items-center gap-3 rounded-2xl border border-line p-4">
        <select
          value={sectionId}
          onChange={(event) => load(event.target.value)}
          aria-label="Course section"
          className="rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-primary"
        >
          {sections.map((section) => (
            <option key={section.id} value={section.id}>
              {section.label}
            </option>
          ))}
        </select>
        <button
          onClick={() => load(sectionId)}
          disabled={pending || !sectionId}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-contrast hover:bg-primary-hover disabled:opacity-60"
        >
          {pending ? <Loader2 size={16} className="animate-spin" /> : <Award size={16} />}
          Check completion
        </button>
      </div>

      {(message || error) && (
        <div
          className={
            error
              ? "rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-danger"
              : "rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-success"
          }
        >
          {error || message}
        </div>
      )}

      {loaded ? (
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="mb-3 text-sm font-semibold text-ink">{candidates.length} enrolled</p>
          <ul className="grid gap-2">
            {candidates.map((candidate) => (
              <li
                key={candidate.studentId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-status-soft px-3 py-2.5"
              >
                <div className="text-sm">
                  <span className="text-ink">{candidate.studentName}</span>
                  <span className="ml-2 text-xs text-ink-subtle">
                    {candidate.lessonsCompleted}/{candidate.lessonsTotal} lessons
                    {candidate.finalScore !== null ? ` · ${candidate.finalScore}%` : ""}
                  </span>
                  {candidate.blockers.length > 0 ? (
                    <p className="mt-0.5 text-xs text-warn/80">{candidate.blockers.join(" · ")}</p>
                  ) : null}
                </div>

                {holders.has(candidate.studentId) ? (
                  <span className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-success">
                    Issued
                  </span>
                ) : (
                  <button
                    onClick={() => issue(candidate.studentId)}
                    disabled={pending || !candidate.eligible}
                    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-contrast hover:bg-primary-hover disabled:opacity-40"
                  >
                    Issue
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="rounded-2xl border border-line bg-surface p-4">
        <p className="mb-3 text-sm font-semibold text-ink">{records.length} issued certificates</p>
        {records.length === 0 ? (
          <p className="text-xs text-ink-subtle">Nothing issued yet.</p>
        ) : (
          <ul className="grid gap-2">
            {records.map((record) => (
              <li
                key={record.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-status-soft px-3 py-2.5 text-sm"
              >
                <div>
                  <span className="text-ink">{record.snapshot?.studentName || "Learner"}</span>
                  <span className="ml-2 font-mono text-xs text-ink-subtle">{record.serial}</span>
                  {record.revoked_at ? (
                    <span className="ml-2 text-xs font-semibold text-danger">Revoked</span>
                  ) : null}
                </div>
                {record.revoked_at ? null : (
                  <button
                    onClick={() => revoke(record.id)}
                    disabled={pending}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-status-soft px-3 py-1.5 text-xs font-semibold text-ink-muted hover:bg-ink/[0.06] disabled:opacity-60"
                  >
                    <ShieldOff size={13} /> Revoke
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
