"use client"

import * as React from "react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"

export interface PageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
  tags?: string[]
  className?: string
}

/**
 * The top of a dashboard screen. It used to be a full-bleed gradient slab; a
 * working screen is read many times a day, so the header now states what the
 * page is and gets out of the way.
 */
export function PageHeader({ title, description, action, tags, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-col gap-5 border-b border-line pb-6 lg:flex-row lg:items-end lg:justify-between",
        className,
      )}
    >
      <div className="max-w-2xl">
        {tags && tags.length > 0 ? (
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {tags.map((tag, index) => (
              <span
                key={tag}
                className={cn(
                  "rounded-pill px-2.5 py-1 text-xs font-semibold",
                  index === 0
                    ? "bg-primary-soft text-primary-soft-contrast"
                    : "bg-status-soft text-ink-muted",
                )}
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-2xl font-semibold text-ink sm:text-3xl"
        >
          {title}
        </motion.h1>

        {description ? (
          <p className="mt-2 text-sm leading-relaxed text-ink-muted sm:text-base">{description}</p>
        ) : null}
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}
