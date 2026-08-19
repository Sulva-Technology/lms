import * as React from "react"
import { cn } from "@/lib/utils"

export function GlassPanel({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("panel rounded-panel p-6", className)} {...props}>
      {children}
    </div>
  )
}
