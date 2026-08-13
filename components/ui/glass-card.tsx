import * as React from "react"
import { cn } from "@/lib/utils"

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  heavy?: boolean;
}

export function GlassCard({ className, hover = true, heavy = false, children, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        heavy ? "glass-panel-heavy" : "glass-panel",
        hover && "transition-colors hover:bg-slate-900/60 shadow-lg hover:shadow-xl",
        "rounded-2xl p-6",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
