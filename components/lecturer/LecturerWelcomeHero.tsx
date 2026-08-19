"use client";

import { motion } from "motion/react";
import { DashboardStats } from "@/types/lecturer";
import { Users, CheckCircle, HelpCircle, TrendingUp } from "lucide-react";

interface Props {
  stats: DashboardStats;
}

export function LecturerWelcomeHero({ stats }: Props) {
  return (
    <div className="relative rounded-[32px] overflow-hidden panel border border-line mb-8">
      <div className="absolute inset-0 bg-surface z-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-soft blur-[120px] rounded-full translate-x-1/3 -translate-y-1/3 z-0"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary-soft blur-[100px] rounded-full -translate-x-1/3 translate-y-1/3 z-0"></div>
      </div>

      <div className="relative z-10 p-8 md:p-12">
        <div className="max-w-2xl mb-8">
           <h1 className="font-outfit text-4xl md:text-5xl font-bold text-ink tracking-tight mb-4 text-balance">
             Welcome back, Dr. Jenkins
           </h1>
           <p className="text-lg text-ink-muted">
             You have 2 classes scheduled for today and 45 assignments pending your review.
           </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
           <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="panel p-5 rounded-2xl flex items-center gap-4 bg-surface border border-line">
              <div className="p-3 bg-primary-soft text-primary rounded-xl"><Users size={20} /></div>
              <div>
                 <p className="text-xs text-ink-muted font-medium uppercase tracking-wider mb-0.5">Students</p>
                 <h4 className="font-outfit text-2xl font-bold text-ink">{stats.totalStudents}</h4>
              </div>
           </motion.div>
           
           <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="panel p-5 rounded-2xl flex items-center gap-4 bg-surface border border-line">
              <div className="p-3 bg-emerald-500/10 text-success rounded-xl"><TrendingUp size={20} /></div>
              <div>
                 <p className="text-xs text-ink-muted font-medium uppercase tracking-wider mb-0.5">Attendance</p>
                 <h4 className="font-outfit text-2xl font-bold text-ink">{stats.averageAttendance}%</h4>
              </div>
           </motion.div>

           <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="panel p-5 rounded-2xl flex items-center gap-4 bg-surface border-l border-t border-b border-r-0 lg:border-r border-orange-500/30 lg:border-line relative overflow-hidden group">
              <div className="absolute inset-0 bg-orange-500/5 group-hover:bg-orange-500/10 transition-colors"></div>
              <div className="p-3 bg-orange-500/10 text-orange-400 rounded-xl relative z-10"><CheckCircle size={20} /></div>
              <div className="relative z-10">
                 <p className="text-xs text-ink-muted font-medium uppercase tracking-wider mb-0.5">To Grade</p>
                 <h4 className="font-outfit text-2xl font-bold text-orange-400">{stats.assignmentsToGrade}</h4>
              </div>
           </motion.div>

           <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="panel p-5 rounded-2xl flex items-center gap-4 bg-surface border border-line">
              <div className="p-3 bg-primary-soft text-primary rounded-xl"><HelpCircle size={20} /></div>
              <div>
                 <p className="text-xs text-ink-muted font-medium uppercase tracking-wider mb-0.5">Questions</p>
                 <h4 className="font-outfit text-2xl font-bold text-ink">{stats.unansweredQuestions}</h4>
              </div>
           </motion.div>
        </div>
      </div>
    </div>
  );
}
