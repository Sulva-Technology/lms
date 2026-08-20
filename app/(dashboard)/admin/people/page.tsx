import { GenericList } from "@/components/academic/GenericList";
import { InviteUserForm } from "@/components/admin/InviteUserForm";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/guards";
import { readOr } from "@/lib/safe-read";
import { createClient } from "@/lib/supabase/server";
import { deriveStatus } from "@/lib/services/training-assignment.service";
import { Users } from "lucide-react";

const ROLE_LABEL: Record<string, string> = {
  admin: "Owner",
  department_admin: "Team lead",
  lecturer: "Trainer",
  student: "Learner",
};

export default async function PeoplePage() {
  const session = await requireRole("admin");
  const supabase = await createClient();
  const universityId = session.universityId!;

  const members = await readOr(
    supabase
      .from("memberships")
      .select("user_id,role,department_id,profiles(first_name,last_name,email),departments(name)")
      .eq("university_id", universityId)
      .is("deleted_at", null)
      .then(({ data }: { data: any[] | null }) => data || []) as Promise<any[]>,
    [] as any[],
  );

  const assignments = await readOr(
    supabase
      .from("training_assignments")
      .select("student_id,due_on,completed_at,cancelled_at")
      .eq("university_id", universityId)
      .then(({ data }: { data: any[] | null }) => data || []) as Promise<any[]>,
    [] as any[],
  );

  const one = (value: any) => (Array.isArray(value) ? value[0] : value);

  const people = members.map((row: any) => {
    const profile = one(row.profiles);
    const mine = assignments.filter((a: any) => a.student_id === row.user_id && !a.cancelled_at);

    return {
      id: row.user_id,
      name:
        [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || profile?.email || "Person",
      email: profile?.email || "",
      role: ROLE_LABEL[row.role] || row.role,
      team: one(row.departments)?.name || "—",
      outstanding: mine.filter((a: any) => !a.completed_at).length,
      overdue: mine.filter((a: any) => deriveStatus(a) === "overdue").length,
    };
  });

  return (
    <GenericList
      title="People"
      description="Everyone in your organisation, and what they still owe."
      icon={Users}
    >
      <InviteUserForm
        defaultRole="student"
        allowedRoles={["student", "lecturer", "department_admin", "admin"]}
        universityId={universityId}
      />

      {people.length === 0 ? (
        <EmptyState title="Nobody yet" description="Invite someone above and they will appear here." />
      ) : (
        <DataTable
          data={people}
          keyExtractor={(person) => person.id}
          columns={[
            { key: "name", header: "Name", cell: (p) => <span className="font-medium text-ink">{p.name}</span> },
            { key: "email", header: "Email", cell: (p) => <span className="text-ink-muted">{p.email}</span> },
            { key: "role", header: "Role", cell: (p) => p.role },
            { key: "team", header: "Team", cell: (p) => p.team },
            {
              key: "outstanding",
              header: "Outstanding",
              cell: (p) =>
                p.overdue > 0 ? (
                  <span className="text-warning">
                    {p.outstanding} ({p.overdue} overdue)
                  </span>
                ) : (
                  p.outstanding
                ),
            },
          ]}
        />
      )}
    </GenericList>
  );
}
