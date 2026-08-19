import { CancelAssignmentButton } from "@/components/training/CancelAssignmentButton";
import { DataTable } from "@/components/ui/data-table";
import type { ComplianceRow, ExpiringRow } from "@/lib/services/compliance.service";

type Overview = {
  totals: {
    active: number;
    overdue: number;
    dueSoon: number;
    completed: number;
    expiring: number;
    /** Null when nothing is assigned: there is no rate to report yet. */
    compliantPercent: number | null;
  };
  overdue: ComplianceRow[];
  dueSoon: ComplianceRow[];
  expiring: ExpiringRow[];
};

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString() : "No deadline";

function Tile({
  label,
  value,
  caption,
  tone,
}: {
  label: string;
  value: string | number;
  caption: string;
  tone?: string;
}) {
  return (
    <div className="panel rounded-card p-5">
      <p className="text-sm font-medium text-ink-muted">{label}</p>
      <p className={`mt-3 font-display text-3xl font-semibold tabular-nums ${tone ?? "text-ink"}`}>
        {value}
      </p>
      <p className="mt-1.5 text-xs text-ink-subtle">{caption}</p>
    </div>
  );
}

/** Sections share one shape so the page reads as a list, not a pile of cards. */
function Section({
  title,
  description,
  count,
  empty,
  children,
}: {
  title: string;
  description?: string;
  count: number;
  empty: string;
  children: React.ReactNode;
}) {
  return (
    <section className="panel overflow-hidden rounded-card">
      <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
        <div>
          <h2 className="font-display text-base font-semibold text-ink">{title}</h2>
          {description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}
        </div>
        <span className="shrink-0 rounded-pill bg-status-soft px-2.5 py-1 text-xs font-semibold tabular-nums text-ink-muted">
          {count}
        </span>
      </div>

      {count === 0 ? (
        // An empty section says so on one line. A full-height empty-state card
        // inside a card was three borders deep to tell you nothing happened.
        <p className="px-5 py-6 text-sm text-ink-subtle">{empty}</p>
      ) : (
        <div className="p-5">{children}</div>
      )}
    </section>
  );
}

export function ComplianceTable({ overview }: { overview: Overview }) {
  const { compliantPercent, overdue, dueSoon, expiring, active, completed } = overview.totals;

  return (
    <div className="grid gap-5">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Tile
          label="Compliant"
          value={compliantPercent === null ? "—" : `${compliantPercent}%`}
          caption={
            compliantPercent === null
              ? "No training assigned yet"
              : `${completed} of ${active} assignments complete`
          }
          tone={compliantPercent === null ? "text-ink-subtle" : "text-success"}
        />
        <Tile
          label="Overdue"
          value={overdue}
          caption={overdue === 0 ? "Nothing past its deadline" : "Past the deadline"}
          tone={overdue === 0 ? "text-ink" : "text-danger"}
        />
        <Tile
          label="Due soon"
          value={dueSoon}
          caption="Within the next fortnight"
          tone={dueSoon === 0 ? "text-ink" : "text-warn"}
        />
        <Tile
          label="Expiring"
          value={expiring}
          caption="Certificates lapsing in 30 days"
          tone={expiring === 0 ? "text-ink" : "text-warn"}
        />
      </div>

      <Section
        title="Overdue"
        count={overview.overdue.length}
        empty="Nobody is overdue."
      >
        <DataTable
          data={overview.overdue}
          keyExtractor={(row) => row.assignmentId}
          columns={[
            {
              key: "who",
              header: "Person",
              cell: (row) => <span className="font-medium text-ink">{row.studentName}</span>,
            },
            { key: "course", header: "Training", cell: (row) => row.courseTitle },
            { key: "cohort", header: "Cohort", cell: (row) => row.cohortName },
            {
              key: "due",
              header: "Was due",
              cell: (row) => <span className="text-danger">{formatDate(row.dueOn)}</span>,
            },
            {
              key: "actions",
              header: "",
              align: "right",
              cell: (row) => <CancelAssignmentButton assignmentId={row.assignmentId} />,
            },
          ]}
        />
      </Section>

      <Section
        title="Due soon"
        count={overview.dueSoon.length}
        empty="No deadline falls inside the next fortnight."
      >
        <DataTable
          data={overview.dueSoon}
          keyExtractor={(row) => row.assignmentId}
          columns={[
            {
              key: "who",
              header: "Person",
              cell: (row) => <span className="font-medium text-ink">{row.studentName}</span>,
            },
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
      </Section>

      <Section
        title="Expiring certificates"
        description="Valid today, but not for much longer. Assign the training again to renew them."
        count={overview.expiring.length}
        empty="No certificate lapses in the next thirty days."
      >
        <DataTable
          data={overview.expiring}
          keyExtractor={(row) => row.certificateId}
          columns={[
            {
              key: "who",
              header: "Person",
              cell: (row) => <span className="font-medium text-ink">{row.studentName}</span>,
            },
            { key: "course", header: "Training", cell: (row) => row.courseTitle },
            {
              key: "serial",
              header: "Serial",
              cell: (row) => <span className="font-mono text-xs">{row.serial}</span>,
            },
            {
              key: "expires",
              header: "Expires",
              cell: (row) => <span className="text-warn">{formatDate(row.expiresAt)}</span>,
            },
          ]}
        />
      </Section>
    </div>
  );
}
