"use client"

import * as React from "react"
import { ArrowRight } from "lucide-react"
import { Cta } from "./primitives"

export interface FinalCTAProps {
  title?: string
  description?: string
  /** A school host sends visitors to sign in instead of starting a new school. */
  action?: { href: string; label: string }
  secondaryAction?: { href: string; label: string }
}

export function FinalCTA({ title, description, action, secondaryAction }: FinalCTAProps) {
  const primary = action ?? { href: "/onboarding", label: "Start your institution" }

  return (
    <section id="contact" data-theme="dark" className="contrast-block px-5 py-28 sm:px-8 sm:py-36">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="font-display text-3xl leading-[1.1] font-semibold text-ink sm:text-5xl">
          {title ?? "Ready to run it properly?"}
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ink-muted">
          {description ??
            "Bring the spreadsheets, the chat groups and the missing register. It comes out the other side as one system your institution owns."}
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Cta href={primary.href} variant="onDark">
            {primary.label}
            <ArrowRight size={18} />
          </Cta>
          {secondaryAction ? (
            <Cta href={secondaryAction.href} variant="outline" className="border-glass-border text-ink">
              {secondaryAction.label}
            </Cta>
          ) : null}
        </div>
      </div>
    </section>
  )
}
