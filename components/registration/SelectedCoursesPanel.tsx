"use client";

import { motion } from "motion/react";
import { CourseOption } from "@/types/registration";
import { CheckCircle2, Clock, MapPin, Search } from "lucide-react";

interface Props {
  selectedCourses: CourseOption[];
}

export function SelectedCoursesPanel({ selectedCourses }: Props) {
  if (selectedCourses.length === 0) {
    return (
      <div className="panel p-8 rounded-[24px] flex flex-col items-center justify-center text-center h-48 border border-line border-dashed">
        <Search size={32} className="text-ink-subtle mb-4" />
        <p className="text-ink-muted">No courses selected yet.</p>
      </div>
    );
  }

  return (
    <div className="panel p-6 rounded-[24px]">
      <h3 className="font-outfit font-semibold text-lg mb-4 text-ink">Your Schedule Snapshot</h3>
      <div className="space-y-3 max-h-[300px] overflow-y-auto lg:max-h-none custom-scrollbar pr-2">
        {selectedCourses.map(course => (
          <div key={course.id} className="bg-surface p-3 rounded-xl border border-line flex flex-col gap-2 relative overflow-hidden group">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-xl"></div>
            <div className="flex justify-between items-start pl-2">
              <h4 className="font-medium text-sm text-ink line-clamp-1 flex-1">{course.code}: {course.title}</h4>
              <span className="text-xs font-bold text-primary bg-primary-soft px-2 py-0.5 rounded ml-2">{course.credits}cr</span>
            </div>
            <div className="flex items-center gap-3 pl-2 text-xs text-ink-muted">
              <span className="flex items-center gap-1"><Clock size={12}/> {course.schedule.split(' ')[0]} {course.schedule.split(' ')[1]}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
