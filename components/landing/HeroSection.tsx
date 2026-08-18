"use client"

import * as React from "react"
import { motion } from "motion/react"
import { ArrowRight, CalendarClock, Radio, ShieldCheck } from "lucide-react"
import { Cta } from "./primitives"

export interface HeroSectionProps {
  eyebrow?: string
  /** Rendered on two lines: a stated claim, then a quieter promise. */
  headline?: [string, string]
  description?: string
  primaryAction?: { href: string; label: string }
  secondaryAction?: { href: string; label: string }
  /** Small proof points under the buttons. */
  assurances?: string[]
}

const DEFAULTS = {
  eyebrow: "One platform for the whole institution",
  headline: ["BUILT TO TEACH.", "Designed to last."] as [string, string],
  description:
    "Registration, live classes, grading and administration in one system your institution actually owns — on your own domain, in your own colours.",
  primaryAction: { href: "/onboarding", label: "Start your school" },
  secondaryAction: { href: "#how", label: "See how it works" },
  assurances: ["Own subdomain", "Tenant-isolated records", "Live classes built in"],
}

export function HeroSection({
  eyebrow = DEFAULTS.eyebrow,
  headline = DEFAULTS.headline,
  description = DEFAULTS.description,
  primaryAction = DEFAULTS.primaryAction,
  secondaryAction = DEFAULTS.secondaryAction,
  assurances = DEFAULTS.assurances,
}: HeroSectionProps) {
  return (
    <section className="surface-wash relative overflow-hidden px-5 pt-32 pb-20 sm:px-8 sm:pt-40 sm:pb-28">
      <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="eyebrow">{eyebrow}</p>

          <h1 className="mt-6 font-display text-[2.75rem] leading-[1.04] font-semibold text-ink sm:text-6xl lg:text-[4.25rem]">
            <span className="block">{headline[0]}</span>
            <span className="block font-normal text-ink-muted">{headline[1]}</span>
          </h1>

          <p className="mt-7 max-w-xl text-lg leading-relaxed text-ink-muted">{description}</p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Cta href={primaryAction.href}>
              {primaryAction.label}
              <ArrowRight size={18} />
            </Cta>
            <Cta href={secondaryAction.href} variant="outline">
              {secondaryAction.label}
            </Cta>
          </div>

          <ul className="mt-10 flex flex-wrap gap-x-7 gap-y-3">
            {assurances.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-ink-subtle">
                <span className="size-1.5 rounded-full bg-primary" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </motion.div>

        <HeroPanel />
      </div>
    </section>
  )
}

const PANEL_ROWS = [
  { icon: Radio, label: "Live now", value: "Organic Chemistry · 42 present", tone: "live" },
  { icon: CalendarClock, label: "Next up", value: "Lab Report II due 16:00", tone: "muted" },
  { icon: ShieldCheck, label: "Records", value: "Isolated to your tenant", tone: "muted" },
] as const

/** The one glass object on the page. It earns the blur by being the focal point. */
function HeroPanel() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 34 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
      className="glass rounded-panel p-2"
    >
      <div className="rounded-[1.15rem] bg-surface/80 p-6 sm:p-7">
        <div className="flex items-center justify-between">
          <p className="eyebrow">Today</p>
          <span className="inline-flex items-center gap-1.5 rounded-pill bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-soft-contrast">
            <span className="size-1.5 animate-pulse rounded-full bg-primary" aria-hidden />
            On schedule
          </span>
        </div>

        <ul className="mt-6 space-y-3">
          {PANEL_ROWS.map(({ icon: Icon, label, value, tone }) => (
            <li
              key={label}
              className="flex items-center gap-4 rounded-card border border-line bg-canvas/60 px-4 py-3.5"
            >
              <span
                className={
                  tone === "live"
                    ? "grid size-9 place-items-center rounded-[10px] bg-primary text-primary-contrast"
                    : "grid size-9 place-items-center rounded-[10px] bg-status-soft text-ink-muted"
                }
              >
                <Icon size={17} />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-medium tracking-wide text-ink-subtle uppercase">
                  {label}
                </span>
                <span className="block truncate text-sm font-medium text-ink">{value}</span>
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex items-baseline justify-between border-t border-line pt-5">
          <span className="text-sm text-ink-muted">Term progress</span>
          <span className="font-display text-2xl font-semibold text-ink">68%</span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-pill bg-status-soft">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "68%" }}
            transition={{ duration: 1.1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="h-full rounded-pill bg-primary"
          />
        </div>
      </div>
    </motion.div>
  )
}
