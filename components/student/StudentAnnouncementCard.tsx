"use client";

import { motion } from "motion/react";
import { Announcement } from "@/types/student";
import { Bell } from "lucide-react";

interface Props {
  announcement: Announcement;
}

export function StudentAnnouncementCard({ announcement }: Props) {
  return (
    <div className={`p-4 rounded-xl border-l-4 bg-slate-900/40 relative overflow-hidden group hover:bg-slate-800/40 transition-colors cursor-pointer ${announcement.isUnread ? 'border-blue-500' : 'border-slate-800'}`}>
      <div className="flex gap-4">
        <div className={`mt-1 rounded-full p-2 h-fit ${announcement.isUnread ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-800 text-slate-500'}`}>
          <Bell size={16} />
        </div>
        <div>
          <div className="flex items-center justify-between gap-4 mb-1">
             <h4 className={`font-medium ${announcement.isUnread ? 'text-slate-100' : 'text-slate-300'}`}>{announcement.title}</h4>
             <span className="text-[10px] text-slate-500 whitespace-nowrap">{announcement.date}</span>
          </div>
          <p className="text-xs text-slate-400 mb-2">{announcement.course}</p>
          <p className="text-sm text-slate-400 line-clamp-2">{announcement.excerpt}</p>
        </div>
      </div>
    </div>
  )
}
