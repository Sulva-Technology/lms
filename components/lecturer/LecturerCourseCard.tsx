"use client";

import { motion } from "motion/react";
import { AssignedCourse } from "@/types/lecturer";
import Link from "next/link";
import Image from "next/image";
import { Users, Clock, Settings, BookPlus } from "lucide-react";
import { gradientFor } from "@/lib/ui/identity";

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
      className="panel rounded-2xl border border-line overflow-hidden group hover:border-primary/25 transition-all flex flex-col"
    >
      <div className="h-24 relative w-full overflow-hidden">
        <div className="absolute inset-0 bg-surface z-10 mix-blend-multiply transition-colors group-hover:bg-surface"></div>
        {course.thumbnailUrl ? (
          <Image src={course.thumbnailUrl} alt={course.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
        ) : (
          <div className="h-full w-full" style={{ background: gradientFor(course.code || course.title) }} />
        )}
        <div className="absolute top-4 left-4 z-20">
           <span className="px-2 py-1 rounded bg-primary-soft backdrop-blur text-ink text-xs font-bold font-outfit">{course.code}</span>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-outfit font-semibold text-lg text-ink mb-1 group-hover:text-primary transition-colors line-clamp-1">{course.title}</h3>
        
        <div className="flex items-center gap-4 text-xs text-ink-muted mt-2 mb-4">
           <span className="flex items-center gap-1.5"><Users size={14} /> {course.enrolledStudents} enrolled</span>
           {course.nextClassTime && (
              <span className="flex items-center gap-1.5"><Clock size={14} /> Next: {course.nextClassTime.split(',')[0]}</span>
           )}
        </div>

        <div className="mt-auto grid grid-cols-2 gap-2 pt-4 border-t border-line">
           <Link href={`/lecturer/courses/${course.id}`} className="flex items-center justify-center gap-2 py-2 rounded-lg bg-surface hover:bg-slate-700 text-ink text-xs font-medium transition-colors">
              <BookPlus size={14} /> Edit Content
           </Link>
           <Link href={`/lecturer/courses/${course.id}`} className="flex items-center justify-center gap-2 py-2 rounded-lg bg-surface hover:bg-slate-700 text-ink text-xs font-medium transition-colors">
              <Settings size={14} /> Settings
           </Link>
        </div>
      </div>
    </motion.div>
  );
}
