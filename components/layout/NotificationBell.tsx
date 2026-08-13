"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { setupNotificationChannel } from "@/lib/realtime/channels";

/**
 * Live unread counter. The initial count is rendered on the server; Supabase
 * Realtime pushes subsequent inserts so the badge updates without a refresh.
 */
export function NotificationBell({
  userId,
  initialUnread,
  href = "/notifications",
}: {
  userId: string;
  initialUnread: number;
  href?: string;
}) {
  const [unread, setUnread] = React.useState(initialUnread);
  const pathname = usePathname();

  React.useEffect(() => {
    const supabase = createClient();
    const channel = setupNotificationChannel(supabase, userId, () => {
      setUnread((current) => current + 1);
    });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  // While the inbox itself is open the badge is redundant, so hide it there
  // rather than tracking a separate "seen" state.
  const badgeCount = pathname === href ? 0 : unread;

  return (
    <Link
      href={href}
      className="relative rounded-full p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
      aria-label={badgeCount > 0 ? `${badgeCount} unread notifications` : "Notifications"}
    >
      <Bell size={20} />
      {badgeCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {badgeCount > 9 ? "9+" : badgeCount}
        </span>
      )}
    </Link>
  );
}
