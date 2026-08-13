"use client"

import * as React from "react"
import { motion } from "motion/react"
import { AlertCircle, Building, Camera, CheckCircle2, GraduationCap, Loader2, ShieldCheck, Upload, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { completeOnboardingAction } from "@/app/actions/onboarding"
import { AuthRole } from "@/types/auth"
import { roleLabels } from "@/lib/auth/roles"

interface ProfileSetupFormProps {
  assignedRole: AuthRole | null
  universityName?: string | null
  email?: string | null
  initialFirstName?: string | null
  initialLastName?: string | null
  inviteError?: string | null
}

export function ProfileSetupForm({
  assignedRole,
  universityName,
  email,
  initialFirstName,
  initialLastName,
  inviteError,
}: ProfileSetupFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState(inviteError || "")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")

    if (!assignedRole) {
      setError("This invite is missing secure role metadata. Ask an administrator to resend it.")
      return
    }

    setIsLoading(true)

    try {
      const result = await completeOnboardingAction(new FormData(e.currentTarget))
      if (result?.error) {
        setError(result.error)
        setIsLoading(false)
        return
      }

      if (result?.success && result.redirectTo) {
        router.replace(result.redirectTo)
        router.refresh()
        return
      }

      setError("We could not confirm onboarding completion. Please try again.")
      setIsLoading(false)
    } catch (err) {
      setError("We could not complete onboarding. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center space-y-2 mb-8">
        <h1 className="font-outfit text-3xl md:text-4xl font-bold text-white tracking-tight">Complete your profile</h1>
        <p className="text-slate-400 text-lg">Your role and university are secured from your invitation.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-950/60 backdrop-blur-2xl border border-white/10 rounded-[24px] p-5"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-300 flex items-center justify-center">
              <ShieldCheck size={22} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Assigned role</p>
              <p className="text-white font-semibold">{assignedRole ? roleLabels[assignedRole] : "Missing invite data"}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="bg-slate-950/60 backdrop-blur-2xl border border-white/10 rounded-[24px] p-5"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center justify-center">
              <Building size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Institution</p>
              <p className="text-white font-semibold truncate">{universityName || (assignedRole === "super_admin" ? "VUI Platform" : "Pending assignment")}</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="bg-slate-950/60 backdrop-blur-2xl border border-white/10 p-6 sm:p-8 rounded-[32px] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-sm flex items-center justify-center gap-2 font-medium"
            >
              <AlertCircle size={16} />
              {error}
            </motion.div>
          )}

          <div className="flex flex-col items-center mb-8">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center overflow-hidden transition-all group-hover:border-blue-500">
                <User size={40} className="text-slate-500 group-hover:text-blue-400 transition-colors" />
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={24} className="text-white" />
              </div>
              <div className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full border-[3px] border-slate-950 flex items-center justify-center shadow-lg">
                <Upload size={14} className="text-white" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-400 mt-4">Add an avatar URL now or later in settings.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-300 ml-1" htmlFor="firstName">First Name *</label>
              <input
                id="firstName"
                type="text"
                name="firstName"
                defaultValue={initialFirstName || ""}
                required
                className="w-full bg-slate-900/70 border border-slate-700/70 text-slate-100 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 block p-3.5 transition-all outline-none"
                placeholder="Jane"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-300 ml-1" htmlFor="lastName">Last Name *</label>
              <input
                id="lastName"
                type="text"
                name="lastName"
                defaultValue={initialLastName || ""}
                required
                className="w-full bg-slate-900/70 border border-slate-700/70 text-slate-100 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 block p-3.5 transition-all outline-none"
                placeholder="Doe"
              />
            </div>
          </div>

          {email && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
              Invite email: <span className="font-medium text-white">{email}</span>
            </div>
          )}

          {assignedRole === "student" && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-300 ml-1" htmlFor="studentId">Student ID (Optional)</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <GraduationCap size={18} className="text-slate-500" />
                </div>
                <input
                  id="studentId"
                  type="text"
                  name="studentId"
                  className="w-full bg-slate-900/70 border border-slate-700/70 text-slate-100 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 block pl-10 p-3.5 transition-all outline-none"
                  placeholder="e.g. VUI/2026/0042"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300 ml-1" htmlFor="avatarUrl">Avatar URL (Optional)</label>
            <input
              id="avatarUrl"
              type="url"
              name="avatarUrl"
              className="w-full bg-slate-900/70 border border-slate-700/70 text-slate-100 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 block p-3.5 transition-all outline-none"
              placeholder="https://..."
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || Boolean(inviteError)}
            className="w-full py-4 px-4 bg-blue-600 hover:bg-blue-500 text-white text-lg font-semibold rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:shadow-[0_0_25px_rgba(37,99,235,0.6)] transition-all active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100 flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 size={24} className="animate-spin" /> : <><CheckCircle2 size={20} /> Complete Setup</>}
          </button>
        </form>
      </div>
    </div>
  )
}
