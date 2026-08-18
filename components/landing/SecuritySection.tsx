"use client"

import * as React from "react"
import { DatabaseZap, Fingerprint, Lock } from "lucide-react"
import { Reveal, SectionHeading } from "./primitives"

export interface SecuritySectionProps {
  title?: string
  description?: string
}

const GUARANTEES = [
  {
    icon: DatabaseZap,
    title: "Separated at the database",
    body: "Every row belongs to one institution, and the database enforces it — not the page that happens to be rendering.",
  },
  {
    icon: Fingerprint,
    title: "Roles decide what loads",
    body: "What a person can see is settled before the data is fetched, so a link to the wrong page returns nothing rather than something.",
  },
  {
    icon: Lock,
    title: "Encrypted in transit and at rest",
    body: "Files, recordings and results are stored under paths scoped to the institution that owns them.",
  },
]

export function SecuritySection({ title, description }: SecuritySectionProps) {
  return (
    <section
      id="security"
      className="border-y border-line bg-canvas-sunken px-5 py-24 sm:px-8 sm:py-28"
    >
      <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-20">
        <SectionHeading
          align="left"
          eyebrow="Isolation"
          title={title ?? "Your institution's records stay yours."}
          description={
            description ??
            "Multi-tenancy is a promise about who can read what. It is worth nothing unless the database keeps it."
          }
        />

        <div className="grid gap-4">
          {GUARANTEES.map(({ icon: Icon, title: heading, body }, index) => (
            <Reveal key={heading} delay={index * 0.07}>
              <article className="panel flex gap-5 rounded-card p-6">
                <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-secondary-soft text-secondary-soft-contrast">
                  <Icon size={18} />
                </span>
                <div>
                  <h3 className="font-display text-lg font-semibold text-ink">{heading}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">{body}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
