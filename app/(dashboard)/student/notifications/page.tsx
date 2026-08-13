import { markAllNotificationsAsRead } from "@/app/actions/notifications";
import { GenericList } from "@/components/academic/GenericList";
import { NotificationReadButton } from "@/components/student/NotificationActions";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/guards";
import { readOr } from "@/lib/safe-read";
import { StudentReadService } from "@/lib/services/completion-read.service";
import { createClient } from "@/lib/supabase/server";
import { BellRing } from "lucide-react";
import Link from "next/link";

export default async function StudentNotificationsPage() {
  const session = await requireRole("student");
  const service = new StudentReadService((await createClient()) as any);
  const notifications = await readOr(service.getNotifications(session.user.id), []);

  async function markAll() {
    "use server";
    await markAllNotificationsAsRead();
  }

  return (
    <GenericList title="Notifications" description="Actionable alerts across courses, registration, and grading." icon={BellRing}>
      <form action={markAll}>
        <button className="w-fit rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/10">Mark all as read</button>
      </form>
      {notifications.length === 0 ? (
        <EmptyState title="No notifications" description="You are all caught up." />
      ) : (
        <DataTable
          data={notifications}
          keyExtractor={(item: any) => item.id}
          columns={[
            { key: "title", header: "Notification", cell: (item: any) => <span className={item.is_read ? "text-slate-300" : "font-medium text-white"}>{item.title}</span> },
            { key: "type", header: "Type", cell: (item: any) => <span className="capitalize">{item.type}</span> },
            { key: "date", header: "Date", cell: (item: any) => new Date(item.created_at).toLocaleString() },
            { key: "action", header: "Action", cell: (item: any) => (
              <div className="flex items-center gap-3">
                {item.link_url ? <Link className="text-blue-300 hover:text-blue-200" href={item.link_url}>Open</Link> : null}
                <NotificationReadButton id={item.id} isRead={item.is_read} />
              </div>
            ) },
          ]}
        />
      )}
    </GenericList>
  );
}
