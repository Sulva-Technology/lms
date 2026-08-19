import { markAllNotificationsAsRead } from "@/app/actions/notifications";
import { GenericList } from "@/components/academic/GenericList";
import { NotificationReadButton } from "@/components/student/NotificationActions";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/guards";
import { readOr } from "@/lib/safe-read";
import { createClient } from "@/lib/supabase/server";
import { BellRing } from "lucide-react";
import Link from "next/link";

/**
 * Role-agnostic notification inbox. Every role's topbar bell points here;
 * students also keep their dedicated /student/notifications entry in the
 * sidebar.
 */
export default async function NotificationsPage() {
  const session = await requireUser();
  const supabase = await createClient();

  const notifications = await readOr(
    supabase
      .from("notifications")
      .select("id,title,content,type,link_url,is_read,created_at")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }: { data: any[] | null }) => data || []) as Promise<any[]>,
    [] as any[],
  );

  async function markAll() {
    "use server";
    await markAllNotificationsAsRead();
  }

  return (
    <GenericList
      title="Notifications"
      description="Alerts across courses, submissions, grading, and registration."
      icon={BellRing}
    >
      <form action={markAll}>
        <button className="w-fit rounded-xl border border-line bg-status-soft px-4 py-2 text-sm font-medium text-ink hover:bg-ink/[0.06]">
          Mark all as read
        </button>
      </form>

      {notifications.length === 0 ? (
        <EmptyState title="No notifications" description="You are all caught up." />
      ) : (
        <DataTable
          data={notifications}
          keyExtractor={(item: any) => item.id}
          columns={[
            {
              key: "title",
              header: "Notification",
              cell: (item: any) => (
                <div>
                  <p className={item.is_read ? "text-ink-muted" : "font-medium text-ink"}>{item.title}</p>
                  {item.content && <p className="mt-0.5 text-xs text-ink-subtle">{item.content}</p>}
                </div>
              ),
            },
            { key: "type", header: "Type", cell: (item: any) => <span className="capitalize">{item.type}</span> },
            { key: "date", header: "Date", cell: (item: any) => new Date(item.created_at).toLocaleString() },
            {
              key: "action",
              header: "Action",
              cell: (item: any) => (
                <div className="flex items-center gap-3">
                  {item.link_url ? (
                    <Link className="text-primary hover:text-primary" href={item.link_url}>
                      Open
                    </Link>
                  ) : null}
                  <NotificationReadButton id={item.id} isRead={item.is_read} />
                </div>
              ),
            },
          ]}
        />
      )}
    </GenericList>
  );
}
