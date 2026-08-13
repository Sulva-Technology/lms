"use client";

import { motion } from "motion/react";
import { CourseStat } from "@/types/course";
import * as Icons from "lucide-react";

interface Props {
  stats: CourseStat[];
}

export function CourseStatsGrid({ stats }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, i) => {
        // @ts-ignore - dynamic icon loading
        const Icon = Icons[stat.icon] || Icons.Circle;
        
        return (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="glass-panel p-5 rounded-2xl flex items-center gap-4 hover:bg-white/[0.03] transition-colors border border-white/5"
          >
            <div className={`p-3 rounded-xl border ${
              i === 0 ? "bg-blue-500/10 border-blue-500/20 text-blue-400" :
              i === 1 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
              i === 2 ? "bg-purple-500/10 border-purple-500/20 text-purple-400" :
              "bg-orange-500/10 border-orange-500/20 text-orange-400"
            }`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">{stat.label}</p>
              <h4 className="font-outfit font-semibold text-xl text-white">{stat.value}</h4>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
