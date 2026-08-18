"use client"

import * as React from "react"
import { motion } from "motion/react"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import Link from "next/link"

export function VerificationSuccessUI() {
  return (
    <div className="space-y-6">
      <motion.span
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 18 }}
        className="grid size-14 place-items-center rounded-card bg-success/10 text-success"
      >
        <CheckCircle2 size={28} />
      </motion.span>

      <div>
        <h2 className="font-display text-2xl font-semibold text-ink">Email verified</h2>
        <p className="mt-2.5 text-sm leading-relaxed text-ink-muted">
          Your account is confirmed. Sign in to reach your courses, classes and results.
        </p>
      </div>

      <Link
        href="/login"
        className="flex w-full items-center justify-center gap-2 rounded-card bg-primary px-4 py-3 text-sm font-semibold text-primary-contrast transition-[background-color,transform] hover:bg-primary-hover active:scale-[0.99]"
      >
        Continue to sign in
        <ArrowRight size={17} />
      </Link>
    </div>
  )
}
