"use client";

import { CourseOption } from "@/types/registration";

export function getMissingPrerequisites(course: CourseOption, completedCourses: string[]): string[] {
  return course.prerequisites.filter(prereq => !completedCourses.includes(prereq));
}

export function getConflicts(course: CourseOption, selectedCourses: CourseOption[]): CourseOption[] {
  return selectedCourses.filter(selected => {
    if (selected.id === course.id) return false;
    return course.conflictTimes.some(time => selected.conflictTimes.includes(time));
  });
}
