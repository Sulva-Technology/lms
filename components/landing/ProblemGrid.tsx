"use client"

import * as React from "react"
import {
  ClipboardX,
  FileSpreadsheet,
  KeyRound,
  MessageSquareOff,
  Search,
  Video,
} from "lucide-react"
import { labelsFor, type Vocabulary } from "@/lib/ui/labels"
import { Reveal, SectionHeading } from "./primitives"

export interface ProblemGridProps {
  title?: string
  vocabulary?: Vocabulary
}

/**
 * Names the problem before selling the fix. Six concrete failures a school
 * recognises beat one abstract claim about transformation.
 */
export function ProblemGrid({ title, vocabulary = "academic" }: ProblemGridProps) {
  const labels = labelsFor(vocabulary)
  const lower = (value: string) => value.toLowerCase()

  const problems = [
    {
      icon: FileSpreadsheet,
      title: "Records in spreadsheets",
      body: `Results, attendance and ${lower(labels.enrollment)} live in files nobody can reconcile at the end of ${lower(labels.term)}.`,
    },
    {
      icon: Video,
      title: "Classes on borrowed tools",
      body: `${labels.liveClassPlural} run on links pasted into chat groups, with no register and no recording anyone can find later.`,
    },
    {
      icon: KeyRound,
      title: "Access nobody controls",
      body: `Former ${lower(labels.learnerPlural)} keep their logins because there is no single place that ends an account.`,
    },
    {
      icon: ClipboardX,
      title: `${labels.registration} by queue`,
      body: `${labels.learnerPlural} spend the first week of ${lower(labels.term)} in a corridor instead of a classroom.`,
    },
    {
      icon: Search,
      title: "No view of who is struggling",
      body: `The ${lower(labels.learner)} who stopped attending three weeks ago surfaces when the results are already final.`,
    },
    {
      icon: MessageSquareOff,
      title: "Announcements that reach nobody",
      body: `A schedule change goes out on a platform half the ${lower(labels.instructorPlural)} do not check.`,
    },
  ]

  return (
    <section id="problem" className="border-y border-line bg-canvas-sunken px-5 py-24 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="What it looks like today"
          title={title ?? "Running an institution shouldn't feel like this."}
          description="Every one of these is normal. None of them has to be."
        />

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {problems.map(({ icon: Icon, title: heading, body }, index) => (
            <Reveal key={heading} delay={index * 0.05}>
              <article className="panel h-full rounded-card p-6">
                <span className="grid size-10 place-items-center rounded-[10px] bg-status-soft text-ink-muted">
                  <Icon size={18} />
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold text-ink">{heading}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-ink-muted">{body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
