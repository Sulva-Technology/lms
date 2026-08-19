"use client";

import { motion } from "motion/react";
import { BookOpen } from "lucide-react";

interface Props {
  currentCredits: number;
  minCredits: number;
  maxCredits: number;
}

export function CreditUnitSummary({ currentCredits, minCredits, maxCredits }: Props) {
  const percentage = Math.min(100, Math.max(0, (currentCredits / maxCredits) * 100));
  
  let statusColor = "bg-primary";
  let statusText = "bg-primary-soft text-primary border-primary/25";
  
  if (currentCredits < minCredits) {
    statusColor = "bg-orange-500";
    statusText = "bg-orange-500/10 text-orange-400 border-orange-500/20";
  } else if (currentCredits > maxCredits) {
    statusColor = "bg-red-500";
    statusText = "bg-red-500/10 text-red-400 border-red-500/20";
  } else {
    statusColor = "bg-emerald-500";
    statusText = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  }

  return (
    <div className="panel p-5 rounded-[24px] sticky top-24 z-10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-outfit font-semibold text-lg flex items-center gap-2 text-ink">
          <BookOpen className="text-primary" size={20} />
          Credit Units
        </h3>
        <div className={`px-3 py-1 rounded-full border text-xs font-bold ${statusText}`}>
          {currentCredits} / {maxCredits} max
        </div>
      </div>
      
      <div className="relative h-3 w-full bg-surface rounded-full overflow-hidden mb-2">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ type: "spring", stiffness: 50, damping: 15 }}
          className={`absolute top-0 left-0 h-full rounded-full ${statusColor} transition-colors duration-300`}
        >
          <div className="absolute inset-0 bg-status-soft w-1/2 rounded-full blur-[2px] right-0 translate-x-1/2"></div>
        </motion.div>
        
        {/* Min threshold marker */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-status-soft z-10" 
          style={{ left: `${(minCredits / maxCredits) * 100}%` }}
          title={`Min required: ${minCredits}`}
        ></div>
      </div>
      
      <div className="flex justify-between text-xs font-medium text-ink-muted">
        <span>Min: {minCredits}</span>
        {currentCredits < minCredits && (
          <span className="text-orange-400">Need {minCredits - currentCredits} more</span>
        )}
        {currentCredits > maxCredits && (
          <span className="text-red-400">Over limit by {currentCredits - maxCredits}</span>
        )}
      </div>
    </div>
  );
}
