"use client";

import { PendingGrading } from "@/types/lecturer";
import { CheckCircle, Clock } from "lucide-react";

interface Props {
  grading: PendingGrading;
}

export function PendingGradingCard({ grading }: Props) {
  const isHigh = grading.urgency === 'high';
  
  return (
    <div className="panel p-4 rounded-xl border border-line hover:border-line transition-colors flex items-start gap-4 group cursor-pointer">
      <div className={`p-2.5 rounded-lg border shrink-0 ${isHigh ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-primary-soft border-primary/25 text-primary'}`}>
         <CheckCircle size={20} />
      </div>
      <div className="flex-1 pr-2">
         <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wide text-ink-subtle">{grading.course}</span>
            {isHigh && (
              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest bg-orange-500/20 text-orange-400 border border-orange-500/20">Urgent</span>
            )}
         </div>
         <h4 className="font-medium text-sm text-ink group-hover:text-primary transition-colors line-clamp-1">{grading.assignmentTitle}</h4>
         <p className="text-xs text-ink-subtle mt-1 flex items-center gap-1"><Clock size={12}/> Due {grading.dueDate}</p>
      </div>
      <div className="shrink-0 flex items-center justify-center bg-surface rounded-lg h-full w-12 border border-line group-hover:bg-slate-700 transition-colors">
         <span className="font-outfit font-semibold text-ink-muted">{grading.submissionsCount}</span>
      </div>
    </div>
  );
}
