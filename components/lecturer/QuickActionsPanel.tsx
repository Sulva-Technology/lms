"use client";

import { motion } from "motion/react";
import { PlusCircle, FileText, Video, Bell } from "lucide-react";
import Link from "next/link";

export function QuickActionsPanel() {
  const actions = [
    { label: "New Module", icon: PlusCircle, href: "/lecturer/courses", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { label: "Schedule Class", icon: Video, href: "/lecturer/live-classes", color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
    { label: "Create Quiz", icon: FileText, href: "/lecturer/quizzes", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
    { label: "Announcement", icon: Bell, href: "/lecturer/announcements", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" }
  ];

  return (
    <div className="glass-panel p-6 rounded-2xl border border-white/5">
      <h3 className="font-outfit font-semibold text-lg text-white mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
         {actions.map((action, i) => {
            const Icon = action.icon;
            return (
              <Link 
                key={i} 
                href={action.href}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-white/5 hover:bg-white/[0.03] transition-colors group text-center gap-2"
              >
                 <div className={`p-2.5 rounded-lg ${action.bg} ${action.color} border ${action.border} transition-transform group-hover:scale-110`}>
                   <Icon size={20} />
                 </div>
                 <span className="text-xs font-medium text-slate-300">{action.label}</span>
              </Link>
            )
         })}
      </div>
    </div>
  );
}
