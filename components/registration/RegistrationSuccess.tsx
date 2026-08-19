"use client";

import { motion } from "motion/react";
import { CheckCircle2, FileText, ArrowRight, Clock } from "lucide-react";
import Link from "next/link";

interface Props {
  onBackToDashboard: () => void;
}

export function RegistrationSuccess({ onBackToDashboard }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto text-center space-y-8 panel p-10 rounded-[32px] border border-emerald-500/20 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] -mr-20 -mt-20"></div>
      
      <div className="relative z-10 flex flex-col items-center">
         <motion.div
           initial={{ scale: 0 }}
           animate={{ scale: 1 }}
           transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
           className="w-24 h-24 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
         >
           <CheckCircle2 size={48} className="text-emerald-400" />
         </motion.div>

         <h2 className="font-outfit text-3xl font-semibold text-ink mb-4">Registration Submitted!</h2>
         <p className="text-lg text-ink-muted mb-8">
           Your course registration for Fall 2026 has been successfully submitted and is pending advisor approval.
         </p>

         <div className="bg-surface border border-line rounded-2xl p-6 w-full text-left space-y-4 mb-8">
           <div className="flex items-center gap-4">
             <div className="p-3 bg-primary-soft rounded-xl text-primary"><Clock size={24}/></div>
             <div>
               <p className="text-sm font-medium text-ink-muted">Current Status</p>
               <p className="font-semibold text-primary">Pending Advisor Approval</p>
             </div>
           </div>
           <div className="flex items-center gap-4">
             <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400"><FileText size={24}/></div>
             <div>
               <p className="text-sm font-medium text-ink-muted">Registration ID</p>
               <p className="font-mono text-ink">REG-2026-F-8942A</p>
             </div>
           </div>
         </div>

         <div className="flex flex-col sm:flex-row gap-4 w-full">
           <Link 
             href="/student" 
             className="flex-1 px-6 py-4 rounded-xl border border-line bg-status-soft hover:bg-ink/[0.06] text-ink-muted font-medium transition-colors flex items-center justify-center"
           >
             Go to Home Dashboard
           </Link>
           <button 
             onClick={onBackToDashboard}
             className="flex-1 px-6 py-4 rounded-xl bg-primary hover:bg-primary-hover text-primary-contrast font-semibold transition-colors shadow-[0_0_15px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2"
           >
             View Registration <ArrowRight size={18} />
           </button>
         </div>
      </div>
    </motion.div>
  );
}
