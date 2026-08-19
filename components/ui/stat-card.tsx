import * as React from "react"
import { cn } from "@/lib/utils"

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  value: string | number
  trend?: {
    value: number
    label?: string
    direction: "up" | "down" | "neutral"
  }
  icon?: React.ReactNode
  colorClass?: string
}

const TREND_TONE = {
  up: "text-success bg-success/10",
  down: "text-danger bg-danger/10",
  neutral: "text-ink-muted bg-status-soft",
} as const

export function StatCard({
  title,
  value,
  trend,
  icon,
  colorClass = "text-primary-soft-contrast bg-primary-soft",
  className,
  ...props
}: StatCardProps) {
  return (
    <div className={cn("panel rounded-card p-5", className)} {...props}>
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-medium text-ink-muted">{title}</p>
        {icon ? (
          <span className={cn("grid size-9 shrink-0 place-items-center rounded-[10px]", colorClass)}>
            {icon}
          </span>
        ) : null}
      </div>

      <p className="mt-4 font-display text-3xl font-semibold tabular-nums text-ink">{value}</p>

      {trend ? (
        <div className="mt-2.5 flex items-center gap-2">
          <span
            className={cn(
              "rounded-pill px-2 py-0.5 text-xs font-semibold tabular-nums",
              TREND_TONE[trend.direction],
            )}
          >
            {trend.direction === "up" ? "+" : ""}
            {trend.value}%
          </span>
          {trend.label ? <span className="text-xs text-ink-subtle">{trend.label}</span> : null}
        </div>
      ) : null}
    </div>
  )
}
