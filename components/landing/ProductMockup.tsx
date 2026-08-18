"use client"

import * as React from "react"
import { motion } from "motion/react"
import { BookOpen, CalendarDays, GraduationCap, LayoutDashboard, Users } from "lucide-react"

const NAV = [
  { icon: LayoutDashboard, label: "Overview", active: true },
  { icon: BookOpen, label: "Courses" },
  { icon: CalendarDays, label: "Live classes" },
  { icon: Users, label: "People" },
  { icon: GraduationCap, label: "Results" },
]

const COURSES = [
  { title: "Organic Chemistry II", meta: "Mon · 09:00 · Hall B", progress: 82 },
  { title: "Thermodynamics", meta: "Tue · 11:30 · Online", progress: 64 },
  { title: "Research Methods", meta: "Thu · 14:00 · Lab 4", progress: 38 },
]

/**
 * A drawn impression of the product, not a screenshot: it stays in the token
 * layer, so it wears each school's colour like the rest of the page does.
 */
export function ProductMockup() {
  return (
    <section className="px-5 pb-24 sm:px-8 sm:pb-32">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto max-w-5xl"
      >
        <div className="panel overflow-hidden rounded-panel">
          <div className="flex items-center gap-2 border-b border-line bg-canvas-sunken px-5 py-3.5">
            <span className="size-2.5 rounded-full bg-line-strong" aria-hidden />
            <span className="size-2.5 rounded-full bg-line-strong" aria-hidden />
            <span className="size-2.5 rounded-full bg-line-strong" aria-hidden />
            <span className="ml-3 truncate rounded-pill bg-canvas px-3 py-1 text-xs text-ink-subtle">
              your-school.example.edu
            </span>
          </div>

          <div className="grid sm:grid-cols-[13rem_1fr]">
            <aside className="hidden border-r border-line bg-canvas-sunken/60 p-4 sm:block">
              <ul className="space-y-1">
                {NAV.map(({ icon: Icon, label, active }) => (
                  <li key={label}>
                    <span
                      className={
                        active
                          ? "flex items-center gap-3 rounded-[10px] bg-primary-soft px-3 py-2.5 text-sm font-medium text-primary-soft-contrast"
                          : "flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm text-ink-muted"
                      }
                    >
                      <Icon size={16} />
                      {label}
                    </span>
                  </li>
                ))}
              </ul>
            </aside>

            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="eyebrow">Semester overview</p>
                  <p className="mt-2 font-display text-2xl font-semibold text-ink">Good morning, Ada</p>
                </div>
                <span className="rounded-pill bg-secondary-soft px-3 py-1 text-xs font-semibold text-secondary-soft-contrast">
                  3 classes today
                </span>
              </div>

              <div className="mt-7 space-y-3">
                {COURSES.map((course, index) => (
                  <motion.div
                    key={course.title}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: 0.15 + index * 0.08 }}
                    className="rounded-card border border-line bg-surface px-4 py-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">{course.title}</p>
                        <p className="mt-1 text-xs text-ink-subtle">{course.meta}</p>
                      </div>
                      <span className="text-sm font-semibold tabular-nums text-ink-muted">
                        {course.progress}%
                      </span>
                    </div>
                    <div className="mt-3 h-1 overflow-hidden rounded-pill bg-status-soft">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${course.progress}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.9, delay: 0.3 + index * 0.08, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full rounded-pill bg-primary"
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
