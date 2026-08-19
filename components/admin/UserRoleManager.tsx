"use client";

import * as React from "react";
import { Loader2, Save } from "lucide-react";
import { updateUserRoleAction } from "@/app/actions/admin/users";
import { DataTable } from "@/components/ui/data-table";
import { roleLabels } from "@/lib/auth/roles";
import type { AuthRole } from "@/types/auth";

export type ManagedUser = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  role: AuthRole;
  created_at: string;
};

/**
 * A department admin manages their own university's roster. Granting
 * super_admin is a platform-level action and is not offered here; the action
 * also refuses cross-university edits server-side.
 */
const ASSIGNABLE_ROLES: AuthRole[] = ["student", "lecturer", "department_admin", "admin"];

export function UserRoleManager({ users, currentUserId }: { users: ManagedUser[]; currentUserId: string }) {
  const [rows, setRows] = React.useState(users);
  const [drafts, setDrafts] = React.useState<Record<string, AuthRole>>({});
  const [savingId, setSavingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [, startTransition] = React.useTransition();

  function save(user: ManagedUser) {
    const nextRole = drafts[user.id];
    if (!nextRole || nextRole === user.role) return;

    setError("");
    setMessage("");
    setSavingId(user.id);

    startTransition(async () => {
      const result = await updateUserRoleAction(user.id, { role: nextRole });
      setSavingId(null);

      if (!result.success) {
        setError(result.error || "Could not update the role.");
        return;
      }

      setRows((current) => current.map((row) => (row.id === user.id ? { ...row, role: nextRole } : row)));
      setDrafts((current) => {
        const next = { ...current };
        delete next[user.id];
        return next;
      });
      setMessage(`Role updated for ${user.email || user.first_name || "user"}.`);
    });
  }

  return (
    <div className="space-y-4">
      {(message || error) && (
        <div
          className={
            error
              ? "rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
              : "rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
          }
        >
          {error || message}
        </div>
      )}

      <DataTable
        data={rows}
        keyExtractor={(item) => item.id}
        columns={[
          {
            key: "name",
            header: "Name",
            cell: (item) => (
              <span className="font-medium text-ink">
                {[item.first_name, item.last_name].filter(Boolean).join(" ") || "Unnamed user"}
              </span>
            ),
          },
          { key: "email", header: "Email", cell: (item) => item.email || "No email" },
          {
            key: "role",
            header: "Role",
            cell: (item) =>
              item.id === currentUserId || item.role === "super_admin" ? (
                <span className="text-ink-muted">{roleLabels[item.role] || item.role}</span>
              ) : (
                <select
                  value={drafts[item.id] ?? item.role}
                  onChange={(event) =>
                    setDrafts((current) => ({ ...current, [item.id]: event.target.value as AuthRole }))
                  }
                  className="rounded-lg border border-line bg-surface px-3 py-2 text-xs text-ink outline-none focus:border-primary"
                >
                  {ASSIGNABLE_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {roleLabels[role] || role}
                    </option>
                  ))}
                </select>
              ),
          },
          { key: "joined", header: "Created", cell: (item) => new Date(item.created_at).toLocaleDateString() },
          {
            key: "actions",
            header: "",
            align: "right",
            cell: (item) => {
              const dirty = Boolean(drafts[item.id] && drafts[item.id] !== item.role);
              if (item.id === currentUserId || item.role === "super_admin") {
                return <span className="text-xs text-ink-subtle">—</span>;
              }
              return (
                <button
                  onClick={() => save(item)}
                  disabled={!dirty || savingId === item.id}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-contrast hover:bg-primary-hover disabled:opacity-40"
                >
                  {savingId === item.id ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  Save
                </button>
              );
            },
          },
        ]}
      />
    </div>
  );
}
