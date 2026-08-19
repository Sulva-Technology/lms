import { CancelAssignmentButton } from "@/components/training/CancelAssignmentButton";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import type { ComplianceRow, ExpiringRow } from "@/lib/services/compliance.service";

type Overview = {
  totals: {
    active: number;
    overdue: number;
    dueSoon: number;
    completed: number;
    expiring: number;
    compliantPercent: number;
  };
  overdue: ComplianceRow[];
  dueSoon: ComplianceRow[];
  expiring: ExpiringRow[];
};

const formatDate = (value: string | null) => (value ? new Date(value).toLocaleDateString() : "No deadline");

export function ComplianceTable({ overview }: { overview: Overview }) {
  const tiles = [
    { label: "Compliant", value: `${overview.totals.compliantPercent}%`, tone: "text-emerald-300" },
    { label: "Overdue", value: overview.totals.overdue, tone: "text-amber-300" },
    { label: "Due soon", value: overview.totals.dueSoon, tone: "text-blue-300" },
    { label: "Expiring", value: overview.totals.expiring, tone: "text-violet-300" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-[24px] border border-white/10 bg-slate-950/60 p-5">
            <p className="text-sm text-slate-400">{tile.label}</p>
            <p className={`mt-2 font-outfit text-3xl font-semibold ${tile.tone}`}>{tile.value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-[24px] border border-white/10 bg-slate-950/60 p-5">
        <h2 className="mb-3 font-outfit text-lg font-semibold text-white">Overdue</h2>
        {overview.overdue.length === 0 ? (
          <EmptyState title="Nobody is overdue" description="Every assigned deadline has been met so far." />
        ) : (
          <DataTable
            data={overview.overdue}
            keyExtractor={(row) => row.assignmentId}
            columns={[
              { key: "who", header: "Person", cell: (row) => <span className="font-medium text-white">{row.studentName}</span> },
              { key: "course", header: "Training", cell: (row) => row.courseTitle },
              { key: "cohort", header: "Cohort", cell: (row) => row.cohortName },
              { key: "due", header: "Was due", cell: (row) => <span className="text-amber-300">{formatDate(row.dueOn)}</span> },
              {
                key: "actions",
                header: "",
                align: "right",
                cell: (row) => <CancelAssignmentButton assignmentId={row.assignmentId} />,
              },
            ]}
          />
        )}
      </section>

      <section className="rounded-[24px] border border-white/10 bg-slate-950/60 p-5">
        <h2 className="mb-3 font-outfit text-lg font-semibold text-white">Due soon</h2>
        {overview.dueSoon.length === 0 ? (
          <EmptyState title="Nothing due soon" description="No deadline falls inside the next fortnight." />
        ) : (
          <DataTable
            data={overview.dueSoon}
            keyExtractor={(row) => row.assignmentId}
            columns={[
              { key: "who", header: "Person", cell: (row) => <span className="font-medium text-white">{row.studentName}</span> },
              { key: "course", header: "Training", cell: (row) => row.courseTitle },
              { key: "due", header: "Due", cell: (row) => formatDate(row.dueOn) },
              {
                key: "actions",
                header: "",
                align: "right",
                cell: (row) => <CancelAssignmentButton assignmentId={row.assignmentId} />,
              },
            ]}
          />
        )}
      </section>

      <section className="rounded-[24px] border border-white/10 bg-slate-950/60 p-5">
        <h2 className="mb-1 font-outfit text-lg font-semibold text-white">Expiring certificates</h2>
        <p className="mb-3 text-sm text-slate-400">
          Valid today, but not for much longer. Assign the training again to renew them.
        </p>
        {overview.expiring.length === 0 ? (
          <EmptyState title="Nothing expiring" description="No certificate lapses in the next thirty days." />
        ) : (
          <DataTable
            data={overview.expiring}
            keyExtractor={(row) => row.certificateId}
            columns={[
              { key: "who", header: "Person", cell: (row) => <span className="font-medium text-white">{row.studentName}</span> },
              { key: "course", header: "Training", cell: (row) => row.courseTitle },
              { key: "serial", header: "Serial", cell: (row) => <span className="font-mono text-xs">{row.serial}</span> },
              { key: "expires", header: "Expires", cell: (row) => <span className="text-violet-300">{formatDate(row.expiresAt)}</span> },
            ]}
          />
        )}
      </section>
    </div>
  );
}
