"use client";

import { motion } from "motion/react";
import { Assignment } from "@/types/student";
import { AlertCircle, CheckCircle } from "lucide-react";

interface Props {
  assignment: Assignment;
  idx: number;
}

export function AssignmentDueCard({ assignment, idx }: Props) {
  const urgencyStyles = {
    high: "bg-red-500/10 text-red-400 border-red-500/20",
    medium: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    low: "bg-slate-500/10 text-ink-muted border-slate-500/20",
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: idx * 0.1 }}
      className="p-4 rounded-2xl panel flex flex-col gap-2 hover:bg-ink/[0.06] transition-colors cursor-pointer group border border-line hover:border-line"
    >
      <div className="flex justify-between items-start">
        <h4 className="font-medium text-ink group-hover:text-ink transition-colors">{assignment.title}</h4>
        <span className={`text-xs px-2.5 py-1 rounded-md font-medium border flex items-center gap-1.5 whitespace-nowrap ${urgencyStyles[assignment.urgency]}`}>
          {assignment.urgency === 'high' && <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span></span>}
          {assignment.dueDate}
        </span>
      </div>
      <p className="text-xs text-ink-muted flex justify-between items-center">
        <span>{assignment.course}</span>
        <button className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 hover:text-emerald-400"><CheckCircle size={14} /> Mark Done</button>
      </p>
    </motion.div>
  )
}
