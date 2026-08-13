"use client";

import { motion } from "motion/react";
import { UpcomingLecturerClass } from "@/types/lecturer";
import { Video, Clock, Users } from "lucide-react";
import Link from "next/link";

interface Props {
  cls: UpcomingLecturerClass;
  delay?: number;
}

export function UpcomingClassCard({ cls, delay = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="glass-panel p-4 rounded-xl border border-white/5 hover:bg-white/[0.02] transition-colors group flex flex-col sm:flex-row gap-4 sm:items-center justify-between"
    >
      <div className="flex items-center gap-4">
        <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl relative shrink-0">
           <Video size={20} />
           {cls.time.includes('Today') && (
             <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border border-slate-900 translate-x-1 -translate-y-1"></div>
           )}
        </div>
        <div>
           <div className="flex items-center gap-2 mb-1">
             <span className="text-xs font-bold font-outfit text-indigo-400 px-1.5 py-0.5 rounded bg-indigo-500/10">{cls.course}</span>
             <h4 className="font-medium text-slate-200 group-hover:text-white transition-colors">{cls.title}</h4>
           </div>
           <div className="flex items-center gap-3 text-xs text-slate-500">
             <span className="flex items-center gap-1"><Clock size={12}/> {cls.time} ({cls.duration})</span>
             <span className="flex items-center gap-1"><Users size={12}/> {cls.studentCount} expects</span>
           </div>
        </div>
      </div>
      
      <Link 
        href={`/lecturer/live-classes/${cls.id}`}
        className="shrink-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors shadow-[0_0_15px_rgba(79,70,229,0.3)] text-center flex items-center justify-center gap-2"
      >
         <Video size={16} /> Enter Room
      </Link>
    </motion.div>
  );
}
