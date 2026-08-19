"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "motion/react"
import { ArrowLeft } from "lucide-react"

export interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  /** A school host signs its own sign-in page. */
  brand?: { name: string; logoUrl?: string | null }
  /** Shown on the panel beside the form on wide screens. */
  aside?: React.ReactNode
}

export function AuthLayout({ children, title, subtitle, brand, aside }: AuthLayoutProps) {
  const name = brand?.name ?? "Sulva LMS"

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <div className="surface-wash flex flex-col justify-center px-5 py-14 sm:px-10 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto w-full max-w-sm"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-ink-subtle transition-colors hover:text-ink"
          >
            <ArrowLeft size={15} aria-hidden />
            Back to {name}
          </Link>

          <h1 className="mt-10 font-display text-3xl font-semibold text-ink sm:text-4xl">{title}</h1>
          {subtitle ? <p className="mt-3 text-base text-ink-muted">{subtitle}</p> : null}

          <div className="mt-9">{children}</div>

          <p className="mt-12 text-xs text-ink-subtle">
            © {new Date().getFullYear()} {name}. All rights reserved.
          </p>
        </motion.div>
      </div>

      {/* The contrast half. Hidden on small screens, where it would be scrolled
          past rather than read. */}
      <aside
        data-theme="dark"
        className="contrast-block relative hidden flex-col justify-end p-14 lg:flex"
      >
        {aside ?? <DefaultAside name={name} />}
      </aside>
    </div>
  )
}

function DefaultAside({ name }: { name: string }) {
  return (
    <div className="max-w-sm">
      <p className="eyebrow">{name}</p>
      <p className="mt-5 font-display text-3xl leading-[1.15] font-semibold text-ink">
        One account for your courses, classes and results.
      </p>
      <p className="mt-5 text-sm leading-relaxed text-ink-muted">
        Your institution issued this account. Everything it opens belongs to your institution and
        stays inside it.
      </p>
    </div>
  )
}
