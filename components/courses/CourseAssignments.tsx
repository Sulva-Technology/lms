"use client";

import { motion } from "motion/react";
import { CourseDetail } from "@/types/course";
import { FileText, CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface Props {
  course: CourseDetail;
}

export function CourseAssignments({ course }: Props) {
  return (
    <div className="space-y-4">
      {course.assignments.map((assignment, i) => {
        const isGraded = assignment.status === 'graded';
        const isSubmitted = assignment.status === 'submitted';
        
        return (
          <motion.div
            key={assignment.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-panel p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-white/5 hover:border-white/10 transition-colors group cursor-pointer"
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl border shrink-0 ${
                isGraded ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                isSubmitted ? "bg-blue-500/10 border-blue-500/20 text-blue-400" :
                "bg-orange-500/10 border-orange-500/20 text-orange-400"
              }`}>
                {isGraded ? <CheckCircle2 size={24} /> : 
                 isSubmitted ? <CheckCircle2 size={24} /> : <FileText size={24} />}
              </div>
              <div>
                <h4 className="font-outfit font-semibold text-lg text-white mb-1 group-hover:text-blue-400 transition-colors">{assignment.title}</h4>
                <div className="flex items-center gap-3 text-sm">
                   <span className="flex items-center gap-1.5 text-slate-400">
                     <Clock size={14} /> Due: {assignment.dueDate}
                   </span>
                   {isGraded && (
                     <span className="flex items-center gap-1 text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20 text-xs">
                       Score: {assignment.score}/{assignment.maxScore}
                     </span>
                   )}
                </div>
              </div>
            </div>
            
            <button className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all shadow-sm ${
              isGraded || isSubmitted 
                ? "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-white/5" 
                : "bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.3)] border border-transparent"
            }`}>
              {isGraded ? "View Feedback" : isSubmitted ? "View Submission" : "Start Assignment"}
            </button>
          </motion.div>
        );
      })}
    </div>
  );
}
