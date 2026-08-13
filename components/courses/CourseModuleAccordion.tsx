"use client";

import { motion } from "motion/react";
import { CourseModule } from "@/types/course";
import { ChevronDown, PlayCircle, FileText, CheckCircle2, Clock, PlusCircle } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Props {
  modules: CourseModule[];
}

export function CourseModuleAccordion({ modules }: Props) {
  const [expandedModules, setExpandedModules] = useState<string[]>([modules[1]?.id || modules[0]?.id]); // expand second module by default for demo
  const params = useParams();

  const toggleModule = (id: string) => {
    setExpandedModules(prev => 
      prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-4">
      {modules.map((module, mIdx) => {
        const isExpanded = expandedModules.includes(module.id);
        const completedCount = module.lessons.filter(l => l.isCompleted).length;
        const isModuleCompleted = completedCount === module.lessons.length && module.lessons.length > 0;

        return (
          <motion.div 
            key={module.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: mIdx * 0.1 }}
            className={`glass-panel overflow-hidden border transition-all duration-300 rounded-[20px] ${
              isExpanded ? "border-blue-500/30 shadow-[0_0_30px_rgba(37,99,235,0.1)]" : "border-white/5 hover:border-white/10"
            }`}
          >
            {/* Header */}
            <button 
              onClick={() => toggleModule(module.id)}
              className={`w-full p-6 flex items-start sm:items-center justify-between gap-4 text-left transition-colors ${
                isExpanded ? "bg-slate-900/60" : "hover:bg-white/[0.02]"
              }`}
            >
              <div className="flex-1 pr-4">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className={`font-outfit text-xl font-semibold ${isExpanded ? "text-blue-400" : "text-slate-100"}`}>
                    {module.title}
                  </h3>
                  {isModuleCompleted && <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />}
                </div>
                {module.description && (
                  <p className="text-sm text-slate-400 line-clamp-2 max-w-2xl">{module.description}</p>
                )}
              </div>
              
              <div className="flex items-center gap-6 shrink-0 mt-1 sm:mt-0">
                <span className="hidden sm:inline-block text-sm font-medium text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-white/5">
                  {completedCount}/{module.lessons.length}
                </span>
                <div className={`p-2 rounded-full transition-transform duration-300 ${isExpanded ? "bg-blue-500/10 text-blue-400 rotate-180" : "bg-white/5 text-slate-400"}`}>
                  <ChevronDown size={20} />
                </div>
              </div>
            </button>

            {/* Content */}
            {isExpanded && (
              <div className="border-t border-white/5 bg-slate-950/40">
                <div className="flex flex-col">
                  {module.lessons.map((lesson, lIdx) => (
                    <Link 
                      href={`/student/courses/${params.courseId}/lessons/${lesson.id}`}
                      key={lesson.id} 
                      className={`p-4 pl-6 sm:pl-10 flex items-center justify-between gap-4 hover:bg-white/[0.03] transition-colors border-l-2 ${
                        lesson.isCompleted ? "border-emerald-500/50" : "border-transparent hover:border-blue-500/50"
                      } ${lIdx !== module.lessons.length - 1 ? 'border-b border-white/5' : ''}`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`shrink-0 ${lesson.isCompleted ? "text-emerald-400" : "text-slate-500"}`}>
                          {lesson.type === 'video' || lesson.type === 'live_recording' ? <PlayCircle size={20} /> : 
                           lesson.type === 'reading' ? <FileText size={20} /> : <CheckCircle2 size={20} />}
                        </div>
                        <div className="flex flex-col">
                          <span className={`font-medium text-sm sm:text-base ${lesson.isCompleted ? "text-slate-300" : "text-slate-200"}`}>
                            {lesson.title}
                          </span>
                          <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Clock size={12}/> {lesson.duration}</span>
                        </div>
                      </div>
                      
                      {lesson.type === 'live_recording' && (
                        <span className="hidden sm:inline-block px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          Recording
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
