import * as React from "react"
import { cn } from "@/lib/utils"

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: "success" | "warning" | "error" | "info" | "neutral"
  pulse?: boolean
}

// Status keeps its own colours in every theme. Only "info" follows the brand,
// because that is the one that means "this is ours", not "this went wrong".
const TONE = {
  success: { fill: "bg-success/10 text-success", dot: "bg-success" },
  warning: { fill: "bg-warn/10 text-warn", dot: "bg-warn" },
  error: { fill: "bg-danger/10 text-danger", dot: "bg-danger" },
  info: { fill: "bg-primary-soft text-primary-soft-contrast", dot: "bg-primary" },
  neutral: { fill: "bg-status-soft text-ink-muted", dot: "bg-ink-subtle" },
} as const

export function StatusBadge({ className, status, pulse, children, ...props }: StatusBadgeProps) {
  const tone = TONE[status]

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        tone.fill,
        className,
      )}
      {...props}
    >
      {pulse ? (
        <span className="relative flex size-2">
          <span
            className={cn("absolute inline-flex size-full animate-ping rounded-full opacity-75", tone.dot)}
          />
          <span className={cn("relative inline-flex size-2 rounded-full", tone.dot)} />
        </span>
      ) : null}
      {children}
    </span>
  )
}
