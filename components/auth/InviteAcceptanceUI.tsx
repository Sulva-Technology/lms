"use client"

import { motion } from "motion/react"
import { Mail, ArrowRight, ShieldCheck } from "lucide-react"
import Link from "next/link"

export function InviteAcceptanceUI() {
  return (
    <div className="space-y-6 text-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mx-auto w-20 h-20 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center mb-6"
      >
        <Mail className="text-blue-400 w-10 h-10" />
      </motion.div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold font-outfit text-white tracking-tight">Check your invitation link</h2>
        <p className="text-slate-400">
          VUI LMS invitations are verified through Supabase magic links. Once verified, your assigned role and university are applied automatically.
        </p>
      </div>

      <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-5 text-left flex items-center gap-4 mt-6">
        <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl text-blue-300">
          <ShieldCheck size={24} />
        </div>
        <div>
          <p className="text-sm text-slate-400">Secure setup</p>
          <p className="font-medium text-white">Role and tenant cannot be changed from the browser.</p>
        </div>
      </div>

      <Link
        href="/onboarding/profile"
        className="w-full py-4 px-4 mt-8 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:shadow-[0_0_25px_rgba(37,99,235,0.6)] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
      >
        Continue Setup
        <ArrowRight size={18} />
      </Link>
    </div>
  )
}
