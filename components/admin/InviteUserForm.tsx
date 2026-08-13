"use client"

import * as React from "react"
import { motion } from "motion/react"
import { Loader2, MailPlus, Send, CheckCircle2, AlertCircle } from "lucide-react"
import { inviteUserAction } from "@/app/actions/admin/users"
import { AuthRole } from "@/types/auth"
import { roleLabels } from "@/lib/auth/roles"

interface InviteUserFormProps {
  defaultRole?: AuthRole
  allowedRoles?: AuthRole[]
  universityId?: string | null
}

export function InviteUserForm({
  defaultRole = "student",
  allowedRoles = ["student", "lecturer", "department_admin", "admin"],
  universityId,
}: InviteUserFormProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [success, setSuccess] = React.useState("")

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setSuccess("")
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)
    const result = await inviteUserAction({
      email: formData.get("email"),
      role: formData.get("role"),
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      universityId: formData.get("universityId") || universityId,
    })

    setIsLoading(false)

    if (!result.success) {
      setError(result.error)
      return
    }

    setSuccess(`Invite sent to ${result.data.email}`)
    event.currentTarget.reset()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-950/60 backdrop-blur-2xl border border-white/10 rounded-[32px] p-6 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.45)]"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-300 flex items-center justify-center">
          <MailPlus size={22} />
        </div>
        <div>
          <h2 className="font-outfit text-xl font-semibold text-white">Invite user</h2>
          <p className="text-sm text-slate-400">Secure role and tenant metadata are attached server-side.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        <input type="hidden" name="universityId" value={universityId || ""} />
        <input
          name="firstName"
          placeholder="First name"
          className="bg-slate-900/70 border border-slate-700/70 rounded-xl px-3 py-3 text-sm text-white outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20"
        />
        <input
          name="lastName"
          placeholder="Last name"
          className="bg-slate-900/70 border border-slate-700/70 rounded-xl px-3 py-3 text-sm text-white outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20"
        />
        <input
          name="email"
          type="email"
          required
          placeholder="user@university.edu"
          className="bg-slate-900/70 border border-slate-700/70 rounded-xl px-3 py-3 text-sm text-white outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20"
        />
        <select
          name="role"
          defaultValue={defaultRole}
          className="bg-slate-900/70 border border-slate-700/70 rounded-xl px-3 py-3 text-sm text-white outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20"
        >
          {allowedRoles.map((role) => (
            <option key={role} value={role}>{roleLabels[role]}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold px-4 py-3 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          {isLoading ? <Loader2 size={18} className="animate-spin" /> : <><Send size={16} /> Send</>}
        </button>
      </form>

      {(error || success) && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-4 rounded-xl border px-4 py-3 text-sm flex items-center gap-2 ${
            error
              ? "border-red-500/20 bg-red-500/10 text-red-300"
              : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
          }`}
        >
          {error ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          {error || success}
        </motion.div>
      )}
    </motion.div>
  )
}
