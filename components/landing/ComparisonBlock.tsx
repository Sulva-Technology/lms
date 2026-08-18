"use client"

import * as React from "react"
import { Check, X } from "lucide-react"
import { Reveal } from "./primitives"

export interface ComparisonBlockProps {
  title?: string
  description?: string
  /** A school host names itself in the winning column. */
  ownColumnLabel?: string
  rows?: Array<{ without: string; with: string }>
}

const DEFAULT_ROWS = [
  { without: "Links, files and results in four places", with: "One record per person, per course, per term" },
  { without: "Attendance taken on paper, typed up later", with: "Attendance captured as the class happens" },
  { without: "Shared logins that outlive the student", with: "Roles and accounts you can end in one click" },
  { without: "Results assembled by hand at term end", with: "A gradebook that is already current" },
  { without: "Your institution as a line item in someone's tenant list", with: "Your domain, your colours, your front door" },
]

/**
 * The contrast break in the page. `data-theme="dark"` rather than hard-coded
 * dark colours means the school's accent resolves to its dark-mode shade in
 * here, so branding survives the inversion.
 */
export function ComparisonBlock({
  title,
  description,
  ownColumnLabel = "On this platform",
  rows = DEFAULT_ROWS,
}: ComparisonBlockProps) {
  return (
    <section data-theme="dark" className="contrast-block px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-5xl">
        <div className="max-w-2xl">
          <p className="eyebrow">The difference</p>
          <h2 className="mt-4 font-display text-3xl leading-[1.12] font-semibold text-ink sm:text-4xl md:text-[2.75rem]">
            {title ?? "Same institution. Different week."}
          </h2>
          {description ? (
            <p className="mt-5 text-lg leading-relaxed text-ink-muted">{description}</p>
          ) : null}
        </div>

        <div className="mt-14 overflow-hidden rounded-panel border border-glass-border">
          <div className="grid grid-cols-1 divide-y divide-glass-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            <div className="bg-ink/[0.06] px-6 py-5">
              <p className="eyebrow">Without a system</p>
            </div>
            <div className="bg-primary/15 px-6 py-5">
              <p className="eyebrow text-ink">{ownColumnLabel}</p>
            </div>
          </div>

          {rows.map((row, index) => (
            <Reveal key={row.with} delay={index * 0.05}>
              <div className="grid grid-cols-1 divide-y divide-glass-border border-t border-glass-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                <div className="flex items-start gap-3 px-6 py-5">
                  <X size={17} className="mt-0.5 shrink-0 text-ink-subtle" aria-hidden />
                  <span className="text-sm leading-relaxed text-ink-muted">{row.without}</span>
                </div>
                <div className="flex items-start gap-3 bg-primary/[0.08] px-6 py-5">
                  <Check size={17} className="mt-0.5 shrink-0 text-primary" aria-hidden />
                  <span className="text-sm leading-relaxed text-ink">{row.with}</span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
