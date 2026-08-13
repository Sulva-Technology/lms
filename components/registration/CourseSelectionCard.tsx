"use client";

import { motion } from "motion/react";
import { CourseOption } from "@/types/registration";
import { PlusCircle, MinusCircle, Clock, User, BookOpen, AlertCircle } from "lucide-react";

interface Props {
  course: CourseOption;
  isSelected: boolean;
  onToggle: (id: string) => void;
  isCompulsory?: boolean;
  conflict?: string;
  prereqWarning?: string;
}

export function CourseSelectionCard({ course, isSelected, onToggle, isCompulsory, conflict, prereqWarning }: Props) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={!isCompulsory ? { y: -2, scale: 1.01 } : {}}
      onClick={() => !isCompulsory && onToggle(course.id)}
      className={`relative p-5 rounded-[24px] border transition-all cursor-${isCompulsory ? 'default' : 'pointer'} ${
        isSelected
          ? "bg-blue-600/10 border-blue-500/50 shadow-glow-blue"
          : "glass-panel hover:bg-white/[0.04] border-white/10"
      } ${conflict || prereqWarning ? "ring-1 ring-red-500/50" : ""}`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${
            isCompulsory ? "bg-purple-500/10 border-purple-500/20 text-purple-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
          }`}>
            {course.code}
          </span>
          <span className="bg-slate-800/80 text-slate-300 text-xs font-medium px-2.5 py-1 rounded-lg">
            {course.credits} Credits
          </span>
        </div>
        
        {!isCompulsory && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onToggle(course.id);
            }} 
            className={`transition-colors ${isSelected ? "text-red-400 hover:text-red-300" : "text-blue-400 hover:text-blue-300"}`}
          >
            {isSelected ? <MinusCircle size={24} /> : <PlusCircle size={24} />}
          </button>
        )}
        {isCompulsory && (
          <span className="text-xs font-medium text-slate-500 px-2.5 py-1 rounded-lg bg-white/5">
            Required
          </span>
        )}
      </div>

      <h3 className={`font-outfit text-xl font-semibold mb-2 ${isSelected ? "text-blue-100" : "text-white"}`}>
        {course.title}
      </h3>
      <p className="text-sm text-slate-400 mb-4 line-clamp-2">
        {course.description}
      </p>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm text-slate-300">
        <div className="flex items-center gap-1.5 bg-slate-900/50 px-3 py-1.5 rounded-lg w-fit">
          <User size={14} className="text-blue-400" />
          <span className="truncate max-w-[120px]">{course.instructor}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-900/50 px-3 py-1.5 rounded-lg w-fit">
          <Clock size={14} className="text-purple-400" />
          <span className="truncate max-w-[150px]">{course.schedule}</span>
        </div>
      </div>

      {(conflict || prereqWarning) && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2 text-sm text-red-200">
          <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
          <div>
            {prereqWarning && <p>{prereqWarning}</p>}
            {conflict && <p>{conflict}</p>}
          </div>
        </div>
      )}
    </motion.div>
  );
}
