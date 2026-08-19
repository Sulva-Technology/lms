"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { markNotificationAsRead } from "@/app/actions/notifications";

export function NotificationReadButton({ id, isRead }: { id: string; isRead: boolean }) {
  const [read, setRead] = useState(isRead);
  const [pending, startTransition] = useTransition();

  if (read) return <span className="text-xs text-ink-subtle">Read</span>;

  return (
    <button
      onClick={() => startTransition(async () => {
        const result = await markNotificationAsRead(id);
        if (result.success) setRead(true);
      })}
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-60"
    >
      {pending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
      Mark read
    </button>
  );
}
