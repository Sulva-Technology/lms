"use client"

import * as React from "react"
import { labelsFor, type Vocabulary } from "@/lib/ui/labels"
import { Reveal, SectionHeading } from "./primitives"

export interface HowItWorksProps {
  title?: string
  description?: string
  vocabulary?: Vocabulary
  steps?: Array<{ title: string; body: string }>
}

export function HowItWorks({ title, description, vocabulary = "academic", steps }: HowItWorksProps) {
  const labels = labelsFor(vocabulary)
  const lower = (value: string) => value.toLowerCase()

  const resolved =
    steps ??
    [
      {
        title: "Claim your address",
        body: "Your institution gets its own subdomain. Everything below lives there, separated from every other tenant at the database level.",
      },
      {
        title: `Bring in ${lower(labels.instructorPlural)} and ${lower(labels.learnerPlural)}`,
        body: `Invite by email or import a list. Roles decide what each person sees, and an account ends when you end it.`,
      },
      {
        title: `Publish ${lower(labels.coursePlural)} and schedules`,
        body: `${labels.coursePlural}, materials, assessments and ${lower(labels.liveClassPlural)} go up once and stay in one place for the whole ${lower(labels.term)}.`,
      },
      {
        title: "Teach, mark, and see the term",
        body: "Attendance, submissions and grades accumulate as you go, so the end of term is a report rather than a reconstruction.",
      },
    ]

  return (
    <section id="how" className="px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="How it works"
          title={title ?? "Four steps, then it runs."}
          description={
            description ??
            "No migration project, no integration quarter. A school can be teaching on it the same week."
          }
        />

        <ol className="mt-16 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {resolved.map((step, index) => (
            <Reveal key={step.title} delay={index * 0.08}>
              <li className="relative list-none">
                {/* The rule runs between steps, not after the last one. */}
                {index < resolved.length - 1 ? (
                  <span
                    aria-hidden
                    className="absolute top-5 left-12 hidden h-px w-[calc(100%-1rem)] bg-line lg:block"
                  />
                ) : null}
                <span className="grid size-10 place-items-center rounded-pill bg-primary font-display text-sm font-semibold text-primary-contrast">
                  {index + 1}
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold text-ink">{step.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-ink-muted">{step.body}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
}
