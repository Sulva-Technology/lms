import * as React from "react"
import { cn } from "@/lib/utils"

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  /** Raises the card off the canvas for the one element a screen leads with. */
  heavy?: boolean
}

/**
 * The default surface a dashboard screen is built from. Named for the old
 * glass language it replaced; kept because ninety files import it.
 */
export function GlassCard({ className, hover = true, heavy = false, children, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        heavy ? "glass" : "panel",
        "rounded-card p-6",
        hover && "transition-[border-color,box-shadow] duration-200 hover:border-line-strong",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
