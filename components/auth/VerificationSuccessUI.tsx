"use client"

import * as React from "react"
import { motion } from "motion/react"
import { CheckCircle2, ArrowRight } from "lucide-react"
import Link from "next/link"

export function VerificationSuccessUI() {
  return (
    <div className="text-center space-y-6 py-6">
      <motion.div 
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="flex justify-center"
      >
        <div className="w-24 h-24 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center relative shadow-[0_0_30px_rgba(16,185,129,0.2)]">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
          >
            <CheckCircle2 size={48} className="text-emerald-400" />
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-2"
      >
        <h2 className="text-3xl font-bold font-outfit text-white tracking-tight">Email Verified!</h2>
        <p className="text-slate-400 text-lg max-w-sm mx-auto leading-relaxed">
          Your account has been successfully verified. You are all set to start using VUI LMS.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="pt-6"
      >
        <Link 
          href="/login"
          className="w-full py-4 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:shadow-[0_0_25px_rgba(37,99,235,0.6)] transition-all active:scale-[0.98] inline-flex items-center justify-center gap-2"
        >
          Continue to Login
          <ArrowRight size={18} />
        </Link>
      </motion.div>
    </div>
  )
}
