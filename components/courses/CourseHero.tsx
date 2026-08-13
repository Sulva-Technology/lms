"use client";

import { motion } from "motion/react";
import { CourseDetail } from "@/types/course";
import { Award, BookOpen, Clock, FileText, Target, PlayCircle, PlusCircle, UserCircle2 } from "lucide-react";
import Image from "next/image";

interface Props {
  course: CourseDetail;
}

export function CourseHero({ course }: Props) {
  return (
    <div className="relative rounded-[32px] overflow-hidden glass-panel border border-white/5 mb-8">
      {/* Background with gradient */}
      <div className="absolute inset-0 bg-slate-900 z-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full translate-x-1/3 -translate-y-1/3 z-0"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-600/20 blur-[100px] rounded-full -translate-x-1/3 translate-y-1/3 z-0"></div>
        {/* Cover Image blend */}
        <div className="absolute inset-0 z-0 opacity-20 mix-blend-overlay">
          <Image 
            src={`https://picsum.photos/seed/${course.imageSeed}/1200/400`} 
            alt="Course Cover" 
            fill 
            className="object-cover" 
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row gap-8 items-start md:items-end w-full">
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3">
             <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-bold font-outfit uppercase tracking-widest">{course.code}</span>
             <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-medium">{course.semester}</span>
             <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-medium">{course.credits} Credits</span>
          </div>
          
          <h1 className="font-outfit text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight text-balance">
            {course.title}
          </h1>
          
          <p className="text-lg text-slate-300 max-w-2xl leading-relaxed">
            {course.description}
          </p>
          
          <div className="flex flex-wrap items-center gap-6 pt-4">
            <div className="flex items-center gap-3 bg-slate-900/60 p-2 pr-4 rounded-full border border-white/5 w-fit">
               <Image 
                 src={course.lecturer.avatarUrl} 
                 alt={course.lecturer.name} 
                 width={40} 
                 height={40} 
                 className="rounded-full border border-white/10"
                 referrerPolicy="no-referrer"
               />
               <div>
                  <p className="text-sm font-medium text-white">{course.lecturer.name}</p>
                  <p className="text-xs text-slate-400">{course.lecturer.title}</p>
               </div>
            </div>
          </div>
        </div>

        <div className="w-full md:w-[320px] shrink-0 space-y-4">
           <div className="glass-panel p-6 rounded-2xl border border-white/10 relative overflow-hidden bg-slate-900/40 backdrop-blur-xl">
             <h3 className="font-outfit font-semibold text-lg text-white mb-4">Course Progress</h3>
             <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-bold text-blue-400 font-outfit">{course.progress}%</span>
                <span className="text-sm text-slate-400">completed</span>
             </div>
             
             <div className="relative h-2.5 w-full bg-slate-800 rounded-full overflow-hidden mb-6">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${course.progress}%` }}
                  transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
                  className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-blue-600 to-purple-500"
                >
                   <div className="absolute inset-0 w-1/2 bg-white/20 blur-[2px] rounded-full translate-x-full"></div>
                </motion.div>
             </div>
             
             <button className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                <PlayCircle size={18} /> Continue Learning
             </button>
           </div>
        </div>
      </div>
    </div>
  );
}
