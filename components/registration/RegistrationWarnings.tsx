"use client";

import { motion } from "motion/react";
import { CourseOption, RegistrationConfig } from "@/types/registration";
import { AlertCircle, AlertTriangle, CheckCircle } from "lucide-react";

interface Props {
  selectedCourses: CourseOption[];
  config: RegistrationConfig;
  conflicts: { [id: string]: string };
  missingPrereqs: { [id: string]: string };
}

export function RegistrationWarnings({ selectedCourses, config, conflicts, missingPrereqs }: Props) {
  const currentCredits = selectedCourses.reduce((sum, course) => sum + course.credits, 0);
  const hasMinCreditIssue = currentCredits < config.minCredits;
  const hasMaxCreditIssue = currentCredits > config.maxCredits;
  const hasConflicts = Object.keys(conflicts).length > 0;
  const hasPrereqs = Object.keys(missingPrereqs).length > 0;

  const totalWarnings = [hasMinCreditIssue, hasMaxCreditIssue, hasConflicts, hasPrereqs].filter(Boolean).length;

  if (totalWarnings === 0) {
    return (
      <div className="panel p-4 rounded-xl flex items-start gap-3 border border-emerald-500/30 bg-emerald-500/10">
        <CheckCircle className="text-success shrink-0 mt-0.5" size={20} />
        <div>
          <h4 className="font-semibold text-success text-sm">All Requirements Met</h4>
          <p className="text-success/80 text-xs mt-1">Your course selection satisfies all academic regulations and shows no scheduling conflicts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel p-4 rounded-xl flex items-start gap-3 border border-orange-500/30 bg-orange-500/10">
      <AlertTriangle className="text-orange-400 shrink-0 mt-0.5" size={20} />
      <div className="space-y-2 flex-1">
        <h4 className="font-semibold text-orange-300 text-sm">Action Required</h4>
        
        {hasMinCreditIssue && (
          <div className="flex items-center gap-1.5 text-xs text-orange-200 bg-orange-500/20 px-2 py-1 rounded w-fit">
            <AlertCircle size={12} /> Minimum {config.minCredits} credits required. Currently at {currentCredits}.
          </div>
        )}
        
        {hasMaxCreditIssue && (
          <div className="flex items-center gap-1.5 text-xs text-danger bg-red-500/20 border border-red-500/30 px-2 py-1 rounded w-fit">
            <AlertCircle size={12} /> Maximum {config.maxCredits} credits exceeded. Currently at {currentCredits}.
          </div>
        )}

        {hasConflicts && (
           <div className="flex flex-col gap-1.5 text-xs text-orange-200 bg-orange-500/20 px-2 py-1.5 rounded w-fit">
             <div className="flex items-center gap-1.5 font-medium"><AlertCircle size={12} /> Scheduling Conflicts:</div>
             <ul className="list-disc pl-4 space-y-0.5 text-orange-300/80">
               {Object.values(conflicts).map((conflictMsg, i) => (
                 <li key={i}>{conflictMsg}</li>
               ))}
             </ul>
           </div>
        )}

        {hasPrereqs && (
           <div className="flex flex-col gap-1.5 text-xs text-danger bg-red-500/20 px-2 py-1.5 border border-red-500/30 rounded w-fit">
             <div className="flex items-center gap-1.5 font-medium"><AlertCircle size={12} /> Missing Prerequisites:</div>
             <ul className="list-disc pl-4 space-y-0.5 text-danger/80">
               {Object.values(missingPrereqs).map((prereqMsg, i) => (
                 <li key={i}>{prereqMsg}</li>
               ))}
             </ul>
           </div>
        )}
      </div>
    </div>
  );
}
