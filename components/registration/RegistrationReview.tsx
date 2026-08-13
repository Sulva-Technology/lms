"use client";

import { motion } from "motion/react";
import { CourseOption, RegistrationConfig } from "@/types/registration";
import { RegistrationWarnings } from "./RegistrationWarnings";
import { FileSignature, ShieldCheck, Loader2 } from "lucide-react";
import { useState } from "react";

interface Props {
  selectedCourses: CourseOption[];
  config: RegistrationConfig;
  conflicts: { [id: string]: string };
  missingPrereqs: { [id: string]: string };
  onBack: () => void;
  onSubmit: () => void;
}

export function RegistrationReview({ selectedCourses, config, conflicts, missingPrereqs, onBack, onSubmit }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const currentCredits = selectedCourses.reduce((sum, course) => sum + course.credits, 0);
  const isValid = 
    currentCredits >= config.minCredits && 
    currentCredits <= config.maxCredits && 
    Object.keys(missingPrereqs).length === 0 &&
    Object.keys(conflicts).length === 0;

  const handleSubmit = () => {
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      onSubmit();
    }, 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-8"
    >
      <div className="text-center space-y-2 mb-8">
        <h2 className="font-outfit text-3xl font-semibold text-white">Review Registration</h2>
        <p className="text-slate-400">Please review your selected courses before final submission.</p>
      </div>

      <RegistrationWarnings 
        selectedCourses={selectedCourses} 
        config={config}
        conflicts={conflicts}
        missingPrereqs={missingPrereqs}
      />

      <div className="glass-panel rounded-[24px] overflow-hidden border border-white/5">
        <div className="px-6 py-4 bg-slate-800/50 border-b border-white/5 flex justify-between items-center text-sm font-medium">
           <span className="text-slate-300">Selected Courses ({selectedCourses.length})</span>
           <span className="text-blue-400">{currentCredits} Total Credits</span>
        </div>
        <div className="divide-y divide-white/5">
          {selectedCourses.map(course => (
            <div key={course.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/10">{course.code}</span>
                  <h4 className="font-medium text-slate-200">{course.title}</h4>
                </div>
                <p className="text-xs text-slate-400">{course.instructor} • {course.schedule}</p>
              </div>
              <div className="flex items-center gap-3">
                 <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded border ${course.type === 'compulsory' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                   {course.type}
                 </span>
                 <span className="text-sm font-bold text-slate-300 w-16 text-right">{course.credits} cr</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-[24px] p-6 flex items-start gap-4">
        <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 shrink-0">
          <ShieldCheck size={24} />
        </div>
        <div>
          <h4 className="font-medium text-slate-200 mb-1">Academic Integrity Acknowledgment</h4>
          <p className="text-sm text-slate-400 leading-relaxed">By submitting this registration, I confirm that these course selections satisfy my degree requirements and I agree to abide by the university's academic regulations and scheduling policies.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-white/5">
        <button 
          onClick={onBack}
          disabled={isSubmitting}
          className="px-6 py-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-slate-300 font-medium transition-colors disabled:opacity-50"
        >
          Back to Electives
        </button>
        <button 
          onClick={handleSubmit}
          disabled={!isValid || isSubmitting}
          className="flex-1 px-6 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.4)] disabled:opacity-50 disabled:shadow-none disabled:hover:bg-blue-600 transition-all active:scale-[0.98] disabled:active:scale-100"
        >
          {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <FileSignature size={20} />}
          {isSubmitting ? "Submitting Registration..." : "Sign & Submit Registration"}
        </button>
      </div>
    </motion.div>
  );
}
