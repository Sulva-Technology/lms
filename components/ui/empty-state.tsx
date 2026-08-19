"use client"

import * as React from "react"
import { motion, HTMLMotionProps } from "motion/react"
import { cn } from "@/lib/utils"
import { fadeUp } from "@/lib/motion"

export interface EmptyStateProps extends HTMLMotionProps<"div"> {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action, className, ...props }: EmptyStateProps) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className={cn(
        "panel flex flex-col items-center justify-center rounded-card px-6 py-14 text-center",
        className,
      )}
      {...props}
    >
      {icon ? (
        <span className="grid size-12 place-items-center rounded-full bg-status-soft text-ink-subtle">
          {icon}
        </span>
      ) : null}
      <h3 className="mt-5 font-display text-lg font-semibold text-ink">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </motion.div>
  )
}
