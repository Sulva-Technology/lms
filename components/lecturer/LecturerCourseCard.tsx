"use client";

import { motion } from "motion/react";
import { AssignedCourse } from "@/types/lecturer";
import Link from "next/link";
import Image from "next/image";
import { Users, Clock, Settings, BookPlus } from "lucide-react";

interface Props {
  course: AssignedCourse;
  delay?: number;
}

export function LecturerCourseCard({ course, delay = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -4 }}
      className="glass-panel rounded-2xl border border-white/5 overflow-hidden group hover:border-indigo-500/30 transition-all flex flex-col"
    >
      <div className="h-24 relative w-full overflow-hidden">
        <div className="absolute inset-0 bg-slate-900/60 z-10 mix-blend-multiply transition-colors group-hover:bg-slate-900/40"></div>
        <Image src={`https://picsum.photos/seed/${course.imageSeed}/400/200`} alt={course.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute top-4 left-4 z-20">
           <span className="px-2 py-1 rounded bg-indigo-500/80 backdrop-blur text-white text-xs font-bold font-outfit">{course.code}</span>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-outfit font-semibold text-lg text-slate-100 mb-1 group-hover:text-indigo-400 transition-colors line-clamp-1">{course.title}</h3>
        
        <div className="flex items-center gap-4 text-xs text-slate-400 mt-2 mb-4">
           <span className="flex items-center gap-1.5"><Users size={14} /> {course.enrolledStudents} enrolled</span>
           {course.nextClassTime && (
              <span className="flex items-center gap-1.5"><Clock size={14} /> Next: {course.nextClassTime.split(',')[0]}</span>
           )}
        </div>

        <div className="mt-auto grid grid-cols-2 gap-2 pt-4 border-t border-white/5">
           <Link href={`/lecturer/courses/${course.id}`} className="flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors">
              <BookPlus size={14} /> Edit Content
           </Link>
           <Link href={`/lecturer/courses/${course.id}`} className="flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors">
              <Settings size={14} /> Settings
           </Link>
        </div>
      </div>
    </motion.div>
  );
}
