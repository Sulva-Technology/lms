"use client";

import { motion } from "motion/react";
import { RegistrationState, RegistrationConfig } from "@/types/registration";
import { CheckCircle2, Clock, AlertTriangle, PlayCircle } from "lucide-react";

interface Props {
  state: RegistrationState;
  config: RegistrationConfig;
  onStart: () => void;
}

export function RegistrationStatusCard({ state, config, onStart }: Props) {
  const configs = {
    open: {
       icon: PlayCircle,
       color: "blue",
       bg: "bg-primary-soft",
       border: "border-primary/25",
       text: "text-primary",
       title: "Registration is Open",
       description: `Select your courses for ${config.currentSemester}. Deadline is ${new Date(config.deadline).toLocaleDateString()}.`,
       action: "Start Registration"
    },
    pending: {
       icon: Clock,
       color: "orange",
       bg: "bg-orange-500/10",
       border: "border-orange-500/30",
       text: "text-orange-400",
       title: "Pending Approval",
       description: "Your registration has been submitted and is awaiting advisor approval.",
       action: "View Registration"
    },
    approved: {
       icon: CheckCircle2,
       color: "emerald",
       bg: "bg-emerald-500/10",
       border: "border-emerald-500/30",
       text: "text-emerald-400",
       title: "Registration Approved",
       description: `You are officially registered for ${config.currentSemester} classes.`,
       action: "View Schedule"
    },
    rejected: {
       icon: AlertTriangle,
       color: "red",
       bg: "bg-red-500/10",
       border: "border-red-500/30",
       text: "text-red-400",
       title: "Registration Action Required",
       description: "Your advisor has requested changes to your registration.",
       action: "Edit Registration"
    },
    closed: {
       icon: Clock,
       color: "slate",
       bg: "bg-slate-500/10",
       border: "border-slate-500/30",
       text: "text-ink-muted",
       title: "Registration Closed",
       description: `Registration for ${config.currentSemester} has ended.`,
       action: "View Schedule"
    }
  };

  const ui = configs[state];
  const Icon = ui.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`panel p-8 md:p-10 rounded-[32px] border relative overflow-hidden group ${ui.border} max-w-4xl mx-auto w-full`}
    >
      <div className={`absolute top-0 right-0 w-64 h-64 blur-[80px] -mr-20 -mt-20 ${ui.bg.replace('/10', '/20')}`}></div>
      
      <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-8">
         <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 border ${ui.bg} ${ui.border}`}>
            <Icon size={40} className={ui.text} />
         </div>
         
         <div className="flex-1">
            <div className="inline-block px-3 py-1 bg-surface border border-line font-medium text-xs rounded-full text-ink-muted mb-3">
               {config.currentSemester}
            </div>
            <h2 className="font-outfit text-3xl font-semibold text-ink mb-2">{ui.title}</h2>
            <p className="text-ink-muted text-lg mb-6">{ui.description}</p>
            
            {(state === 'open' || state === 'rejected') && (
               <button 
                  onClick={onStart}
                  className="bg-primary hover:bg-primary-hover text-primary-contrast font-medium rounded-xl px-8 py-3.5 shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:shadow-[0_0_25px_rgba(37,99,235,0.6)] active:scale-[0.98] transition-all"
               >
                 {ui.action}
               </button>
            )}
            {(state === 'pending' || state === 'approved' || state === 'closed') && (
               <button 
                 onClick={onStart}
                 className="bg-status-soft hover:bg-ink/[0.06] border border-line text-ink font-medium rounded-xl px-8 py-3.5 active:scale-[0.98] transition-all"
               >
                 {ui.action}
               </button>
            )}
         </div>
         
         <div className="hidden lg:flex flex-col gap-3 p-6 bg-surface rounded-2xl border border-line min-w-[200px]">
            <div className="text-xs uppercase tracking-wider font-bold text-ink-subtle mb-1">Registration Config</div>
            <div className="flex justify-between items-center text-sm">
               <span className="text-ink-muted">Min Credits</span>
               <span className="text-ink font-semibold">{config.minCredits}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
               <span className="text-ink-muted">Max Credits</span>
               <span className="text-ink font-semibold">{config.maxCredits}</span>
            </div>
            <div className="h-px bg-surface w-full my-1"></div>
            <div className="text-xs text-orange-400/80 font-medium">Closes {new Date(config.deadline).toLocaleDateString()}</div>
         </div>
      </div>
    </motion.div>
  );
}
