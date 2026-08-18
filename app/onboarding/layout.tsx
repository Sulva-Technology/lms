"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { usePathname, useRouter } from "next/navigation"

const STEPS = [
  { match: "/university", label: "Institution" },
  { match: "/role", label: "Role" },
  { match: "/profile", label: "Profile" },
]

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  const step = STEPS.findIndex((entry) => pathname.includes(entry.match)) + 1

  return (
    <div className="surface-wash flex min-h-screen flex-col px-5 py-6 sm:px-8 sm:py-8">
      <header className="mx-auto flex w-full max-w-4xl items-center justify-between">
        <Link href="/" className="font-display text-lg font-semibold tracking-tight text-ink">
          VUI LMS
        </Link>

        {step > 0 ? (
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-pill border border-line-strong px-4 py-2 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
          >
            <ArrowLeft size={15} aria-hidden />
            Back
          </button>
        ) : null}
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center py-12">
        {step > 0 ? (
          <ol className="mb-10 flex items-center justify-center gap-3">
            {STEPS.map((entry, index) => {
              const position = index + 1
              const done = position <= step
              return (
                <li key={entry.label} className="flex items-center gap-2">
                  <span
                    className={
                      done
                        ? "h-1.5 w-12 rounded-pill bg-primary transition-all duration-500"
                        : "h-1.5 w-5 rounded-pill bg-line-strong transition-all duration-500"
                    }
                  />
                  <span className="sr-only">
                    {entry.label}
                    {done ? " (current or complete)" : ""}
                  </span>
                </li>
              )
            })}
          </ol>
        ) : null}

        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12, transition: { duration: 0.18 } }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
