"use client"

import * as React from "react"
import { motion } from "motion/react"
import { ArrowRight, Mail, ShieldCheck } from "lucide-react"
import Link from "next/link"

export function InviteAcceptanceUI() {
  return (
    <div className="space-y-6">
      <motion.span
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="grid size-14 place-items-center rounded-card bg-primary-soft text-primary-soft-contrast"
      >
        <Mail size={26} />
      </motion.span>

      <div>
        <h2 className="font-display text-2xl font-semibold text-ink">Check your invitation link</h2>
        <p className="mt-2.5 text-sm leading-relaxed text-ink-muted">
          Invitations are verified through a one-time email link. Once verified, the role and
          institution your administrator assigned are applied automatically.
        </p>
      </div>

      <div className="panel flex items-start gap-4 rounded-card p-5">
        <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-secondary-soft text-secondary-soft-contrast">
          <ShieldCheck size={19} />
        </span>
        <div>
          <p className="eyebrow">Secure setup</p>
          <p className="mt-1.5 text-sm text-ink">
            Role and institution cannot be changed from the browser.
          </p>
        </div>
      </div>

      <Link
        href="/onboarding/profile"
        className="flex w-full items-center justify-center gap-2 rounded-card bg-primary px-4 py-3 text-sm font-semibold text-primary-contrast transition-[background-color,transform] hover:bg-primary-hover active:scale-[0.99]"
      >
        Continue setup
        <ArrowRight size={17} />
      </Link>
    </div>
  )
}
