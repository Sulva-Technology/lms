"use client";

import { motion } from "motion/react";
import { Announcement } from "@/types/student";
import { Bell } from "lucide-react";

interface Props {
  announcement: Announcement;
}

export function StudentAnnouncementCard({ announcement }: Props) {
  return (
    <div className={`p-4 rounded-xl border-l-4 bg-surface relative overflow-hidden group hover:bg-surface/40 transition-colors cursor-pointer ${announcement.isUnread ? 'border-primary' : 'border-line'}`}>
      <div className="flex gap-4">
        <div className={`mt-1 rounded-full p-2 h-fit ${announcement.isUnread ? 'bg-primary-soft text-primary' : 'bg-surface text-ink-subtle'}`}>
          <Bell size={16} />
        </div>
        <div>
          <div className="flex items-center justify-between gap-4 mb-1">
             <h4 className={`font-medium ${announcement.isUnread ? 'text-ink' : 'text-ink-muted'}`}>{announcement.title}</h4>
             <span className="text-[10px] text-ink-subtle whitespace-nowrap">{announcement.date}</span>
          </div>
          <p className="text-xs text-ink-muted mb-2">{announcement.course}</p>
          <p className="text-sm text-ink-muted line-clamp-2">{announcement.excerpt}</p>
        </div>
      </div>
    </div>
  )
}
