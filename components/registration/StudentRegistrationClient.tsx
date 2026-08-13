"use client"

import * as React from "react"
import { motion } from "motion/react"
import { AlertCircle, CheckCircle2, Loader2, Lock, Plus, Send } from "lucide-react"
import { submitCourseRegistrationAction } from "@/app/actions/course-registration"

interface RegistrationCourse {
  id: string
  code: string
  title: string
  credits: number
  description?: string
}

interface StudentRegistrationClientProps {
  semesterId?: string | null
  minCredits?: number
  maxCredits?: number
  existingStatus?: string | null
  existingCourseIds?: string[]
  courses: RegistrationCourse[]
}

export function StudentRegistrationClient({
  semesterId,
  minCredits = 0,
  maxCredits = 24,
  existingStatus,
  existingCourseIds = [],
  courses,
}: StudentRegistrationClientProps) {
  const [selected, setSelected] = React.useState<string[]>(existingCourseIds)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState("")
  const [success, setSuccess] = React.useState("")

  const selectedCourses = courses.filter((course) => selected.includes(course.id))
  const credits = selectedCourses.reduce((sum, course) => sum + course.credits, 0)
  const isLocked = existingStatus === "pending" || existingStatus === "approved"

  const toggle = (id: string) => {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  const submit = async () => {
    setError("")
    setSuccess("")

    if (!semesterId) {
      setError("No active semester is available for registration.")
      return
    }

    if (selected.length === 0) {
      setError("Select at least one course.")
      return
    }

    if (credits < minCredits || credits > maxCredits) {
      setError(`Your selected credit load must be between ${minCredits} and ${maxCredits}.`)
      return
    }

    setIsSubmitting(true)
    const result = await submitCourseRegistrationAction({ semesterId, courseSectionIds: selected })
    setIsSubmitting(false)

    if (result?.error) {
      setError(result.error)
      return
    }

    setSuccess("Registration submitted for approval.")
  }

  if (isLocked) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center">
        <div className="mx-auto w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(16,185,129,0.16)]">
          <CheckCircle2 size={42} className="text-emerald-300" />
        </div>
        <h1 className="font-outfit text-4xl font-semibold text-white mb-3">Registration {existingStatus}</h1>
        <p className="text-slate-400 max-w-xl mx-auto">Your current course registration is locked while it is reviewed by your academic team.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-8">
      <section className="space-y-4">
        {courses.length === 0 ? (
          <div className="bg-slate-950/60 backdrop-blur-2xl border border-white/10 rounded-[32px] p-10 text-center text-slate-400">
            No courses are available for the active registration window.
          </div>
        ) : courses.map((course, index) => {
          const active = selected.includes(course.id)
          return (
            <motion.button
              key={course.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              onClick={() => toggle(course.id)}
              className={`w-full text-left rounded-2xl border p-5 transition-all ${
                active
                  ? "bg-blue-500/10 border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.12)]"
                  : "bg-slate-950/50 border-white/10 hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-outfit font-bold text-blue-300">{course.code}</span>
                    <span className="text-xs text-slate-500">{course.credits} credits</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white">{course.title}</h3>
                  {course.description && <p className="text-sm text-slate-400 mt-2 line-clamp-2">{course.description}</p>}
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border shrink-0 ${
                  active ? "bg-blue-500 border-blue-400 text-white" : "bg-white/5 border-white/10 text-slate-400"
                }`}>
                  {active ? <CheckCircle2 size={19} /> : <Plus size={19} />}
                </div>
              </div>
            </motion.button>
          )
        })}
      </section>

      <aside className="bg-slate-950/70 backdrop-blur-2xl border border-white/10 rounded-[32px] p-6 h-fit sticky top-24">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center justify-center">
            <Lock size={20} />
          </div>
          <div>
            <h2 className="font-outfit text-xl font-semibold text-white">Review</h2>
            <p className="text-sm text-slate-400">{credits} / {maxCredits} credits</p>
          </div>
        </div>

        <div className="space-y-2 mb-5">
          {selectedCourses.map((course) => (
            <div key={course.id} className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2 text-sm">
              <span className="text-slate-200">{course.code}</span>
              <span className="text-slate-500">{course.credits}</span>
            </div>
          ))}
        </div>

        {(error || success) && (
          <div className={`mb-4 rounded-xl border px-3 py-3 text-sm flex items-center gap-2 ${
            error ? "bg-red-500/10 border-red-500/20 text-red-300" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
          }`}>
            {error ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            {error || success}
          </div>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={isSubmitting || selected.length === 0}
          className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-semibold px-4 py-3 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <><Send size={16} /> Submit Registration</>}
        </button>
      </aside>
    </div>
  )
}
