"use client";

import { motion } from "motion/react";
import { LiveClass } from "@/types/student";
import { Video, Clock, User } from "lucide-react";
import Image from "next/image";

interface Props {
  liveClass: LiveClass;
  idx: number;
}

export function UpcomingLiveClassCard({ liveClass, idx }: Props) {
  const themeColors = {
    blue: "from-blue-500/20 to-indigo-500/5 border-primary/25 text-primary",
    purple: "from-purple-500/20 to-fuchsia-500/5 border-purple-500/30 text-purple-400",
    orange: "from-orange-500/20 to-amber-500/5 border-orange-500/30 text-orange-400",
    emerald: "from-emerald-500/20 to-teal-500/5 border-emerald-500/30 text-emerald-400",
  }
  const colorMode = liveClass.theme || "blue";
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: idx * 0.1 }}
      className={`relative overflow-hidden rounded-2xl panel p-5 border cursor-pointer hover:bg-ink/[0.06] transition-colors group ${themeColors[colorMode].split(' ')[1]}`}
    >
      <div className={`absolute top-0 right-0 w-32 h-32 blur-[40px] -mt-10 -mr-10 bg-gradient-to-br ${themeColors[colorMode].split(' ')[0]}`}></div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold border ${themeColors[colorMode]}`}>
            Live class
          </span>
          <span className="text-xs text-ink-muted font-medium">{liveClass.course}</span>
        </div>
        
        <h4 className="font-outfit font-semibold text-lg text-ink mb-4 group-hover:text-ink transition-colors">{liveClass.title}</h4>
        
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-2">
            {liveClass.instructorAvatar ? (
               <Image src={liveClass.instructorAvatar} alt={liveClass.instructor} width={24} height={24} className="rounded-full" />
            ) : (
               <div className="w-6 h-6 rounded-full bg-surface flex items-center justify-center"><User size={12} className="text-ink-muted" /></div>
            )}
            <span className="text-sm text-ink-muted">{liveClass.instructor}</span>
          </div>
          <div className="flex items-center gap-1.5 text-ink-muted text-sm font-medium">
             <Clock size={14} className={themeColors[colorMode].split(' ')[2]} />
             <span>{liveClass.startTime}</span>
             <span className="text-ink-subtle text-xs ml-1">({liveClass.duration})</span>
          </div>
        </div>
      </div>
      
      {/* Live Badge Pulse */}
      {idx === 0 && (
         <div className="absolute top-5 right-5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
         </div>
      )}
    </motion.div>
  )
}
