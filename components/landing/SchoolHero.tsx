"use client"

import * as React from "react"
import { motion } from "motion/react"
import { ArrowRight, Globe } from "lucide-react"
import { labelsFor, type Vocabulary } from "@/lib/ui/labels"
import { Cta } from "./primitives"
import { SchoolBrandMark } from "./SchoolBrandMark"

export interface SchoolHeroProps {
  name: string
  logoUrl?: string | null
  host: string
  website?: string | null
  establishedYear?: number | null
  vocabulary?: Vocabulary
}

export function SchoolHero({
  name,
  logoUrl,
  host,
  website,
  establishedYear,
  vocabulary = "academic",
}: SchoolHeroProps) {
  const labels = labelsFor(vocabulary)

  // `domain` is free text on the school record and is often just a mail
  // domain fragment, so only something shaped like a hostname becomes a link.
  const websiteHost =
    website && /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(website.trim()) ? website.trim() : null

  return (
    <section className="surface-wash relative overflow-hidden px-5 pt-32 pb-20 sm:px-8 sm:pt-40 sm:pb-24">
      <motion.div
        initial={{ opacity: 0, y: 26 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto max-w-3xl text-center"
      >
        <SchoolBrandMark
          name={name}
          logoUrl={logoUrl}
          size={72}
          className="mx-auto rounded-[18px]"
        />

        <h1 className="mt-8 font-display text-[2.5rem] leading-[1.05] font-semibold text-ink sm:text-6xl">
          {name}
        </h1>

        <p className="mt-6 text-lg leading-relaxed text-ink-muted">
          The learning portal for {name}. {labels.coursePlural}, {labels.liveClassPlural.toLowerCase()},
          {" "}
          {labels.registration.toLowerCase()} and results — in one place, on one address.
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Cta href="/login">
            Sign in
            <ArrowRight size={18} />
          </Cta>
          <Cta href="#platform" variant="outline">
            What&apos;s inside
          </Cta>
        </div>

        <dl className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-ink-subtle">
          <div className="flex items-center gap-2">
            <Globe size={15} aria-hidden />
            <dt className="sr-only">Address</dt>
            <dd>{host}</dd>
          </div>
          {websiteHost ? (
            <div>
              <dt className="sr-only">Website</dt>
              <dd>
                <a
                  href={`https://${websiteHost}`}
                  rel="noreferrer noopener"
                  target="_blank"
                  className="transition-colors hover:text-ink"
                >
                  {websiteHost}
                </a>
              </dd>
            </div>
          ) : null}
          {establishedYear ? (
            <div>
              <dt className="sr-only">On the platform since</dt>
              <dd>Since {establishedYear}</dd>
            </div>
          ) : null}
        </dl>
      </motion.div>
    </section>
  )
}
