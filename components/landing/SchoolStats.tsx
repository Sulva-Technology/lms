"use client"

import * as React from "react"
import { labelsFor, type Vocabulary } from "@/lib/ui/labels"
import type { TenantStats } from "@/lib/tenant/profile"
import { StatsBand } from "./StatsBand"

export interface SchoolStatsProps {
  stats: TenantStats
  vocabulary?: Vocabulary
}

/**
 * Headline counts for the school. Anything still at zero is left out rather
 * than shown as a "0" — a school that has not built out its structure yet
 * should not advertise the gap on its own front page.
 */
export function SchoolStats({ stats, vocabulary = "academic" }: SchoolStatsProps) {
  const labels = labelsFor(vocabulary)

  const tiles = [
    { value: stats.faculties, label: labels.facultyPlural },
    { value: stats.departments, label: labels.departmentPlural },
    { value: stats.programs, label: labels.programPlural },
    { value: stats.courses, label: `Published ${labels.coursePlural}` },
  ].filter((tile) => tile.value > 0)

  if (tiles.length === 0) return null

  return (
    <div id="about">
      <StatsBand
        caption={`Inside ${labels.tenant === "University" ? "the campus" : "the organisation"}`}
        stats={tiles}
      />
    </div>
  )
}
