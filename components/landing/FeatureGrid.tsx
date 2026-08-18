"use client"

import * as React from "react"
import { ArrowUpRight, ClipboardCheck, GraduationCap, LayoutDashboard, MonitorPlay } from "lucide-react"
import { labelsFor, type Vocabulary } from "@/lib/ui/labels"
import { Reveal, SectionHeading } from "./primitives"

export interface FeatureGridProps {
  title?: string
  description?: string
  /** Card copy follows the tenant's wording; the platform page stays academic. */
  vocabulary?: Vocabulary
}

export function FeatureGrid({ title, description, vocabulary = "academic" }: FeatureGridProps) {
  const labels = labelsFor(vocabulary)
  const lower = (value: string) => value.toLowerCase()

  const features = [
    {
      eyebrow: "Teaching",
      icon: MonitorPlay,
      title: `${labels.liveClassPlural} in the browser`,
      body: `Scheduled sessions with a register that fills itself, recordings kept with the ${lower(labels.course)}, and no link to paste anywhere.`,
      wide: true,
    },
    {
      eyebrow: "Enrolment",
      icon: ClipboardCheck,
      title: labels.registration,
      body: `${labels.learnerPlural} pick ${lower(labels.coursePlural)} against real prerequisites and capacity, so the first week is teaching rather than queueing.`,
    },
    {
      eyebrow: "Administration",
      icon: LayoutDashboard,
      title: "One view of the institution",
      body: `${labels.facultyPlural}, ${lower(labels.departmentPlural)}, ${lower(labels.programPlural)} and people — structured once and reportable from then on.`,
    },
    {
      eyebrow: "Outcomes",
      icon: GraduationCap,
      title: "Grades that are already current",
      body: `Submissions, marks and attendance accumulate through the ${lower(labels.term)}, and certificates come out of the same record.`,
      wide: true,
    },
  ]

  return (
    <section id="platform" className="px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="What you get"
          title={title ?? "Everything the institution runs, in one place."}
          description={
            description ??
            "Not a course player bolted to a video call. The registry, the classroom and the record, built as one system."
          }
        />

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {features.map(({ icon: Icon, eyebrow, title: heading, body, wide }, index) => (
            <Reveal
              key={heading}
              delay={index * 0.06}
              className={wide ? "md:col-span-2" : undefined}
            >
              <article className="panel group h-full rounded-panel p-7 transition-[border-color,box-shadow] duration-300 hover:border-line-strong sm:p-9">
                <div className="flex items-start justify-between gap-4">
                  <span className="grid size-11 place-items-center rounded-[12px] bg-primary-soft text-primary-soft-contrast">
                    <Icon size={19} />
                  </span>
                  <ArrowUpRight
                    size={18}
                    aria-hidden
                    className="text-ink-subtle opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  />
                </div>
                <p className="eyebrow mt-6">{eyebrow}</p>
                <h3 className="mt-3 font-display text-xl font-semibold text-ink sm:text-2xl">
                  {heading}
                </h3>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-muted sm:text-base">
                  {body}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
