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
        <h2 className="font-outfit text-3xl font-semibold text-ink">Review Registration</h2>
        <p className="text-ink-muted">Please review your selected courses before final submission.</p>
      </div>

      <RegistrationWarnings 
        selectedCourses={selectedCourses} 
        config={config}
        conflicts={conflicts}
        missingPrereqs={missingPrereqs}
      />

      <div className="panel rounded-[24px] overflow-hidden border border-line">
        <div className="px-6 py-4 bg-surface/50 border-b border-line flex justify-between items-center text-sm font-medium">
           <span className="text-ink-muted">Selected Courses ({selectedCourses.length})</span>
           <span className="text-primary">{currentCredits} Total Credits</span>
        </div>
        <div className="divide-y divide-line">
          {selectedCourses.map(course => (
            <div key={course.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-ink/[0.06] transition-colors">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-surface text-ink-muted border border-line">{course.code}</span>
                  <h4 className="font-medium text-ink">{course.title}</h4>
                </div>
                <p className="text-xs text-ink-muted">{course.instructor} • {course.schedule}</p>
              </div>
              <div className="flex items-center gap-3">
                 <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded border ${course.type === 'compulsory' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                   {course.type}
                 </span>
                 <span className="text-sm font-bold text-ink-muted w-16 text-right">{course.credits} cr</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-surface border border-line rounded-[24px] p-6 flex items-start gap-4">
        <div className="p-3 bg-primary-soft rounded-xl text-primary shrink-0">
          <ShieldCheck size={24} />
        </div>
        <div>
          <h4 className="font-medium text-ink mb-1">Academic Integrity Acknowledgment</h4>
          <p className="text-sm text-ink-muted leading-relaxed">By submitting this registration, I confirm that these course selections satisfy my degree requirements and I agree to abide by the university's academic regulations and scheduling policies.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-line">
        <button 
          onClick={onBack}
          disabled={isSubmitting}
          className="px-6 py-4 rounded-xl border border-line bg-status-soft hover:bg-ink/[0.06] text-ink-muted font-medium transition-colors disabled:opacity-50"
        >
          Back to Electives
        </button>
        <button 
          onClick={handleSubmit}
          disabled={!isValid || isSubmitting}
          className="flex-1 px-6 py-4 rounded-xl bg-primary hover:bg-primary-hover text-primary-contrast font-semibold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.4)] disabled:opacity-50 disabled:shadow-none disabled:hover:bg-primary-hover transition-all active:scale-[0.98] disabled:active:scale-100"
        >
          {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <FileSignature size={20} />}
          {isSubmitting ? "Submitting Registration..." : "Sign & Submit Registration"}
        </button>
      </div>
    </motion.div>
  );
}
